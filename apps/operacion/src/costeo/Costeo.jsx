import { useState } from "react";
import { Aviso, Campo } from "../comun/OperativoUI";
import { publicarInsumo, useInventario } from "../inventario/datos";
import Inventario from "../inventario/Inventario";
import EditorCosteo from "./Editores";
import { crearRecetasManana, guardarCosteo, importarCosteo, useCosteo } from "./datos";
import { fusionarRespaldo, gastosFijos, leerArchivoCosteo, moneda, resumenCombo, resumenReceta } from "./modelo";
import "./costeo.css";

const tabs = [
  ["resumen", "Resumen", "M3 10l9-7 9 7v11H3zM9 21v-7h6v7"],
  ["recs", "Recetas", "M12 6c-3-3-7-3-10-2v15c3-1 7-1 10 2 3-3 7-3 10-2V4c-3-1-7-1-10 2v15"],
  ["ings", "Insumos", "M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 5 9-5M12 12v9"],
  ["compras", "Compras", "M2 3h3l2 12h12l3-9H6M8 20h1M18 20h1"],
  ["fixed", "Gastos", "M20 8V4H6a2 2 0 0 0 0 4h16v12H6a2 2 0 0 1-2-2V6m14 8h1"],
];
const filtrosReceta = [["all", "Menú general"], ["am", "Mañana"], ["sub", "Subrecetas"], ["combos", "Combos"]];
const plantillas = ["Baguette", "Chilaquiles", "Fruta del día", "Agua de fruta", "Agua de jamaica", "Torta fría", "Sándwich frío", "Licuado", "Ensalada"];
const borradorReceta = (filtro, n = "") => ({
  id: crypto.randomUUID(), n, sub: filtro === "sub", sh: filtro === "am" ? "am" : "all",
  price: 0, margin: 40, time: 0, yield: 1, lines: [], extras: [],
});

function Resumen({ data }) {
  const f = gastosFijos(data.fixed);
  const recetas = data.recs.filter((r) => !r.sub && r.price > 0)
    .flatMap((r) => { const info = resumenReceta(data, r); return info ? [{ ...info, id: r.id, n: r.n }] : []; });
  const rentables = [...recetas].sort((a, b) => b.utilidad - a.utilidad).slice(0, 5);
  const bajos = recetas.filter((r) => r.margen < 30).sort((a, b) => a.margen - b.margen);
  return <>
    <div className="costeo-kpis">
      {[["Costo por hora", moneda(f.minuto * 60)], ["Costo por minuto", moneda(f.minuto)],
        ["Platillos", data.recs.filter((r) => !r.sub).length], ["Gastos del mes", moneda(f.total)]].map(([n, valor]) =>
        <article className="op-panel op-kpi" key={n}><h3>{n}</h3><strong>{valor}</strong></article>)}
    </div>
    <div className="op-campos">{[[rentables, "Más rentables para llevar"], [bajos, "Margen menor al 30%"]].map(([lista, titulo]) =>
      <section className="op-panel op-pila" key={titulo}><h3>{titulo}</h3>
        {lista.length ? <ul className="op-lista">{lista.map((r) => <li key={r.id}><span>{r.n}</span>
          <b className={r.margen < 30 ? "costeo-margen-bajo" : "costeo-margen-sano"}>{moneda(r.utilidad)} · {r.margen.toFixed(1)}%</b></li>)}</ul> :
          <p className="op-suave">{recetas.length ? "Sin platillos con margen bajo." : "Agrega recetas con costo completo y precio de venta."}</p>}
      </section>)}</div>
  </>;
}

