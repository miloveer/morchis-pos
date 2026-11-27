import { useEffect, useRef, useState } from "react";
import { Aviso, Campo, Numero } from "../comun/OperativoUI";
import { useCosteo } from "../costeo/datos";
import { estimadoCompras, moneda, pendiente } from "../costeo/modelo";
import { actualizarCompra, coloresInventario, guardarCantidadCompra, guardarInventario, useInventario } from "./datos";
import { agruparPorTienda, cantidad, cantidadPlaneada, MAX_CANTIDAD_COMPRA, resumenPrecios, textoCompras } from "./lista";
import { prepararFoto } from "./foto";
import "./inventario.css";

const inicial = { nombre: "", tienda: "", presentacion: "", stock: 0, minimo: 0 };
const normalizar = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

function Editor({ perfil, anterior, cerrar }) {
  const [datos, set] = useState(anterior ?? inicial);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const formulario = useRef(null);
  useEffect(() => {
    formulario.current?.scrollIntoView({ block: "nearest" });
    formulario.current?.focus({ preventScroll: true });
  }, []);
  const cambiar = (campo, valor) => set((d) => ({ ...d, [campo]: valor }));
  return <form ref={formulario} tabIndex={-1} aria-label={anterior ? "Actualizar inventario" : "Registrar insumo"} className="op-panel op-pila" onSubmit={async (e) => {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try { await guardarInventario(perfil, datos, anterior); cerrar(); }
    catch (err) { setError(err.code ? "No se pudo guardar. Revisa la conexión o los permisos." : err.message); }
    finally { setGuardando(false); }
  }}>
    <h3>{anterior ? "Actualizar inventario" : "Registrar insumo"}</h3>
    <p className="op-suave">Registra las cantidades en la presentación de compra: por ejemplo, 2 bolsas o 0.5 kg.</p>
    <div className="op-campos">
      <Campo etiqueta="Insumo"><input required maxLength={120} value={datos.nombre} onChange={(e) => cambiar("nombre", e.target.value)} /></Campo>
      <Campo etiqueta="Tienda o proveedor"><input maxLength={120} value={datos.tienda} onChange={(e) => cambiar("tienda", e.target.value)} /></Campo>
      <Campo etiqueta="Presentación de compra"><input required maxLength={80} placeholder="Bolsa, caja, kg…" value={datos.presentacion} onChange={(e) => cambiar("presentacion", e.target.value)} /></Campo>
      <Campo etiqueta="Stock actual"><Numero required max={1e6} valor={datos.stock} cambiar={(v) => cambiar("stock", v)} /></Campo>
      <Campo etiqueta="Mínimo deseado"><Numero required max={1e6} valor={datos.minimo} cambiar={(v) => cambiar("minimo", v)} /></Campo>
    </div>
    <div className="op-fila compra-foto-editor">
      {datos.foto && <img className="compra-foto" src={datos.foto} alt="Vista previa" />}
      <Campo etiqueta={datos.foto ? "Cambiar foto del producto" : "Agregar foto del producto"}>
        <input type="file" accept="image/*" disabled={guardando || procesando} onChange={async (e) => {
          const archivo = e.target.files?.[0];
          e.target.value = "";
          if (!archivo) return;
          setError("");
          setProcesando(true);
          try { cambiar("foto", await prepararFoto(archivo)); }
          catch (err) { setError(err.message); }
          finally { setProcesando(false); }
        }} />
      </Campo>
      {datos.foto && <button type="button" className="op-boton" disabled={guardando || procesando} onClick={() => cambiar("foto", "")}>Quitar foto</button>}
    </div>
    <Aviso error>{error}</Aviso>
    <div className="op-fila"><button className="op-boton op-principal" disabled={guardando || procesando}>{procesando ? "Preparando foto…" : guardando ? "Guardando…" : "Guardar registro"}</button>
      <button type="button" className="op-boton" disabled={guardando} onClick={cerrar}>Cancelar</button></div>
  </form>;
}

function PrecioGrupo({ items, estimados, general }) {
  const r = resumenPrecios(items, estimados);
  return <div className={general ? "op-panel compra-resumen" : "compra-subtotal"}>
    <div><p className="op-suave">{general ? "Total estimado de la lista" : "Subtotal estimado"}</p>
      <strong>{r.sinPrecio > 0 && !r.conPrecio ? "Sin precios" : moneda(r.total)}{r.sinPrecio > 0 && r.conPrecio > 0 && " (parcial)"}</strong></div>
    {items.some((i) => i.comprado) && <p className="op-suave">Pendiente estimado: {
      r.pendientesSinPrecio && !items.some((i) => !i.comprado && estimados.get(i.id) != null)
        ? "Sin precios"
        : `${r.pendientesSinPrecio ? "al menos " : ""}${moneda(r.pendiente)}`
    }</p>}
    {r.sinPrecio > 0 && <p className="op-suave">{r.sinPrecio} {r.sinPrecio === 1 ? "insumo sin precio vinculado" : "insumos sin precio vinculado"}.</p>}
  </div>;
}

