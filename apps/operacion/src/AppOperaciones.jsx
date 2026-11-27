import { lazy, Suspense, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../src/firebase";
import AdminPanel from "../../../src/AdminPanel";
import LoginOperaciones from "./LoginOperaciones";
import { CATALOGOS_PREDETERMINADOS } from "../../../src/config/catalogos";

const MODULOS = [
  { id: "pos", nombre: "Punto de venta", descripcion: "Pedidos y cobros", roles: ["socio", "empleada"] },
  { id: "menu", nombre: "Menú", descripcion: "Precios y disponibilidad", roles: ["socio", "empleada"] },
  { id: "caja", nombre: "Caja", descripcion: "Apertura, movimientos y corte", roles: ["socio", "empleada"] },
  { id: "inventario", nombre: "Inventario y compras", descripcion: "Existencias, faltantes y lista de compras", roles: ["socio", "empleada"] },
  { id: "rentabilidad", nombre: "Costeo y recetario", descripcion: "Recetas, gastos y margen de productos", roles: ["socio"] },
  { id: "reportes", nombre: "Reportes", descripcion: "Ventas, usuarios y cortes", roles: ["socio"] },
];
const Costeo = lazy(() => import("./costeo/Costeo"));
const Inventario = lazy(() => import("./inventario/Inventario"));

function Inicio({ perfil, abrir }) {
  const disponibles = MODULOS.filter((modulo) => modulo.roles.includes(perfil.rol));
  return (
    <div className="op-pila">
      <div className="ops-heading"><h2>Inicio</h2><p className="op-suave">Elige una sección de Operación.</p></div>
      <div className="ops-tiles">
      {disponibles.map((modulo) => (
        <button key={modulo.id} onClick={() => abrir(modulo.id)} className="op-panel ops-tile-link">
          <span><b>{modulo.nombre}</b><small>{modulo.descripcion}</small></span><span aria-hidden="true">›</span>
        </button>
      ))}
      </div>
    </div>
  );
}

function Proximamente({ modulo }) {
  const info = MODULOS.find((item) => item.id === modulo);
  return (
    <section className="op-panel op-pila">
      <h2>{info?.nombre}</h2>
      <p className="op-suave">Disponible en una próxima actualización.</p>
    </section>
  );
}

export default function AppOperaciones() {
  const [usuario, setUsuario] = useState(undefined);
  const [perfil, setPerfil] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [catalogos, setCatalogos] = useState(CATALOGOS_PREDETERMINADOS);
  const [vista, setVista] = useState("inicio");
  const [errorAcceso, setErrorAcceso] = useState("");
  const [errorMenu, setErrorMenu] = useState("");

  useEffect(() => {
    let cerrarPerfil;
    const cerrarAuth = onAuthStateChanged(auth, (sesion) => {
      cerrarPerfil?.();
      setUsuario(sesion);
      setPerfil(null);
      setVista("inicio");
      if (!sesion) return;
      setErrorAcceso("");
      cerrarPerfil = onSnapshot(doc(db, "usuarios", sesion.uid), (snap) => {
        const datos = snap.data();
        if (datos?.activo !== true || !["socio", "empleada"].includes(datos.rol)) {
          setPerfil(null);
          setErrorAcceso("Tu cuenta no tiene acceso operativo. Contacta a un socio.");
          void signOut(auth);
          return;
        }
        setPerfil({ ...datos, uid: sesion.uid });
      }, () => {
        setPerfil(null);
        setErrorAcceso("No se pudo leer tu perfil de Operación. Revisa tu acceso e inicia sesión otra vez.");
        void signOut(auth);
      });
    });
    return () => { cerrarAuth(); cerrarPerfil?.(); };
  }, []);

  useEffect(() => {
    if (!perfil || vista !== "menu") return undefined;
    return onSnapshot(collection(db, "menu"), (snapshot) => {
      setMenuData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, () => setErrorMenu("No se pudo cargar el menú. Revisa la conexión y las reglas de Firestore."));
  }, [perfil, vista]);

  useEffect(() => {
    if (!perfil || vista !== "menu") return undefined;
    return onSnapshot(collection(db, "catalogos"), (snapshot) => {
      const remotos = {};
      snapshot.docs.forEach((item) => {
        const opciones = item.data().opciones;
        if (Array.isArray(opciones)) remotos[item.id] = opciones;
      });
      setCatalogos({ ...CATALOGOS_PREDETERMINADOS, ...remotos });
    }, () => setErrorMenu("No se pudieron cargar los catálogos. Revisa la conexión y las reglas de Firestore."));
  }, [perfil, vista]);

  if (usuario === undefined || (usuario && !perfil && !errorAcceso)) return <div className="ops-app ops-login" role="status">
    {usuario === undefined ? "Cargando…" : "Verificando perfil…"}
  </div>;
  if (!usuario || !perfil) return <LoginOperaciones errorAcceso={errorAcceso} />;

  const puedeAbrir = (id) => MODULOS.find((modulo) => modulo.id === id)?.roles.includes(perfil.rol);
  const abrir = (id) => {
    if (puedeAbrir(id)) { setErrorMenu(""); if (id === "menu") setMenuData(null); setVista(id); }
  };
  const volver = () => setVista("inicio");
  const activo = puedeAbrir(vista) ? vista : "inicio";

  return (
    <div className="ops-app">
      <header className="ops-barra">
        <div className="ops-marca">
          {activo !== "inicio" && <button className="op-boton ops-atras" onClick={volver} aria-label="Volver al inicio de Operación">← <span>Inicio</span></button>}
          <div><h1>MORCHIS Operación</h1><p>{perfil.nombre} · {perfil.rol === "socio" ? "Socios" : "Equipo"}</p></div>
        </div>
        <button onClick={() => signOut(auth)} className="op-boton">Salir</button>
      </header>
      <main className={`ops-espacio${activo === "rentabilidad" ? " ops-costeo" : ""}`}>
        {activo === "inicio" ? <Inicio perfil={perfil} abrir={abrir} /> :
          activo === "menu" ? <section className="ops-menu">
            {errorMenu && <p className="op-error" role="alert">{errorMenu}</p>}
            <AdminPanel menuData={menuData} catalogos={catalogos} />
          </section> :
          activo === "inventario" || activo === "rentabilidad" ? (
            <Suspense fallback={<p role="status">Abriendo módulo…</p>}>
              {activo === "inventario" ? <Inventario key={perfil.uid} perfil={perfil} /> : <Costeo key={perfil.uid} perfil={perfil} />}
            </Suspense>
          ) : <Proximamente modulo={activo} />}
      </main>
    </div>
  );
}
