import { useState } from "react";
import { doc, runTransaction, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import PreciosMenuPanel from "./components/admin/PreciosMenuPanel";
import CatalogosPanel from "./components/admin/CatalogosPanel";
import ServicioDomicilio from "./components/admin/ServicioDomicilio";
import DisponibilidadMenu from "./components/admin/DisponibilidadMenu";
import { idOpcion } from "./config/disponibilidadMenu";
import "./styles/menu-operacion.css";

const secciones = [["disponibilidad", "Disponibilidad"], ["precios", "Precios"], ["sabores", "Sabores"], ["imagenes", "Imágenes"]];

function PreciosBase({ menuData }) {
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar(e, producto, grupo, item, campo) {
    e.preventDefault();
    const texto = new FormData(e.currentTarget).get("precio");
    if (guardando || texto === "" || !Number.isFinite(Number(texto)) || Number(texto) < 0) return;
    setGuardando(true);
    setMensaje("");
    try {
      const ref = doc(db, "menu", producto.id);
      await runTransaction(db, async (tx) => {
        const datos = (await tx.get(ref)).data();
        if (!datos?.[grupo]?.some((opcion) => idOpcion(opcion) === idOpcion(item))) throw new Error("La opción ya no existe.");
        tx.update(ref, { [grupo]: datos[grupo].map((opcion) =>
          idOpcion(opcion) === idOpcion(item) ? { ...opcion, [campo]: Number(texto) } : opcion) });
      });
      setMensaje(`Precio de ${item.nombre} guardado.`);
    } catch {
      setMensaje("No se pudo guardar el precio.");
    } finally {
      setGuardando(false);
    }
  }

  return <details className="adm-panel adm-producto">
    <summary>Precios registrados directamente en el menú</summary>
    <div className="op-pila adm-producto-detalle">
      {mensaje && <p role="status" className="op-suave">{mensaje}</p>}
      {menuData.map((p) => <details className="adm-producto" key={p.id}>
        <summary>{p.nombre}</summary>
        <div className="adm-producto-detalle">
        {[["variantes", "precioBase"], ["extras", "precio"]].map(([grupo, campo]) =>
          (grupo === "variantes" && (p.id === "sincronizadas" || p.id.startsWith("cafe_")) ? [] : p[grupo] ?? []).map((opcion) =>
            <form className="adm-precio" key={`${grupo}:${idOpcion(opcion)}`} onSubmit={(e) => guardar(e, p, grupo, opcion, campo)}>
              <label className="op-campo">{opcion.nombre}
                <input key={opcion[campo]} name="precio" type="number" min="0" step="0.01" inputMode="decimal" defaultValue={opcion[campo] ?? ""} required />
              </label><button type="submit" className="op-boton" disabled={guardando}>Guardar</button>
            </form>))}
        </div>
      </details>)}
    </div>
  </details>;
}

export default function AdminPanel({ menuData, catalogos }) {
  const [seccion, setSeccion] = useState("disponibilidad");
  const [actualizando, setActualizando] = useState(false);
  const [mensajeFotos, setMensajeFotos] = useState("");

  async function actualizarRutasWebp() {
    const cambios = menuData.flatMap((item) => {
      if (typeof item.imagen !== "string") return [];
      const imagen = item.imagen.trim().replace(/\.png$/i, ".webp");
      return imagen === item.imagen ? [] : [{ id: item.id, imagen }];
    });
    if (!cambios.length) { setMensajeFotos("Las rutas ya están actualizadas."); return; }
    if (!window.confirm(`Se actualizarán ${cambios.length} rutas. Verifica que existan las imágenes WebP antes de continuar.`)) return;
    setActualizando(true);
    setMensajeFotos("");
    try {
      const batch = writeBatch(db);
      for (const { id, imagen } of cambios) batch.update(doc(db, "menu", id), { imagen });
      await batch.commit();
      setMensajeFotos(`${cambios.length} rutas actualizadas.`);
    } catch {
      setMensajeFotos("No se pudieron actualizar las rutas.");
    } finally {
      setActualizando(false);
    }
  }

  return <div className="adm-menu">
    <nav aria-label="Secciones del menú" className="adm-nav">
      {secciones.map(([id, nombre]) => <button key={id} className="op-boton" type="button"
        aria-pressed={seccion === id} onClick={() => setSeccion(id)}>{nombre}</button>)}
    </nav>
    <div className="op-pila adm-contenido">
      <h2 className="adm-titulo">Menú</h2>
      <ServicioDomicilio />
      {seccion === "disponibilidad" && <DisponibilidadMenu menuData={menuData} />}
      {seccion === "precios" && (menuData ? <><PreciosMenuPanel menuData={menuData} /><PreciosBase menuData={menuData} /></> : <p role="status">Cargando menú…</p>)}
      {seccion === "sabores" && <CatalogosPanel catalogos={catalogos} />}
      {seccion === "imagenes" && <section className="adm-panel op-pila"><h3>Imágenes del menú</h3>
        <p className="op-suave">Elimina espacios al final de las rutas y cambia la extensión PNG por WebP.</p>
        <button className="op-boton op-principal op-ajuste" disabled={actualizando || !menuData} onClick={actualizarRutasWebp}>Actualizar rutas WebP</button>
        {mensajeFotos && <p role="status">{mensajeFotos}</p>}
      </section>}
    </div>
  </div>;
}