function ConPrecios({ data, children }) {
  const { data: costos, error } = useCosteo();
  const estimados = costos ? estimadoCompras(data, costos.ings, cantidadPlaneada) : null;
  return <>{error ? <Aviso error>{error}</Aviso> : !costos && <p role="status" className="op-suave">Cargando precios…</p>}
    {children(estimados)}
  </>;
}

function CantidadCompra({ item, guardar, ocupado, enLista }) {
  const base = cantidadPlaneada(item);
  const [valor, setValor] = useState(base || 1);
  return <form className="compra-cantidad" onSubmit={(e) => {
    e.preventDefault();
    guardar(item, valor);
  }}>
    <Campo etiqueta={enLista ? `Cantidad de ${item.nombre} (${item.presentacion})` : `Para la lista: ${item.presentacion}`}>
      <Numero required max={MAX_CANTIDAD_COMPRA} valor={valor} cambiar={setValor} disabled={ocupado} />
    </Campo>
    <button className="op-boton" disabled={ocupado || (enLista && valor === base)}>
      {enLista ? "Guardar cantidad" : base > 0 ? "Actualizar lista" : "Añadir a compras"}
    </button>
  </form>;
}

function Ficha({ item, vista, estimado, precios, pendienteGuardado, planear, marcar, editar, verFoto }) {
  const i = item;
  const faltan = pendiente(i);
  const esLista = vista === "lista";
  const color = Object.hasOwn(coloresInventario, i.registradoColor) ? coloresInventario[i.registradoColor] : coloresInventario.gris;
  return <article className="op-inventario-card compra-ficha" style={{ "--op-persona": color }} data-comprado={esLista && Boolean(i.comprado)}>
    <div className="compra-producto">
      {i.foto && <button type="button" className="compra-miniatura" aria-label={`Ampliar foto de ${i.nombre}`} onClick={() => verFoto(i)}>
        <img className="compra-foto" src={i.foto} alt="" loading="lazy" />
      </button>}
      <div><h4>{i.nombre}</h4>
        <p className="op-suave">{i.presentacion} · {faltan > 0 ? `Faltan ${cantidad(faltan)}` : "Stock suficiente"}</p>
        {!esLista && <p className="op-suave">Stock: {cantidad(i.stock)} · Mínimo: {cantidad(i.minimo)}</p>}
        <p className="op-autor">Registró: {i.registradoNombre || "Sin nombre"}</p>
      </div>
    </div>
    {esLista && <>
      <label className="op-check compra-check"><input type="checkbox" checked={i.comprado === true} disabled={pendienteGuardado}
        aria-label={`Comprado: ${i.nombre}`} onChange={(e) => marcar(i, e.target.checked)} />
        <span>{i.comprado ? "Comprado" : "Por comprar"} · <b>{cantidad(cantidadPlaneada(i))} {i.presentacion}</b></span></label>
      {precios && <p className="compra-precio">{estimado == null ? "Sin precio vinculado" : moneda(estimado)}</p>}
    </>}
    {(!esLista || !i.comprado) && <CantidadCompra key={cantidadPlaneada(i)} item={i} guardar={planear} ocupado={pendienteGuardado} enLista={esLista} />}
    <div className="op-fila">
      <button type="button" className="op-boton" disabled={pendienteGuardado} onClick={() => editar(i)}>Editar insumo y foto</button>
      {esLista && <button type="button" className="op-boton" disabled={pendienteGuardado} onClick={() => planear(i, 0)}>Quitar de la lista</button>}
    </div>
  </article>;
}

function FotoAmpliada({ item, cerrar }) {
  const dialogo = useRef(null);
  useEffect(() => {
    const elemento = dialogo.current;
    elemento.showModal();
    return () => { if (elemento.open) elemento.close(); };
  }, []);
  return <dialog className="compra-dialogo" ref={dialogo} aria-label={`Foto de ${item.nombre}`} onCancel={(e) => {
    e.preventDefault();
    cerrar();
  }}>
    <div className="op-encabezado"><h3>{item.nombre}</h3><button className="op-boton" onClick={cerrar}>Cerrar</button></div>
    <img src={item.foto} alt={item.nombre} />
  </dialog>;
}

