import { useEffect, useRef, useState } from "react";
import { Aviso, Campo, Numero } from "../comun/OperativoUI";
import { useCosteo } from "../costeo/datos";
import { estimadoCompras, moneda, pendiente } from "../costeo/modelo";
import { actualizarCompra, coloresInventario, guardarInventario, useInventario } from "./datos";

const inicial = { nombre: "", tienda: "", presentacion: "", stock: 0, minimo: 0 };
const normalizar = (s) => (s ?? "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const cantidad = (v) => v.toLocaleString("es-MX", { maximumFractionDigits: 4 });

function Editor({ perfil, anterior, cerrar }) {
  const [datos, set] = useState(anterior ?? inicial);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
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
    <Aviso error>{error}</Aviso>
    <div className="op-fila"><button className="op-boton op-principal" disabled={guardando}>Guardar registro</button>
      <button type="button" className="op-boton" disabled={guardando} onClick={cerrar}>Cancelar</button></div>
  </form>;
}

function EstimadoSocios({ faltantes }) {
  const { data, error } = useCosteo();
  if (error) return <Aviso error>{error}</Aviso>;
  if (!data) return <p role="status">Cargando estimado…</p>;
  const estimados = estimadoCompras(faltantes, data.ings);
  const valores = [...estimados.values()];
  const sinPrecio = valores.filter((x) => x == null).length;
  return <section className="op-panel op-kpi">
    <h3>Estimado de compra <span className="op-etiqueta">Solo socios</span></h3>
    <strong>{sinPrecio && sinPrecio === valores.length ? "Pendiente" : moneda(valores.reduce((s, x) => s + (x ?? 0), 0))}</strong>
    <p className="op-suave">{sinPrecio ? `${sinPrecio} sin precio vinculado o con datos distintos en Costeo. ` : ""}Calculado sobre los faltantes por comprar, con el precio por presentación del recetario.</p>
    {faltantes.length > 0 && <details><summary>Ver desglose</summary><ul className="op-lista">{faltantes.map((i) =>
      <li key={i.id}><span>{i.nombre} · {cantidad(pendiente(i))} {i.presentacion}</span><b>{estimados.get(i.id) == null ? "Sin precio" : moneda(estimados.get(i.id))}</b></li>)}</ul></details>}
  </section>;
}

export default function Inventario({ perfil }) {
  const { items, error } = useInventario();
  const [vista, setVista] = useState("stock");
  const [busqueda, setBusqueda] = useState("");
  const [tienda, setTienda] = useState("");
  const [edicion, editar] = useState(null);
  const [ocupado, setOcupado] = useState("");
  const [aviso, setAviso] = useState({});
  if (error) return <Aviso error>{error}</Aviso>;
  if (!items) return <p role="status">Cargando inventario…</p>;
  const actuales = items.filter((i) => typeof i.nombre === "string" && typeof i.tienda === "string" && typeof i.presentacion === "string"
    && Number.isFinite(i.stock) && Number.isFinite(i.minimo));
  const tiendas = [...new Set(actuales.map((i) => i.tienda))].sort((a, b) => a.localeCompare(b, "es-MX"));
  const faltantes = actuales.filter((i) => pendiente(i) > 0);
  const porComprar = faltantes.filter((i) => !i.comprado);
  const visibles = (vista === "stock" ? actuales : faltantes).filter((i) =>
    (!tienda || i.tienda === tienda) && normalizar(`${i.nombre} ${i.tienda} ${i.presentacion}`).includes(normalizar(busqueda.trim())));
  const textoLista = ["Lista de compras MORCHIS", ...tiendas.flatMap((local) => {
    const grupo = porComprar.filter((i) => i.tienda === local);
    return grupo.length ? ["", local, ...grupo.map((i) => `• ${i.nombre}: ${cantidad(pendiente(i))} ${i.presentacion}`)] : [];
  })].join("\n");
  return <section className="op-pila">
    <div className="op-encabezado"><div><h2>Inventario y compras</h2>
      <p className="op-suave">{porComprar.length} por comprar · {faltantes.length - porComprar.length} marcados como comprados</p></div>
      {!edicion && <button className="op-boton op-principal" onClick={() => editar("nuevo")}>Registrar insumo</button>}
    </div>
    {edicion && <Editor key={edicion.id ?? "nuevo"} perfil={perfil} anterior={edicion === "nuevo" ? null : edicion} cerrar={() => editar(null)} />}
    {perfil.rol === "socio" && <EstimadoSocios faltantes={porComprar} />}
    <div className="op-panel op-pila">
      <div className="op-tabs">
        {[["stock", "Existencias"], ["lista", "Lista de compras"]].map(([id, nombre]) => <button key={id} className="op-boton" aria-pressed={vista === id} onClick={() => setVista(id)}>{nombre}</button>)}
      </div>
      <div className="op-campos">
        <Campo etiqueta="Buscar insumo"><input type="search" placeholder="Ej. papas o nombre de la tienda" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></Campo>
        <Campo etiqueta="Tienda"><select value={tienda} onChange={(e) => setTienda(e.target.value)}><option value="">Todas</option>
          {tiendas.map((t) => <option key={t}>{t}</option>)}</select></Campo>
      </div>
      {vista === "lista" && porComprar.length > 0 && <div className="op-fila">
        <button className="op-boton" onClick={async () => {
          try { await navigator.clipboard.writeText(textoLista); setAviso({ texto: "Lista copiada." }); }
          catch { setAviso({ error: true, texto: "No se pudo copiar. Puedes abrir la lista en WhatsApp." }); }
        }}>Copiar lista completa</button>
        <a className="op-boton" href={`https://wa.me/?text=${encodeURIComponent(textoLista)}`} target="_blank" rel="noopener noreferrer">Compartir por WhatsApp</a>
      </div>}
      <Aviso error={aviso.error}>{aviso.texto}</Aviso>
      {!visibles.length && <p className="op-suave">{busqueda || tienda ? "No hay resultados para el filtro." : vista === "stock" ? "Todavía no hay insumos registrados." : "No hay faltantes."}</p>}
      {tiendas.map((t) => {
        const grupo = visibles.filter((i) => i.tienda === t);
        if (!grupo.length) return null;
        return <section className="op-pila" key={t}><h3>{t}</h3><div className="op-tarjetas">
          {grupo.map((i) => <article className="op-inventario-card" key={i.id} style={{ "--op-persona": Object.hasOwn(coloresInventario, i.registradoColor) ? coloresInventario[i.registradoColor] : coloresInventario.gris }}>
            <h4>{i.nombre}</h4>
            <p className="op-suave">{i.presentacion} · Stock: {cantidad(i.stock)} · Mínimo: {cantidad(i.minimo)}</p>
            <p><strong>{pendiente(i) > 0 ? `Faltan ${cantidad(pendiente(i))} ${i.presentacion}` : "Stock suficiente"}</strong></p>
            <p className="op-autor">Registró: {i.registradoNombre || "Sin nombre"}</p>
            {vista === "stock" ? <button className="op-boton" onClick={() => editar(i)}>Actualizar</button> :
              <label className="op-check"><input type="checkbox" checked={i.comprado === true} disabled={Boolean(ocupado)} onChange={async (e) => {
                setOcupado(i.id);
                setAviso({});
                try { await actualizarCompra(i, e.target.checked); }
                catch (err) { setAviso({ error: true, texto: err.code ? "No se pudo actualizar la lista." : err.message }); }
                finally { setOcupado(""); }
              }} /> {i.comprado ? "Comprado" : "Marcar comprado"}</label>}
          </article>)}
        </div></section>;
      })}
    </div>
  </section>;
}
