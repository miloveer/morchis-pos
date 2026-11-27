import { useEffect, useRef, useState } from "react";
import { Aviso, Campo, Numero } from "../comun/OperativoUI";
import { gastosFijos, importeLinea, moneda, resumenCombo, resumenReceta } from "./modelo";

const TIENDAS = ["Abarrotes", "Carnicería", "Corporativo Dajo", "Costco", "MicheLab", "Pollería", "Sams", "Verdulería", "Zorro"];

function Texto({ etiqueta, valor, cambiar, ...rest }) {
  return <Campo etiqueta={etiqueta}><input maxLength={120} value={valor} onChange={(e) => cambiar(e.target.value)} {...rest} /></Campo>;
}

function Cantidad({ etiqueta, ...props }) {
  return <Campo etiqueta={etiqueta}><Numero required {...props} /></Campo>;
}

const actualizarFila = (lista, idx, datos) => lista.map((x, i) => i === idx ? { ...x, ...datos } : x);
const quitarFila = (lista, idx) => lista.filter((_, i) => i !== idx);
const precio = (valor) => valor == null ? "Pendiente" : moneda(valor);
const porcentaje = (valor) => valor == null ? "Sin precio de venta" : `${valor.toFixed(1)}%`;

function Quitar({ onClick, etiqueta }) {
  return <button type="button" className="op-boton op-quitar" onClick={onClick}>Quitar <span className="sr-only">{etiqueta}</span></button>;
}

function Insumo({ d, set, vinculado }) {
  return <><div className="op-campos">
    <Texto etiqueta="Nombre" required valor={d.n} cambiar={(n) => set({ n })} />
    <Texto etiqueta="Tienda o proveedor" list="costeo-proveedores" valor={d.c} cambiar={(c) => set({ c })} />
    <datalist id="costeo-proveedores">{TIENDAS.map((nombre) => <option key={nombre} value={nombre} />)}</datalist>
    <Texto etiqueta="Presentación de compra" required maxLength={80} valor={d.u} cambiar={(u) => set({ u })} />
    <Campo etiqueta="Precio por presentación (MXN)"><Numero valor={d.p} cambiar={(p) => set({ p: p === "" ? null : p })} /></Campo>
    <Cantidad etiqueta="Cuánto trae" min={0.0001} valor={d.q} cambiar={(q) => set({ q })} />
    <Campo etiqueta="Unidad para recetas"><select value={d.b} onChange={(e) => set({ b: e.target.value })}>
      <option value="g">Gramos</option><option value="ml">Mililitros</option><option value="pza">Piezas</option>
    </select></Campo>
    <Campo etiqueta="Tipo"><select value={d.e ? "empaque" : "ingrediente"} onChange={(e) => set({ e: e.target.value === "empaque" })}>
      <option value="ingrediente">Ingrediente</option><option value="empaque">Empaque o desechable</option>
    </select></Campo>
  </div>
  <p className="op-suave">Costo por {d.b}: {d.p == null || !(d.q > 0) ? "Pendiente" : `$${(d.p / d.q).toFixed(4)}`}.
    {vinculado && vinculado.presentacion !== d.u.trim() && " La presentación debe coincidir con Inventario para calcular el gasto."}</p></>;
}

