import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../../../src/firebase";
import AdminPanel from "../../../src/AdminPanel";
import LoginOperaciones from "./LoginOperaciones";
import { CATALOGOS_PREDETERMINADOS } from "../../../src/config/catalogos";

const MODULOS = [
  { id: "pos", nombre: "Punto de venta", descripcion: "Pedidos y cobros", roles: ["socio", "empleada"] },
  { id: "menu", nombre: "Menú", descripcion: "Precios y disponibilidad", roles: ["socio", "empleada"] },
  { id: "caja", nombre: "Caja", descripcion: "Apertura, movimientos y corte", roles: ["socio", "empleada"] },
  { id: "inventario", nombre: "Compras", descripcion: "Faltantes y gasto estimado", roles: ["socio", "empleada"] },
  { id: "rentabilidad", nombre: "Rentabilidad", descripcion: "Costos y margen de productos", roles: ["socio"] },
  { id: "reportes", nombre: "Reportes", descripcion: "Ventas, usuarios y cortes", roles: ["socio"] },
];

function Inicio({ perfil, abrir }) {
  const disponibles = MODULOS.filter((modulo) => modulo.roles.includes(perfil.rol));
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {disponibles.map((modulo) => (
        <button key={modulo.id} onClick={() => abrir(modulo.id)} className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm active:scale-[.98]">
          <p className="font-black text-gray-950">{modulo.nombre}</p>
          <p className="mt-1 text-xs text-gray-500">{modulo.descripcion}</p>
        </button>
      ))}
    </div>
  );
}

function Proximamente({ modulo, volver }) {
  const info = MODULOS.find((item) => item.id === modulo);
  return (
    <section className="rounded-3xl border border-dashed border-orange-300 bg-orange-50 p-8 text-center">
      <h2 className="text-xl font-black text-gray-950">{info?.nombre}</h2>
      <p className="mt-2 text-sm text-gray-600">Módulo preparado para la siguiente fase.</p>
      <button onClick={volver} className="mt-5 rounded-xl bg-gray-950 px-5 py-3 text-xs font-black text-white">VOLVER</button>
    </section>
  );
}

export default function AppOperaciones() {
  const [usuario, setUsuario] = useState(undefined);
  const [perfil, setPerfil] = useState(null);
  const [menuData, setMenuData] = useState([]);
  const [catalogos, setCatalogos] = useState(CATALOGOS_PREDETERMINADOS);
  const [vista, setVista] = useState("inicio");
  const [errorAcceso, setErrorAcceso] = useState("");

  useEffect(() => onAuthStateChanged(auth, async (sesion) => {
    setUsuario(sesion);
    setPerfil(null);
    setErrorAcceso("");
    if (!sesion) return;
    const perfilDoc = await getDoc(doc(db, "usuarios", sesion.uid));
    const datos = perfilDoc.exists() ? perfilDoc.data() : null;
    if (!datos?.activo || !["socio", "empleada"].includes(datos.rol)) {
      setErrorAcceso("Tu cuenta no tiene acceso operativo. Contacta a un socio administrador.");
      await signOut(auth);
      return;
    }
    setPerfil({ uid: sesion.uid, ...datos });
  }), []);

  useEffect(() => {
    if (!perfil) return undefined;
    return onSnapshot(collection(db, "menu"), (snapshot) => {
      setMenuData(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    });
  }, [perfil]);

  useEffect(() => {
    if (!perfil) return undefined;
    return onSnapshot(collection(db, "catalogos"), (snapshot) => {
      const remotos = {};
      snapshot.docs.forEach((item) => { remotos[item.id] = item.data().opciones || []; });
      setCatalogos({ ...CATALOGOS_PREDETERMINADOS, ...remotos });
    });
  }, [perfil]);

  if (usuario === undefined) return <div className="min-h-screen bg-gray-950 grid place-items-center text-white font-black">Cargando…</div>;
  if (!usuario || !perfil) return <><LoginOperaciones />{errorAcceso && <p className="fixed bottom-4 left-4 right-4 mx-auto max-w-sm rounded-xl bg-red-600 p-3 text-center text-xs font-bold text-white">{errorAcceso}</p>}</>;

  const puedeAbrir = (id) => MODULOS.find((modulo) => modulo.id === id)?.roles.includes(perfil.rol);
  const abrir = (id) => puedeAbrir(id) && setVista(id);

  if (vista === "menu") return <AdminPanel menuData={menuData} catalogos={catalogos} cerrarAdmin={() => setVista("inicio")} />;

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10">
      <header className="mx-auto mb-6 flex max-w-3xl items-center justify-between rounded-2xl bg-gray-950 p-4 text-white shadow-lg">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-400">{perfil.rol}</p>
          <h1 className="font-black">Hola, {perfil.nombre}</h1>
        </div>
        <button onClick={() => signOut(auth)} className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold">Salir</button>
      </header>
      <main className="mx-auto max-w-3xl">
        {vista === "inicio" ? <Inicio perfil={perfil} abrir={abrir} /> : <Proximamente modulo={vista} volver={() => setVista("inicio")} />}
      </main>
    </div>
  );
}
