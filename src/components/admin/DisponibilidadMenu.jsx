import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { claveDisponibilidad, DOCUMENTO_DISPONIBILIDAD, ensamblarMenu, estaAgotado, gruposDisponibilidad, idOpcion } from "../../config/disponibilidadMenu";
import usePreciosMenu from "../../hooks/usePreciosMenu";

const leer = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
const turnos = [
  ["desayunos", "Mañana"],
  ["noche", "Tarde / noche"],
  ["compartido", "Compartidos"],
];
function turnoDe(p) {
  const lista = p.turnos ?? ["noche"];
  return lista.includes("desayunos") ? (lista.includes("noche") ? "compartido" : "desayunos") : "noche";
}

function Estado({ opcion, ocupado, guardar }) {
  const agotado = estaAgotado(opcion);
  return <button type="button" className="adm-status" data-agotado={agotado} disabled={ocupado || Boolean(opcion.motivoAgotado)}
    aria-pressed={!agotado} aria-label={`${opcion.nombre}: ${opcion.motivoAgotado || (agotado ? "Agotado" : "Disponible")}`}
    onClick={() => guardar(!agotado)}>{opcion.motivoAgotado || (agotado ? "Agotado" : "Disponible")}</button>;
}

export default function DisponibilidadMenu({ menuData }) {
  const { precios, cargando, error: errorPrecios } = usePreciosMenu();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ocupado, setOcupado] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [intento, setIntento] = useState(0);
  useEffect(() => onSnapshot(doc(db, "catalogos", DOCUMENTO_DISPONIBILIDAD), (snap) => {
    setDatos(snap.data()?.estados ?? {});
    setError("");
  }, () => setError("No se pudo leer la disponibilidad. Revisa la conexión y vuelve a intentar.")), [intento]);

  if (error) return <section className="adm-panel"><p className="op-error" role="alert">{error}</p>
    <button className="ops-action" onClick={() => { setDatos(null); setError(""); setIntento((n) => n + 1); }}>Reintentar</button></section>;
  if (!menuData || datos === null || cargando) return <p role="status">Cargando disponibilidad…</p>;
  const productos = ensamblarMenu(menuData, precios, { operacion: true, estados: datos });

  async function guardar(id, grupo, opcion, agotado) {
    if (ocupado) return;
    const clave = claveDisponibilidad(id, grupo, opcion);
    setOcupado(clave);
    setMensaje("");
    try {
      await setDoc(doc(db, "catalogos", DOCUMENTO_DISPONIBILIDAD), { estados: { [clave]: agotado } }, { merge: true });
      setMensaje(agotado ? "Marcado como agotado." : "Marcado como disponible.");
    } catch (e) {
      setMensaje(e.code === "permission-denied" ? "Tu cuenta no tiene permiso para cambiar la disponibilidad." : "No se pudo guardar. Revisa la conexión y vuelve a intentar.");
    } finally {
      setOcupado("");
    }
  }

  const visibles = productos.filter((p) => (filtro === "todos" || turnoDe(p) === filtro) &&
    leer([p.nombre, ...gruposDisponibilidad.flatMap(([grupo]) => (p[grupo] ?? []).map((o) => o.nombre))].join(" ")).includes(leer(busqueda.trim())));
  return <section className="adm-panel op-pila">
    <div><h2>Disponibilidad</h2><p className="op-suave">Gestiona productos y opciones de ambos turnos. Los compartidos tienen el mismo estado en los dos.</p></div>
    {errorPrecios && <p className="op-error" role="alert">No se pudieron verificar los precios. Revisa la pestaña Precios.</p>}
    <div className="adm-filtros" aria-label="Filtrar por turno">
      {[["todos", "Todo"], ...turnos].map(([id, nombre]) =>
        <button key={id} type="button" className="op-boton" aria-pressed={filtro === id} onClick={() => setFiltro(id)}>{nombre}</button>)}
    </div>
    <label className="op-campo">Buscar producto u opción<input type="search" value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)} placeholder="Ej. molletes, omelette, Oreos" /></label>
    {mensaje && <p className="op-suave" role="status">{mensaje}</p>}
    {!visibles.length && <p className="op-suave">No hay productos que coincidan.</p>}
    {turnos.map(([id, titulo]) => {
      const grupoTurno = visibles.filter((p) => turnoDe(p) === id);
      if (!grupoTurno.length) return null;
      return <section className="op-pila" key={id}>
        <h3>{titulo} <span className="op-etiqueta">{grupoTurno.length}</span></h3>
        <div className="adm-productos">
          {grupoTurno.map((p) => <details className="adm-producto" key={p.id}>
            <summary><span>{p.nombre}</span><span className="adm-indicador" data-agotado={estaAgotado(p)}>
              {estaAgotado(p) ? "Agotado" : "Disponible"}</span></summary>
            <div className="op-pila adm-producto-detalle">
              <div className="adm-fila"><b>Producto completo</b><Estado opcion={p} ocupado={Boolean(ocupado)}
                guardar={(valor) => guardar(p.id, "producto", "", valor)} /></div>
              {p.publicacionPendiente && <p className="op-suave">Pendiente de publicar en Precios. Aquí puedes ajustar su disponibilidad por adelantado.</p>}
              {(p.tipoPan ? [] : gruposDisponibilidad).map(([grupo, nombre]) => (p[grupo]?.length > 0) && <div key={grupo}>
                <h4 className="adm-subtitulo">{nombre}</h4>
                {p[grupo].map((opcion) => <div className="adm-fila" key={idOpcion(opcion)}>
                  <span>{opcion.nombre}</span><Estado opcion={opcion} ocupado={Boolean(ocupado)}
                    guardar={(valor) => guardar(p.id, grupo, idOpcion(opcion), valor)} />
                </div>)}
              </div>)}
            </div>
          </details>)}
        </div>
      </section>;
    })}
  </section>;
}