export default function Inventario({ perfil }) {
  const { items, error } = useInventario();
  const [vista, setVista] = useState("lista");
  const [busqueda, setBusqueda] = useState("");
  const [tienda, setTienda] = useState("");
  const [edicion, editar] = useState(null);
  const [foto, verFoto] = useState(null);
  const [ocupado, setOcupado] = useState(null);
  const [aviso, setAviso] = useState({});
  if (error) return <Aviso error>{error}</Aviso>;
  if (!items) return <p role="status">Cargando inventario…</p>;
  const actuales = items.filter((i) => typeof i.nombre === "string" && typeof i.tienda === "string" && typeof i.presentacion === "string"
    && Number.isFinite(i.stock) && Number.isFinite(i.minimo));
  const tiendas = agruparPorTienda(actuales);
  const lista = actuales.filter((i) => cantidadPlaneada(i) > 0);
  const porComprar = lista.filter((i) => !i.comprado);
  const grupos = agruparPorTienda(vista === "stock" ? actuales : lista).filter((grupo) => !tienda || grupo.clave === tienda)
    .map((grupo) => ({ ...grupo, visibles: grupo.items.filter((i) =>
      normalizar(`${i.nombre} ${i.tienda} ${i.presentacion}`).includes(normalizar(busqueda.trim()))) }))
    .filter((grupo) => grupo.visibles.length);
  const textoLista = textoCompras(porComprar);

  async function ejecutar(i, accion, exito) {
    if (ocupado) return;
    setOcupado(i.id);
    setAviso({});
    try { await accion(); setAviso({ texto: exito }); }
    catch (err) {
      setAviso({ error: true, texto: err.code === "permission-denied"
        ? "Firestore no dio permiso para guardar. Revisa las reglas de Inventario."
        : err.code ? "No se pudo guardar el cambio. Revisa tu conexión." : err.message });
    } finally { setOcupado(null); }
  }

  const planear = (i, n) => ejecutar(i, () => guardarCantidadCompra(i, n),
    n === 0 ? `${i.nombre} salió de la lista.` : `Lista actualizada: ${i.nombre}, ${cantidad(n)} ${i.presentacion}.`);
  const marcar = (i, comprado) => ejecutar(i, () => actualizarCompra(i, comprado), comprado ? "Marcado como comprado." : "Marcado como pendiente.");

  const mostrarGrupos = (estimados = null) => <>
    {estimados && <PrecioGrupo items={lista} estimados={estimados} general />}
    {grupos.map((grupo) => <section className="op-panel op-pila compra-grupo" key={grupo.clave}>
      <header className="op-encabezado">
        <div><h3>{grupo.tienda}</h3><p className="op-suave">{grupo.items.length} {grupo.items.length === 1 ? "producto" : "productos"}
          {vista === "lista" && ` · ${grupo.items.filter((i) => !i.comprado).length} por comprar`}</p></div>
        {estimados && <PrecioGrupo items={grupo.items} estimados={estimados} />}
      </header>
      {grupo.visibles.map((i) => <Ficha key={i.id} item={i} vista={vista} estimado={estimados?.get(i.id)} precios={Boolean(estimados)}
        pendienteGuardado={Boolean(ocupado)} planear={planear} marcar={marcar} editar={editar} verFoto={verFoto} />)}
    </section>)}
  </>;

  return <section className="op-pila compra-inventario">
    <div className="op-encabezado"><div><h2>Inventario y compras</h2>
      <p className="op-suave">{porComprar.length} por comprar · {lista.length - porComprar.length} comprados</p></div>
      {!edicion && <button className="op-boton op-principal" onClick={() => editar("nuevo")}>Registrar insumo</button>}
    </div>
    {edicion && <Editor key={edicion.id ?? "nuevo"} perfil={perfil} anterior={edicion === "nuevo" ? null : edicion} cerrar={() => editar(null)} />}
    {foto && <FotoAmpliada item={foto} cerrar={() => verFoto(null)} />}
    <div className="op-panel op-pila">
      <div className="op-tabs">
        {[["lista", "Checklist de compras"], ["stock", "Existencias"]].map(([id, nombre]) => <button key={id} className="op-boton" aria-pressed={vista === id} onClick={() => setVista(id)}>{nombre}</button>)}
      </div>
      <div className="op-campos">
        <Campo etiqueta="Buscar insumo"><input type="search" placeholder="Ej. papas o nombre de la tienda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></Campo>
        <Campo etiqueta="Tienda"><select value={tienda} onChange={(e) => setTienda(e.target.value)}><option value="">Todas</option>
          {tiendas.map((t) => <option key={t.clave} value={t.clave}>{t.tienda}</option>)}</select></Campo>
      </div>
      {vista === "lista" && porComprar.length > 0 && <div className="op-fila">
        <button className="op-boton" onClick={async () => {
          try { await navigator.clipboard.writeText(textoLista); setAviso({ texto: "Lista copiada." }); }
          catch { setAviso({ error: true, texto: "No se pudo copiar. Puedes abrir la lista en WhatsApp." }); }
        }}>Copiar pendientes</button>
        <a className="op-boton" href={`https://wa.me/?text=${encodeURIComponent(textoLista)}`} target="_blank" rel="noopener noreferrer">Compartir pendientes por WhatsApp</a>
      </div>}
      <Aviso error={aviso.error}>{aviso.texto}</Aviso>
      {!grupos.length && <p className="op-suave">{busqueda || tienda ? "No hay resultados para el filtro." : vista === "stock"
        ? "Todavía no hay insumos registrados." : "La lista está vacía. Ve a Existencias para añadir lo que planeas comprar."}</p>}
    </div>
    {vista === "lista" && perfil.rol === "socio" ? <ConPrecios data={lista}>{mostrarGrupos}</ConPrecios> : mostrarGrupos()}
  </section>;
}