function Receta({ d, set, data }) {
  const r = resumenReceta(data, d);
  const opciones = [...data.ings.map((i) => [`i:${i.id}`, i.n]),
    ...data.recs.filter((i) => i.sub && i.id !== d.id).map((i) => [`r:${i.id}`, `Subreceta: ${i.n}`])];
  return <>
    <div className="op-campos">
      <Texto etiqueta="Nombre" required valor={d.n} cambiar={(n) => set({ n })} />
      {d.sub ? <Cantidad etiqueta="Rendimiento (g, ml o pzas)" min={0.0001} valor={d.yield} cambiar={(v) => set({ yield: v })} /> : <>
        <Campo etiqueta="Horario"><select value={d.sh} onChange={(e) => set({ sh: e.target.value })}><option value="all">Menú general</option><option value="am">Mañana</option></select></Campo>
        <Cantidad etiqueta="Tiempo de preparación (min)" valor={d.time} cambiar={(time) => set({ time })} />
        <Cantidad etiqueta="Precio de venta (MXN)" valor={d.price} cambiar={(p) => set({ price: p })} />
        <Cantidad etiqueta="Margen deseado (%)" max={90} valor={d.margin} cambiar={(margin) => set({ margin })} />
      </>}
    </div>
    <h4>Ingredientes, empaques y subrecetas</h4>
    {d.lines.map((l, i) => {
      const insumo = l.k === "i" && data.ings.find((x) => x.id === l.id);
      const importe = importeLinea(data, l, [d.id]);
      return <div className="op-linea" key={`${l.k}:${l.id}:${i}`}>
        <span><b>{opciones.find(([key]) => key === `${l.k}:${l.id}`)?.[1] ?? "Referencia no disponible"}</b>
          <br /><small>{precio(importe && (importe.comida + importe.empaque))}</small></span>
        <Cantidad etiqueta={`Cantidad (${insumo ? insumo.b : "unidad del rendimiento"})`} min={0.0001} valor={l.q}
          cambiar={(q) => set({ lines: actualizarFila(d.lines, i, { q }) })} />
        <Quitar etiqueta="ingrediente" onClick={() => set({ lines: quitarFila(d.lines, i) })} />
      </div>;
    })}
    <Campo etiqueta="Agregar ingrediente, empaque o subreceta"><select value="" onChange={(e) => {
      const [k, id] = e.target.value.split(":");
      if (id) set({ lines: [...d.lines, { k, id, q: 1 }] });
    }}><option value="">Elige una opción</option>{opciones.map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></Campo>
    {!d.sub && <>
      <h4>Extras y modificadores</h4>
      {d.extras.map((x, i) => <div className="op-linea op-extra" key={x.id}>
        <Texto etiqueta="Extra" required valor={x.n} cambiar={(n) => set({ extras: actualizarFila(d.extras, i, { n }) })} />
        <Cantidad etiqueta="Costo (MXN)" valor={x.c} cambiar={(c) => set({ extras: actualizarFila(d.extras, i, { c }) })} />
        <Cantidad etiqueta="Precio (MXN)" valor={x.p} cambiar={(p) => set({ extras: actualizarFila(d.extras, i, { p }) })} />
        <span>Utilidad: {moneda(x.p - x.c)}</span>
        <Quitar etiqueta="extra" onClick={() => set({ extras: quitarFila(d.extras, i) })} />
      </div>)}
      <button type="button" className="op-boton op-ajuste" onClick={() => set({ extras: [...d.extras, { id: crypto.randomUUID(), n: "", c: 0, p: 0 }] })}>Agregar extra</button>
    </>}
    <div className="op-resumen">
      {!r ? <p>Costeo pendiente: revisa las cantidades, los precios, las referencias y los gastos fijos.</p> : d.sub ?
        <p>Costo por unidad de rendimiento: <b>{d.yield > 0 ? precio((r.comida + r.empaque) / d.yield) : "Pendiente"}</b></p> :
        <><p>Ingredientes: {moneda(r.comida)} · Empaque: {moneda(r.empaque)} · Operación: {moneda(r.operativo)}</p>
          <p>Costo en local: <b>{moneda(r.local)}</b> · Para llevar: <b>{moneda(r.llevar)}</b></p>
          <p>Utilidad local: <b>{moneda(d.price - r.local)}</b> · Para llevar: <b>{moneda(r.utilidad)} ({porcentaje(r.margen)})</b></p>
          <p>Precio sugerido para llevar: <b>{moneda(r.sugerido)}</b></p>
          <button type="button" className="op-boton" onClick={() => set({ price: Math.ceil(r.sugerido) })}>Usar precio sugerido</button>
        </>}
    </div>
  </>;
}

function Combo({ d, set, data }) {
  const r = resumenCombo(data, d);
  const recetas = data.recs.filter((x) => !x.sub);
  return <>
    <div className="op-campos"><Texto etiqueta="Nombre" required valor={d.n} cambiar={(n) => set({ n })} />
      <Cantidad etiqueta="Precio de venta (MXN)" valor={d.price} cambiar={(p) => set({ price: p })} /></div>
    {d.items.map((l, i) => <div className="op-linea" key={`${l.id}:${i}`}><b>{recetas.find((x) => x.id === l.id)?.n ?? "Receta no disponible"}</b>
      <Cantidad etiqueta="Cantidad" min={0.0001} valor={l.q} cambiar={(q) => set({ items: actualizarFila(d.items, i, { q }) })} />
      <Quitar etiqueta="platillo" onClick={() => set({ items: quitarFila(d.items, i) })} />
    </div>)}
    <Campo etiqueta="Agregar platillo"><select value="" onChange={(e) => {
      if (e.target.value) set({ items: [...d.items, { id: e.target.value, q: 1 }] });
    }}><option value="">Elige una receta</option>{recetas.map((x) => <option key={x.id} value={x.id}>{x.n}</option>)}</select></Campo>
    <div className="op-resumen">{r ? <><p>Costo para llevar: <b>{moneda(r.costo)}</b> · Precio por separado: {moneda(r.separado)}</p>
      <p>Utilidad: <b>{moneda(r.utilidad)} ({porcentaje(r.margen)})</b></p></> : <p>Agrega platillos con su costeo completo.</p>}</div>
  </>;
}

function Gastos({ d, set }) {
  const resumen = gastosFijos(d);
  return <>
    <div className="op-campos">
      <Cantidad etiqueta="Días de trabajo por mes" max={31} valor={d.days} cambiar={(days) => set({ days })} />
      <Cantidad etiqueta="Horas por día" max={24} valor={d.hours} cambiar={(hours) => set({ hours })} />
    </div>
    {d.items.map((x, i) => <div className="op-linea" key={x.id}>
      <Texto etiqueta="Concepto" required valor={x.n} cambiar={(n) => set({ items: actualizarFila(d.items, i, { n }) })} />
      <Cantidad etiqueta="Gasto mensual (MXN)" valor={x.a} cambiar={(a) => set({ items: actualizarFila(d.items, i, { a }) })} />
      <Quitar etiqueta="gasto" onClick={() => set({ items: quitarFila(d.items, i) })} /></div>)}
    <button className="op-boton op-ajuste" type="button" onClick={() => set({ items: [...d.items, { id: crypto.randomUUID(), n: "", a: 0 }] })}>Agregar gasto</button>
    <p className="op-resumen">Total mensual: <b>{moneda(resumen.total)}</b> · Por hora: <b>{moneda(resumen.minuto * 60)}</b></p>
  </>;
}

export default function EditorCosteo({ grupo, inicial, data, vinculado, cerrar, guardar, eliminar }) {
  const [d, setD] = useState(inicial);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const dialogo = useRef(null);
  useEffect(() => {
    const elemento = dialogo.current;
    elemento.showModal();
    return () => { if (elemento.open) elemento.close(); };
  }, []);
  const set = (cambio) => setD((act) => ({ ...act, ...cambio }));
  async function ejecutar(accion) {
    setOcupado(true);
    setError("");
    try { await accion(); cerrar(); }
    catch (err) { setError(err.code ? "No se pudo guardar. Revisa la conexión y los permisos." : err.message); }
    finally { setOcupado(false); }
  }
  const campos = { ings: Insumo, recs: Receta, combos: Combo, fixed: Gastos };
  const Campos = campos[grupo];
  return <dialog className="costeo-sheet" ref={dialogo} aria-labelledby="costeo-editor-titulo" onCancel={(e) => {
    e.preventDefault();
    if (!ocupado) cerrar();
  }}><form className="op-pila" onSubmit={(e) => {
    e.preventDefault();
    if (grupo !== "fixed" && !d.n.trim()) { setError("Escribe un nombre para el registro."); return; }
    ejecutar(() => guardar(d));
  }}>
    <header className="costeo-sheet-head"><h3 id="costeo-editor-titulo">{grupo === "fixed" ? "Editar gastos fijos" : `${eliminar ? "Editar" : "Nuevo registro"}${inicial.n ? `: ${inicial.n}` : ""}`}</h3>
      <button className="op-boton" type="button" aria-label="Cerrar editor" disabled={ocupado} onClick={cerrar}>✕</button></header>
    <Campos d={d} set={set} data={data} vinculado={vinculado} />
    <Aviso error>{error}</Aviso>
    <div className="op-fila">
      <button className="op-boton op-principal" disabled={ocupado}>{ocupado ? "Guardando…" : "Guardar"}</button>
      <button className="op-boton" type="button" disabled={ocupado} onClick={cerrar}>Cancelar</button>
      {eliminar && !confirmar && <button className="op-boton op-quitar" disabled={ocupado} type="button" onClick={() => setConfirmar(true)}>Eliminar registro</button>}
    </div>
    {confirmar && <div className="op-fila"><span>¿Eliminar este registro del costeo?</span><button type="button" className="op-boton op-quitar" disabled={ocupado}
      onClick={() => ejecutar(eliminar)}>Sí, eliminar</button><button type="button" className="op-boton" onClick={() => setConfirmar(false)}>Conservar</button></div>}
  </form></dialog>;
}