function descarga(data) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "morchis-respaldo-costeo.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Costeo({ perfil }) {
  const { data, existe, error, desdeCache } = useCosteo();
  const { items: inventario, error: errorInv } = useInventario();
  const [tab, setTab] = useState("resumen");
  const [filtro, setFiltro] = useState("all");
  const [editor, editar] = useState(null);
  const [respaldo, setRespaldo] = useState(null);
  const [estado, setEstado] = useState({});
  const [ocupado, setOcupado] = useState(false);
  if (error) return <Aviso error>{error}</Aviso>;
  if (!data) return <p role="status">Cargando costeo…</p>;
  const vistaPrevia = respaldo ? fusionarRespaldo(data, respaldo) : null;
  const ids = new Set((inventario ?? []).map((x) => x.id));
  const pendientes = data.ings.filter((i) => !ids.has(i.id));
  const sinVincular = (inventario ?? []).filter((i) => i.nombre && i.presentacion && !data.ings.some((x) => x.id === i.id));
  const proveedores = [...new Set(data.ings.map((i) => i.c))].sort((a, b) => a.localeCompare(b, "es-MX"));

  const nuevoInsumo = (id = crypto.randomUUID(), i) => editar({ grupo: "ings", o: null,
    nuevo: { id, n: i?.nombre ?? "", c: i?.tienda ?? "", u: i?.presentacion ?? "", e: false, p: null, q: 1, b: "pza", s: 0, m: 0, got: false } });
  const nuevaReceta = () => {
    if (filtro === "combos") editar({ grupo: "combos", o: null, nuevo: { id: crypto.randomUUID(), n: "", price: 0, items: [] } });
    else editar({ grupo: "recs", o: null, nuevo: borradorReceta(filtro) });
  };
  async function ejecutar(accion, mensaje) {
    setOcupado(true);
    setEstado({});
    try { await accion(); setEstado({ texto: typeof mensaje === "function" ? mensaje() : mensaje }); }
    catch (err) {
      const codigo = err.code ?? "";
      const mensajeError = codigo.endsWith("permission-denied")
        ? "Firebase no dio permiso para guardar. Entra como socio y revisa las reglas de costos en Firestore."
        : codigo.endsWith("unavailable") || codigo.endsWith("deadline-exceeded")
          ? "No se pudo conectar con Firebase. Revisa tu conexión y vuelve a intentar."
          : codigo ? "No se completó el guardado en Firebase. Vuelve a intentar." : err.message;
      setEstado({ error: true, texto: mensajeError });
    }
    finally { setOcupado(false); }
  }
  return <section className="costeo-layout" aria-label="Costeo y recetario">
    <nav className="costeo-nav" aria-label="Secciones de costeo">{tabs.map(([id, n, icono]) =>
      <button key={id} aria-pressed={tab === id} disabled={Boolean(editor) || ocupado} onClick={() => { setTab(id); setEstado({}); }}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round"><path d={icono} /></svg>
        {n}
      </button>)}</nav>
    <div className="costeo-contenido op-pila">
    <div className="costeo-titulo"><p className="op-suave">Costeo y recetario · Socios</p><h2>{tabs.find(([id]) => id === tab)?.[1]}</h2></div>
    {desdeCache && <p role="status" className="op-suave">Esperando confirmación de Firebase. Si este aviso continúa, revisa tu conexión.</p>}
    <Aviso error={estado.error}>{estado.texto}</Aviso>
    {editor && <EditorCosteo key={editor.o?.id ?? editor.nuevo?.id ?? "gastos"} grupo={editor.grupo}
      inicial={editor.nuevo ?? editor.o} data={data} vinculado={(inventario ?? []).find((i) => i.id === (editor.nuevo ?? editor.o).id)}
      cerrar={() => editar(null)} guardar={(n) => guardarCosteo(editor.grupo, editor.o, n)}
      eliminar={editor.o && editor.grupo !== "fixed" ? () => guardarCosteo(editor.grupo, editor.o, null) : null} />}
    {tab === "compras" && <Inventario perfil={perfil} />}
      {tab === "resumen" && <>
        <Resumen data={data} />
        <section className="op-panel op-pila">
          <h3>Respaldo del recetario</h3>
          <p className="op-suave">Agrega los registros del respaldo que aún no estén en el recetario. Si coinciden sus identificadores, se conserva la versión guardada en Operación.</p>
          {existe && <button disabled={ocupado || desdeCache} className="op-boton op-ajuste" onClick={() => descarga(data)}>Descargar respaldo actual</button>}
              <Campo etiqueta="Cargar respaldo JSON"><input type="file" accept=".json,application/json" disabled={ocupado} onChange={async (e) => {
                const archivo = e.target.files?.[0];
                e.target.value = "";
                setRespaldo(null);
                setEstado({});
                if (!archivo) return;
                try {
                  if (archivo.size > 1_000_000) throw new Error("El respaldo es demasiado grande para importarlo aquí.");
                  setRespaldo(leerArchivoCosteo(await archivo.text()));
                } catch (err) { setEstado({ error: true, texto: err instanceof SyntaxError ? "El archivo no es un JSON válido." : err.message }); }
              }} /></Campo>
              {vistaPrevia && <div className="op-resumen op-pila">
                <p>Respaldo: {respaldo.ings.length} insumos · {respaldo.recs.length} recetas y subrecetas · {respaldo.combos.length} combos · {respaldo.fixed.items.length} gastos fijos.</p>
                <p><b>{vistaPrevia.agregados} registros por agregar.</b> {vistaPrevia.conservados} ya existen y se conservarán.
                  {vistaPrevia.horario && " Se completará el horario de trabajo que falte."}</p>
                <button className="op-boton op-principal op-ajuste" disabled={ocupado || desdeCache || (!vistaPrevia.agregados && !vistaPrevia.horario)} onClick={() => {
                  let mensaje = "";
                  ejecutar(async () => {
                    const resultado = await importarCosteo(respaldo);
                    setRespaldo(null);
                    mensaje = `Firebase confirmó la importación: ${resultado.agregados} agregados y ${resultado.conservados} conservados.${resultado.horario ? " Se completó el horario de trabajo." : ""} Revisa Insumos y Recetas.`;
                  }, () => mensaje);
                }}>{ocupado ? "Guardando en Firebase…" : "Confirmar importación"}</button>
              </div>}
        </section>
      </>}
      {tab === "ings" && <section className="op-panel op-pila">
        <div className="op-encabezado"><h3>Insumos y empaques</h3><button className="op-boton op-principal" disabled={ocupado} onClick={() => nuevoInsumo()}>Agregar insumo</button></div>
        <Aviso error>{errorInv}</Aviso>
        {sinVincular.length > 0 && <Campo etiqueta="Asignar costo a un insumo del inventario"><select value="" disabled={ocupado} onChange={(e) => {
          const i = sinVincular.find((x) => x.id === e.target.value);
          if (i) nuevoInsumo(i.id, i);
        }}><option value="">Elige un insumo existente</option>{sinVincular.map((i) => <option key={i.id} value={i.id}>{i.nombre} · {i.tienda}</option>)}</select></Campo>}
        {inventario && pendientes.length > 1 && <details>
          <summary>Publicar varios insumos en inventario</summary>
          <p className="op-suave">Se agregarán {pendientes.length} fichas con nombre, tienda, presentación y existencias iniciales. Los registros existentes y los precios se conservan.</p>
          <button className="op-boton" disabled={ocupado} onClick={() => {
            let hechos = 0, omitidos = 0;
            ejecutar(async () => {
              for (const i of pendientes) {
                try { await publicarInsumo(perfil, i); hechos++; }
                catch (err) {
                  if (!err.code && err.message === "Este insumo ya está en el inventario.") omitidos++;
                  else throw new Error(`Se agregaron ${hechos} insumos antes del error. Revisa la conexión o los permisos y vuelve a intentar.`);
                }
              }
            }, () => `Insumos agregados: ${hechos}. Ya existentes: ${omitidos}.`);
          }}>Publicar {pendientes.length} fichas</button>
        </details>}
        {!data.ings.length && <p className="op-suave">Aún no hay insumos en el recetario.</p>}
        {proveedores.map((proveedor) => <section className="costeo-grupo" key={proveedor}>
          <h4>{proveedor}</h4><div className="costeo-lista">{data.ings.filter((i) => i.c === proveedor).map((i) =>
          <article className="costeo-ficha" key={i.id}>
            <button className="costeo-registro" disabled={ocupado} onClick={() => editar({ grupo: "ings", o: i })}>
              <span><b>{i.n}</b><small>{i.p == null ? "Sin precio" : moneda(i.p)} por {i.u} · trae {i.q} {i.b}{i.e ? " · Empaque" : ""}</small></span>
              <span>{i.p != null && i.q > 0 && <><b>${(i.p / i.q).toFixed(3)}</b><small>por {i.b}</small></>}</span>
            </button>
            {inventario && (ids.has(i.id) ? <span className="op-etiqueta">En inventario</span> : <button className="op-boton" disabled={ocupado}
              onClick={() => ejecutar(() => publicarInsumo(perfil, i), `${i.n} agregado al inventario.`)}>Publicar en inventario</button>)}
          </article>)}</div>
        </section>)}
      </section>}
      {tab === "recs" && <section className="op-panel op-pila">
        <div className="op-encabezado"><h3>Recetas y combos</h3><button className="op-boton op-principal" onClick={nuevaReceta}>
          {filtro === "sub" ? "Nueva subreceta" : filtro === "combos" ? "Nuevo combo" : "Nueva receta"}</button></div>
        <div className="op-tabs costeo-segmentos">{filtrosReceta.map(([id, nombre]) => <button key={id} className="op-boton" aria-pressed={id === filtro}
          onClick={() => setFiltro(id)}>{nombre}</button>)}</div>
        {(() => {
          const esCombo = filtro === "combos";
          const lista = esCombo ? data.combos : data.recs.filter((r) => filtro === "sub" ? r.sub : !r.sub && r.sh === filtro);
          return lista.length ? lista.map((r) => {
            const c = esCombo ? resumenCombo(data, r) : resumenReceta(data, r);
            const concepto = r.sub ? "Costo por unidad" : "Costo para llevar";
            const importe = c && (esCombo ? c.costo : r.sub ? (r.yield > 0 ? (c.comida + c.empaque) / r.yield : null) : c.llevar);
            return <button className="costeo-registro costeo-receta" key={r.id} onClick={() => editar({ grupo: esCombo ? "combos" : "recs", o: r })}>
              <span><b>{r.n}</b><small>{importe == null ? "Costeo pendiente" : !esCombo && !r.sub ?
                `${moneda(c.local)} local · ${moneda(c.llevar)} para llevar` : `${concepto}: ${moneda(importe)}`}</small></span>
              {!r.sub && <span><b>{r.price > 0 ? moneda(r.price) : "Sin precio"}</b>{c?.margen != null &&
                <small className={c.margen < 30 ? "costeo-margen-bajo" : "costeo-margen-sano"}>{c.margen.toFixed(1)}%</small>}</span>}
            </button>;
          }) : <div className="op-pila"><p className="op-suave">Aún no hay registros en esta sección.</p>
            {filtro === "am" && <button className="op-boton op-ajuste" disabled={ocupado} onClick={() => ejecutar(
              () => crearRecetasManana(plantillas.map((n) => ({ ...borradorReceta("am", n), margin: 60 }))),
              "Plantillas de mañana agregadas. Abre cada receta para completar sus ingredientes y precio.")}>Crear las 9 plantillas de mañana</button>}
          </div>;
        })()}
      </section>}
      {tab === "fixed" && <section className="op-panel op-pila">
        <div className="op-encabezado"><h3>Gastos fijos</h3><button className="op-boton op-principal" onClick={() => editar({ grupo: "fixed", o: data.fixed })}>Editar gastos</button></div>
        <div className="costeo-kpis">{[["Costo por hora", gastosFijos(data.fixed).minuto * 60],
          ["Costo por minuto", gastosFijos(data.fixed).minuto]].map(([n, v]) =>
          <article className="op-panel op-kpi" key={n}><h4>{n}</h4><strong>{moneda(v)}</strong></article>)}</div>
        <p>{data.fixed.days} días al mes · {data.fixed.hours} horas por día</p>
        <ul className="op-lista">{data.fixed.items.map((i) => <li key={i.id}><span>{i.n}</span><b>{moneda(i.a)}</b></li>)}</ul>
        <p><b>Total mensual: {moneda(gastosFijos(data.fixed).total)}</b></p>
      </section>}
    </div>
  </section>;
}
