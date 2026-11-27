import { useState } from "react";
import { ESTILOS_PAN, EXTRAS_PAN, PRECIOS_PANES, QUESOS_CHEESE, RELLENOS_PAN, precioDefinido } from "../config/panes";
import { CHILES_A_ELEGIR, INGREDIENTES_PAN } from "../config/ingredientesMenu";
import { calcularPan, tituloPan } from "../utils/calcularPan";
import { formatoPesos } from "../utils/mensajePedido";
import { OpcionMenu, SeccionMenu } from "./ControlesMenu";

const columnas = "grid grid-cols-2 gap-2";
const moneda = (precio, prefijo = "") => precioDefinido(precio) ? `${prefijo}${formatoPesos(precio)} MXN` : "Precio pendiente";

export default function ModalPan({ producto, item, cerrar, guardar, bloqueoHorario = "" }) {
  const tipo = producto.tipoPan;
  const precios = producto.preciosPan ?? PRECIOS_PANES[tipo];
  const rellenosAnteriores = item?.panPersonalizado?.rellenos ?? [];
  const [relleno, setRelleno] = useState(rellenosAnteriores[0] ?? "");
  const [estiloId, setEstiloId] = useState(item?.panPersonalizado?.estiloId ?? "sencilla");
  const [quesoId, setQuesoId] = useState(item?.panPersonalizado?.quesoId ?? "");
  const [extras, setExtras] = useState(() => Object.fromEntries(
    Object.entries({ ...Object.fromEntries(rellenosAnteriores.slice(1).map((id) => [id, 1])),
      ...item?.panPersonalizado?.extras }).flatMap(([id, cantidad]) => cantidad > 0 ? [[id, 1]] : []),
  ));
  const [cantidad, setCantidad] = useState(item?.cantidad ?? 1);
  const [sinIngredientes, setSinIngredientes] = useState(item?.sinIngredientes ?? []);
  const [chile, setChile] = useState(item?.chile ?? "");
  const [notas, setNotas] = useState(item?.notas ?? "");
  const estiloActivo = ESTILOS_PAN.find(({ id }) => id === estiloId);
  const seleccion = { rellenos: relleno ? [relleno] : [], estiloId, extras, ...(estiloActivo?.eligeQueso ? { quesoId } : {}) };
  const detalle = calcularPan(tipo, seleccion, precios);
  const nombreRelleno = RELLENOS_PAN.find(({ id }) => id === relleno)?.nombre;
  const cambioBase = detalle.estado === "listo" && detalle.base.nombre !== nombreRelleno;
  const puedeGuardar = !bloqueoHorario && detalle.estado === "listo" && CHILES_A_ELEGIR.includes(chile);
  const bloqueo = detalle.estado === "pendiente"
    ? `Falta registrar: ${detalle.faltantes.join(", ")}.`
    : detalle.estado !== "listo" ? detalle.mensaje
    : !CHILES_A_ELEGIR.includes(chile) ? "Elige jalapeños, chipotle o Sin chile." : "";

  function elegirRelleno(id) {
    setRelleno(id);
    if (id === "tresQuesos" && estiloId === "tresQuesos") setEstiloId("sencilla");
  }

  function cambiarExtra(id) {
    if (id === "tresQuesos" && !extras[id] && estiloId === "tresQuesos") setEstiloId("sencilla");
    setExtras((actual) => {
      const siguiente = { ...actual };
      if (siguiente[id]) delete siguiente[id];
      else siguiente[id] = 1;
      return siguiente;
    });
  }

  function guardarPan() {
    if (!puedeGuardar) return;
    guardar({
      productoId: producto.id,
      nombreProducto: precios.nombre,
      variante: detalle.base.nombre,
      panPersonalizado: { tipo, ...seleccion },
      detallePan: detalle,
      sinIngredientes,
      chile,
      notas: notas.trim(),
      cantidad,
      totalItem: detalle.total,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
      <div data-dialogo-cliente role="dialog" aria-modal="true" aria-label={`Personalizar ${precios.nombre}`}
        className="morchis-hoja flex h-[92dvh] w-full max-w-md flex-col overflow-hidden bg-white sm:h-auto sm:max-h-[90vh]">
        <header className="flex items-center justify-between gap-3 bg-gray-900 p-4 text-white">
          <h2 className="text-xl font-black">{precios.nombre}</h2>
          <button type="button" onClick={cerrar} data-cerrar-dialogo aria-label="Cerrar personalización"
            className="min-h-11 min-w-11 rounded-full bg-white/15 font-bold">✕</button>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-4">
          <SeccionMenu titulo="Elige un relleno principal" detalle="Elige uno. Incluye pan, frijoles, verduras y mayonesa.">
            <div className={columnas}>
              {RELLENOS_PAN.map(({ id, nombre }) => (
                <OpcionMenu key={id} activa={relleno === id} elegir={() => elegirRelleno(id)}
                  bloqueada={!precioDefinido(precios.base[id])}
                  descripcion={moneda(precios.base[id])}>{nombre}</OpcionMenu>
              ))}
            </div>
          </SeccionMenu>
          <SeccionMenu titulo="¿Cómo lo quieres?" detalle="Con todo o sin los ingredientes que elijas.">
            <div className={columnas}>
              <OpcionMenu activa={sinIngredientes.length === 0} elegir={() => setSinIngredientes([])}>
                Con todo
              </OpcionMenu>
              {INGREDIENTES_PAN.map((ingrediente) => (
                <OpcionMenu key={ingrediente} activa={sinIngredientes.includes(ingrediente)}
                  elegir={() => setSinIngredientes((actuales) => actuales.includes(ingrediente)
                    ? actuales.filter((actual) => actual !== ingrediente) : [...actuales, ingrediente])}>
                  Sin {ingrediente.toLowerCase()}
                </OpcionMenu>
              ))}
            </div>
          </SeccionMenu>
          <SeccionMenu titulo="Elige tu chile">
            <div className={columnas}>
              {CHILES_A_ELEGIR.map((opcion) => (
                <OpcionMenu key={opcion} activa={chile === opcion} elegir={() => setChile(opcion)}>{opcion}</OpcionMenu>
              ))}
            </div>
          </SeccionMenu>
          <SeccionMenu titulo="Hazlo especial" detalle="Elige un estilo o déjalo sencillo.">
            <div className={columnas}>
              {ESTILOS_PAN.map(({ id, nombre, incluye, eligeQueso }) => {
                const bloqueada = id === "tresQuesos" && (relleno === "tresQuesos" || Boolean(extras.tresQuesos));
                return (
                  <OpcionMenu key={id} activa={estiloId === id} elegir={() => setEstiloId(id)} bloqueada={bloqueada}
                    descripcion={bloqueada ? "Ya lo elegiste como relleno" :
                      `${eligeQueso ? "1 queso a elegir" : incluye.length ? incluye.join(", ") : "Relleno y verduras"} · ${moneda(precios.estilo[id], "+")}`}>
                    {nombre}
                  </OpcionMenu>
                );
              })}
            </div>
            {estiloActivo?.eligeQueso && (
              <fieldset className="min-w-0 space-y-2">
                <legend className="mb-2 text-sm font-black text-gray-900">Elige un queso para Cheese</legend>
                <div className={columnas}>
                  {QUESOS_CHEESE.map(({ id, nombre }) => (
                    <OpcionMenu key={id} activa={quesoId === id} elegir={() => setQuesoId(id)}>
                      {nombre}
                    </OpcionMenu>
                  ))}
                </div>
              </fieldset>
            )}
          </SeccionMenu>
          <SeccionMenu titulo="Agrega extras" detalle="Una porción por extra. Si añades otro relleno, el de mayor precio se cobra como base.">
            <div className={columnas}>
              {EXTRAS_PAN.map(({ id, nombre }) => (
                <OpcionMenu key={id} activa={Boolean(extras[id])} elegir={() => cambiarExtra(id)}
                  descripcion={moneda(precios.extra[id], "+")}>{nombre}</OpcionMenu>
              ))}
            </div>
          </SeccionMenu>
          <SeccionMenu titulo="Nota para cocina" detalle="Opcional">
            <textarea aria-label="Nota para cocina" value={notas} onChange={(evento) => setNotas(evento.target.value)}
              maxLength={180} placeholder="Ej. Pan bien tostado"
              className="w-full rounded-xl border border-gray-200 bg-white p-3 text-base" rows={2} />
          </SeccionMenu>
          <div aria-live="polite">
            {cambioBase && <p className="mb-2 rounded-xl bg-amber-50 p-3 text-sm text-gray-900">
              Se cobra <strong>{detalle.base.nombre}</strong> como relleno principal según el precio de los rellenos.
              {nombreRelleno && ` ${nombreRelleno} se cobra como extra.`}
            </p>}
            {detalle.estado === "listo" ? (
              <SeccionMenu titulo={tituloPan(detalle)} detalle="Desglose por pieza">
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-2"><dt>Base: {detalle.base.nombre}</dt><dd>{moneda(detalle.base.importe)}</dd></div>
                  {detalle.estilo.id !== "sencilla" && <div className="flex justify-between gap-2"><dt>Estilo {detalle.estilo.nombre}{estiloActivo?.eligeQueso && ` · ${detalle.estilo.incluye[0]}`}</dt><dd>{moneda(detalle.estilo.importe, "+")}</dd></div>}
                  {detalle.extras.map(({ nombre, cantidad, importe }) => (
                    <div key={nombre} className="flex justify-between gap-2"><dt>Extra: {nombre} ×{cantidad}</dt><dd>{moneda(importe, "+")}</dd></div>
                  ))}
                </dl>
              </SeccionMenu>
            ) : null}
          </div>
        </div>
        <footer className="morchis-vidrio morchis-area-inferior flex flex-wrap items-center gap-2 border-t border-gray-200 p-3">
          <div aria-live="polite" className="w-full">
            {bloqueo && <p id="pan-bloqueo" className="rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">{bloqueo}</p>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Quitar una pieza" disabled={cantidad === 1} onClick={() => setCantidad((valor) => valor - 1)} className="min-h-11 min-w-9 rounded-lg bg-gray-100 font-black disabled:opacity-40">−</button>
            <output aria-label="Piezas" className="font-black">{cantidad}</output>
            <button type="button" aria-label="Agregar una pieza" onClick={() => setCantidad((valor) => valor + 1)} className="min-h-11 min-w-9 rounded-lg bg-gray-100 font-black">+</button>
          </div>
          <button type="button" disabled={!puedeGuardar} aria-describedby={bloqueo ? "pan-bloqueo" : undefined} onClick={guardarPan}
            className="morchis-accion min-h-11 flex-1 rounded-xl px-3 py-2 text-sm font-black disabled:opacity-50">
            {puedeGuardar ? `${item ? "Guardar cambios" : "Agregar"} · ${moneda(detalle.total * cantidad)}`
              : bloqueoHorario || (detalle.estado === "pendiente" ? "Precio pendiente"
              : detalle.estado === "sin_rellenos" ? "Elige el relleno"
              : detalle.estado === "sin_queso" ? "Elige el queso"
              : detalle.estado === "listo" ? "Elige el chile" : "Revisa tu selección")}
          </button>
        </footer>
      </div>
    </div>
  );
}
