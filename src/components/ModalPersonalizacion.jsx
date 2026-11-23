import { useState } from "react";
import {
  removiblesGlobales,
  sazonadoresPapas,
  removiblesPapas,
} from "../data/menu";
import {
  PRECIO_ADEREZOS_PAPAS_APARTE,
  PRECIO_SALSA_APARTE, LIMITE_SALSAS_APARTE, PRECIO_SALSA_EXTRA,
} from "../config/precios";
import {
  ADEREZOS_BANDERILLAS, INGREDIENTES_CLASICAS,
  calcularSazonador, descripcionSalsa, opcionesProducto, opcionesSalsas, revisarServicioSalsas, tipoSalsa,
} from "../config/opcionesNoche";
import { calcularCargosAparte } from "../utils/calcularCargosAparte";
import { preparacionBloqueada } from "../utils/validarPedido";
function OpcionMenu({ children, activa, elegir, descripcion, bloqueada = false }) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      disabled={bloqueada}
      onClick={elegir}
      className={`flex min-h-12 min-w-0 items-start justify-between gap-1.5 rounded-xl border px-3 py-3 text-left text-sm font-bold leading-tight transition-colors disabled:opacity-40 ${activa ? "morchis-elegido" : "border-gray-200 bg-white text-gray-800 hover:border-gray-400"}`}
    >
      <span className="min-w-0 [overflow-wrap:anywhere]">
        {children}
        {descripcion && <span className="mt-1 block text-xs font-medium leading-snug text-gray-600">{descripcion}</span>}
      </span>
      {activa && <span aria-hidden="true" className="morchis-dorado shrink-0">✓</span>}
    </button>
  );
}

function TituloSeleccion({ children, detalle }) {
  return (
    <div>
      <h3 className="text-base font-black text-gray-900">{children}</h3>
      {detalle && <p className="mt-0.5 text-sm text-gray-600">{detalle}</p>}
    </div>
  );
}

function SeccionMenu({ titulo, detalle, children }) {
  return (
    <section className="min-w-0 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 sm:p-4">
      <TituloSeleccion detalle={detalle}>{titulo}</TituloSeleccion>
      {children}
    </section>
  );
}
const columnas = "grid grid-cols-2 gap-2";

function NotaProducto({ etiqueta, valor, cambiar, ejemplo }) {
  return (
    <label className="block text-left">
      <span className="mb-2 block text-sm font-bold text-gray-900">{etiqueta} (opcional)</span>
      <textarea
        value={valor}
        onChange={(e) => cambiar(e.target.value)}
        placeholder={ejemplo}
        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-[16px] font-medium text-gray-900"
        maxLength={160}
        rows={2}
      />
    </label>
  );
}
export default function ModalPersonalizacion({ producto, cerrar, agregarAlCarrito, catalogos, mostrarAviso, cerrarAviso }) {
  // Buscamos la primera variante que NO esté agotada para seleccionarla por defecto
  const indiceInicial = Math.max(
    0,
    producto.variantes.findIndex((v) => !v.agotada),
  );
  const [varianteIndex, setVarianteIndex] = useState(indiceInicial);
  const [comboIndex, setComboIndex] = useState(0);
  const [opcionObligatoria, setOpcionObligatoria] = useState("");
  const proteinasDisponibles = (producto.opcionProteina ?? []).filter(
  (opcion) => !opcion.agotada
);
const proteinaInicial = proteinasDisponibles[0]?.nombre || "";
  const [proteina, setProteina] = useState(proteinaInicial);
  const [salsasSeleccionadas, setSalsasSeleccionadas] = useState([]);
  const [sinClasicas, setSinClasicas] = useState([]);
  const [sazonadorExtra, setSazonadorExtra] = useState("");
  const [aderezosBanderillas, setAderezosBanderillas] = useState([]);
  const [pedirSalsasAparte, setPedirSalsasAparte] = useState(false);
  const [pedirSalsaExtra, setPedirSalsaExtra] = useState(false);
  const [salsasServidasAparte, setSalsasServidasAparte] = useState([]);
  const [salsaExtra, setSalsaExtra] = useState("");
  const [saborSoda, setSaborSoda] = useState("");
  const [sazonadorPapas, setSazonadorPapas] = useState("");
  const [removiblesPapasSeleccionados, setRemoviblesPapasSeleccionados] =
    useState([]);
  const [modoMezclaSalsa, setModoMezclaSalsa] = useState("mitad y mitad");
  const [removibles, setRemovibles] = useState([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]);
  const [notas, setNotas] = useState("");
  const [notaPapas, setNotaPapas] = useState("");
  const [notaSoda, setNotaSoda] = useState("");
  const [cantidadItem, setCantidadItem] = useState(1);
  const [quesoVariante, setQuesoVariante] = useState("");
  const varianteActual =
    producto.variantes[varianteIndex] || producto.variantes[0];
  const comboActual = Array.isArray(producto.combos) ? producto.combos[comboIndex] : null;
  const llevaPapas = producto.esProductoPapas || comboActual?.incluyePapas;
  const opcionRequerida = opcionesProducto(producto, varianteActual, catalogos);
  const opcionesObligatorias = opcionRequerida?.opciones ?? [];
  const salsa = opcionesSalsas(producto, varianteActual, catalogos);
  const tieneClasicas = salsasSeleccionadas.some((nombre) => tipoSalsa(nombre) === "clasicas");
  const precioSazonador = salsasSeleccionadas.length ? salsa.precioSazonadorConSalsa : 0;
  const cargoSazonador = calcularSazonador(salsa, sazonadorExtra, salsasSeleccionadas);
  const salsasEnPlatillo = salsasSeleccionadas.filter((nombre) => !salsasServidasAparte.includes(nombre));
  const cargosAparte = calcularCargosAparte({
    salsasServidasAparte,
    salsaExtra,
    removiblesPapasSeleccionados: llevaPapas ? removiblesPapasSeleccionados : [],
  });
  const totalExtras = extrasSeleccionados.reduce(
    (total, extra) => total + extra.precio,
    0,
  );
  const precioUnitario =
    varianteActual.precioBase +
    (comboActual ? comboActual.precioExtra : 0) +
    totalExtras +
    cargosAparte.total + cargoSazonador;
  const totalFinal = precioUnitario * cantidadItem;
  const handleAgregar = () => {
    const requierePreparacion = Boolean(
      producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length,
    );
    if (requierePreparacion && removibles.length === 0) {
      return mostrarAviso("Elige cómo quieres preparar tu producto.");
    }
    if (llevaPapas && removiblesPapasSeleccionados.length === 0) {
      return mostrarAviso("Elige cómo quieres preparar tus papas.");
    }
    if (varianteActual.agotada) return mostrarAviso("Esta variante está agotada.");
    if (salsa.obligatoria && !salsasSeleccionadas.length)
      return mostrarAviso("Selecciona al menos una salsa.");
    if (salsasSeleccionadas.some((nombre) => !salsa.opciones.includes(nombre)))
      return mostrarAviso("Elige una salsa disponible.");
    const errorServicio = revisarServicioSalsas(salsa, {
      salsas: salsasSeleccionadas, salsasServidasAparte, salsaExtra, pedirSalsasAparte, pedirSalsaExtra,
    });
    if (errorServicio) return mostrarAviso(errorServicio);
    if (opcionRequerida && !opcionesObligatorias.includes(opcionObligatoria)) {
      return mostrarAviso(
        opcionesObligatorias.length === 0
          ? "Por el momento no hay opciones disponibles."
          : `Elige una opción en «${opcionRequerida.titulo}» antes de agregar.`,
      );
    }
    if (comboActual?.incluyeSoda && !catalogos.sodas.includes(saborSoda)) {
      return mostrarAviso("Elige el sabor de la soda del combo.");
    }
    if (varianteActual.opcionesQueso && !quesoVariante)
      return mostrarAviso("Selecciona una opción de queso.");
    const requiereProteina =
      producto.opcionProteina &&
      !varianteActual.nombre.toLowerCase().includes("chicken");
    const itemParaCarrito = {
      productoId: producto.id,
      varianteId: varianteActual.id,
      sinClasicas: tieneClasicas ? sinClasicas : [],
      sazonadorExtra,
      aderezosBanderillas,
      cargoSazonador,
      nombreProducto: producto.nombre,
      variante: varianteActual.opcionesQueso
        ? `${varianteActual.nombre} (${quesoVariante})`
        : varianteActual.nombre,
      proteina: requiereProteina ? proteina : null,
      mostrarCarneEnMensaje: Boolean(requiereProteina && mostrarProteina),
      combo: comboActual ? comboActual.nombre : null,
      opcionObligatoria: opcionRequerida ? opcionObligatoria : null,
      tituloOpcion: opcionRequerida?.titulo ?? null,
      salsas: salsasSeleccionadas,
      pedirSalsasAparte,
      pedirSalsaExtra,
      salsasServidasAparte,
      salsaExtra,
      cargosAparte,
      modoMezclaSalsa: salsa.permiteAparte && salsasEnPlatillo.length === 2 ? modoMezclaSalsa : null,
      saborSoda: comboActual && comboActual.incluyeSoda ? saborSoda : null,
      papasDeCombo: Boolean(comboActual?.incluyePapas),
      detallesPapas:
        (comboActual && comboActual.incluyePapas) || producto.esProductoPapas
          ? { sazonador: sazonadorPapas, sin: removiblesPapasSeleccionados }
          : null,
      extras: extrasSeleccionados,
      removibles: removibles,
      notas: producto.esProductoPapas ? "" : notas.trim(),
      notaPapas: llevaPapas ? notaPapas.trim() : "",
      notaSoda: comboActual?.incluyeSoda ? notaSoda.trim() : "",
      totalItem: precioUnitario,
      cantidad: cantidadItem,
    };
    cerrar();
    agregarAlCarrito(itemParaCarrito);
  };
  const toggleSalsa = (nombre) => {
    setSalsasServidasAparte((actual) => actual.filter((salsa) => salsa !== nombre));
    if (tieneClasicas && (tipoSalsa(nombre) === "clasicas" || salsa.maximo === 1)) setSinClasicas([]);
    setSalsasSeleccionadas((prev) => {
      if (prev.includes(nombre)) return prev.filter((valor) => valor !== nombre);
      if (salsa.maximo === 1) return [nombre];
      if (prev.length >= salsa.maximo) return prev;
      return [...prev, nombre];
    });
  };
  const toggleArray = (item, setter) =>
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  const mostrarProteina = proteinasDisponibles.length > 1 &&
    !varianteActual.nombre.toLowerCase().includes("chicken");
  const cambiarVariante = (variante, index) => {
    const nuevaSalsa = opcionesSalsas(producto, variante, catalogos);
    if (nuevaSalsa.maximo !== salsa.maximo || nuevaSalsa.chicken !== salsa.chicken) {
      setSalsasSeleccionadas([]);
      setSinClasicas([]);
      setSalsasServidasAparte([]);
      setSalsaExtra("");
      setPedirSalsasAparte(false);
      setPedirSalsaExtra(false);
    }
    if (!opcionesProducto(producto, variante, catalogos)?.opciones.includes(opcionObligatoria)) {
      setOpcionObligatoria("");
    }
    setQuesoVariante("");
    setVarianteIndex(index);
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 sm:p-4 sm:items-center animate-fade-in">
      <div className="bg-white w-full max-w-md h-[92dvh] sm:h-auto sm:max-h-[90vh] morchis-hoja flex flex-col overflow-hidden">
        <div className="relative h-48 sm:h-56 bg-gray-900 shrink-0">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-0"></div>
          <button
            type="button" aria-label="Cerrar personalización" onClick={cerrar}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 w-10 h-10 rounded-full font-bold shadow-sm transition-colors flex items-center justify-center text-sm z-10"
          >
            ✕
          </button>
          <h2 className="morchis-titulo-producto morchis-titulo-hoja absolute bottom-5 left-5 right-5 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] z-10 uppercase">
            {producto.nombre}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3 bg-white p-3 sm:p-4">
          <SeccionMenu titulo="Elige tu opción">
            <div className={columnas}>
              {producto.variantes.map((variante, index) => (
                <OpcionMenu key={variante.id} activa={varianteIndex === index && !variante.agotada}
                  bloqueada={variante.agotada} elegir={() => cambiarVariante(variante, index)}
                  descripcion={variante.agotada ? "Agotado" : variante.descripcion}>
                  {variante.nombre} <span className="morchis-dorado block mt-1">${"$" + variante.precioBase}</span>
                </OpcionMenu>
              ))}
            </div>
          </SeccionMenu>
          {mostrarProteina && (
            <SeccionMenu titulo="Carne" detalle="Elige una opción">
              <div className={columnas}>
                {proteinasDisponibles.map(({ nombre }) => (
                  <OpcionMenu key={nombre} activa={proteina === nombre} elegir={() => setProteina(nombre)}>{nombre}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {varianteActual.opcionesQueso && (
            <SeccionMenu titulo="Queso" detalle="Elige una opción">
              <div className={columnas}>
                {varianteActual.opcionesQueso.map((queso) => (
                  <OpcionMenu key={queso} activa={quesoVariante === queso} elegir={() => setQuesoVariante(queso)}>{queso}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {opcionRequerida && (
            <SeccionMenu titulo={opcionRequerida.titulo} detalle="Elige una opción">
              {opcionesObligatorias.length ? (
                <div className={columnas}>
                  {opcionesObligatorias.map((opcion) => (
                    <OpcionMenu key={opcion} activa={opcionObligatoria === opcion} elegir={() => {
                      setOpcionObligatoria(opcion);
                      cerrarAviso();
                    }}>{opcion}</OpcionMenu>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-600">No hay opciones disponibles por el momento.</p>}
            </SeccionMenu>
          )}
          {(producto.usaRemoviblesGlobales || Boolean(producto.removiblesEspecificos?.length)) && (
            <SeccionMenu titulo="¿Cómo lo quieres?" detalle="Elige la preparación">
              <div className={columnas}>
                {(producto.removiblesEspecificos || removiblesGlobales).map((item) => (
                  <OpcionMenu key={item} activa={removibles.includes(item)} bloqueada={preparacionBloqueada(item, removibles)}
                    elegir={() => toggleArray(item, setRemovibles)}>{item}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {salsa.maximo > 0 && (
            <SeccionMenu titulo="Salsas"
              detalle={salsasSeleccionadas.join(", ") || (salsa.obligatoria ? `Elige hasta ${salsa.maximo}` : "Opcional")}>
              <div className={columnas}>
                {!salsa.obligatoria && (
                  <div className="col-span-2 grid">
                    <OpcionMenu activa={!salsasSeleccionadas.length} elegir={() => {
                      setSalsasSeleccionadas([]);
                      setSinClasicas([]);
                      setSalsasServidasAparte([]);
                    }}>Sin salsa</OpcionMenu>
                  </div>
                )}
                {salsa.opciones.map((nombre) => {
                  const descripcion = descripcionSalsa(nombre);
                  return (
                    <OpcionMenu key={nombre} activa={salsasSeleccionadas.includes(nombre)}
                      bloqueada={!salsasSeleccionadas.includes(nombre) && salsa.maximo > 1 && salsasSeleccionadas.length >= salsa.maximo}
                      descripcion={descripcion} elegir={() => toggleSalsa(nombre)}>{nombre}</OpcionMenu>
                  );
                })}
              </div>
              {tieneClasicas && (
                <fieldset className="min-w-0 rounded-xl border border-gray-200 p-3">
                  <legend className="px-1 text-sm font-bold">Preparación de Clásicas</legend>
                  <div className={columnas}>
                    <OpcionMenu activa={!sinClasicas.length} elegir={() => setSinClasicas([])}>Con todo</OpcionMenu>
                    {INGREDIENTES_CLASICAS.map((ingrediente) => (
                      <OpcionMenu key={ingrediente} activa={sinClasicas.includes(ingrediente)} elegir={() => toggleArray(ingrediente, setSinClasicas)}>
                        Sin {ingrediente.toLowerCase()}
                      </OpcionMenu>
                    ))}
                  </div>
                </fieldset>
              )}
              {salsa.permiteAparte && salsasEnPlatillo.length === 2 && (
                <div>
                  <h4 className="mb-2 text-sm font-bold">¿Cómo servimos tus dos salsas?</h4>
                  <div className={columnas}>
                    {[["mitad y mitad", "Mitad y mitad"], ["combinadas", "Combinadas"]].map(([modo, nombre]) => (
                      <OpcionMenu key={modo} activa={modoMezclaSalsa === modo} elegir={() => setModoMezclaSalsa(modo)}>{nombre}</OpcionMenu>
                    ))}
                  </div>
                </div>
              )}
            </SeccionMenu>
          )}
          {salsa.permiteAparte && salsa.opciones.length > 0 && (
            <SeccionMenu titulo="Salsas aparte" detalle={`Hasta ${LIMITE_SALSAS_APARTE} a $${PRECIO_SALSA_APARTE} cada una`}>
              <div className="grid">
                <OpcionMenu activa={pedirSalsasAparte} elegir={() => {
                  setPedirSalsasAparte(!pedirSalsasAparte);
                  setSalsasServidasAparte([]);
                  cerrarAviso?.();
                }}>Servir salsas aparte</OpcionMenu>
              </div>
              {pedirSalsasAparte && (salsasSeleccionadas.length ? (
                <>
                  <div className={columnas}>
                    {salsasSeleccionadas.map((nombre) => (
                      <OpcionMenu key={nombre} activa={salsasServidasAparte.includes(nombre)}
                        bloqueada={!salsasServidasAparte.includes(nombre) && salsasServidasAparte.length >= LIMITE_SALSAS_APARTE}
                        elegir={() => {
                          toggleArray(nombre, setSalsasServidasAparte);
                          cerrarAviso?.();
                        }}>{nombre}</OpcionMenu>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">Marca al menos una. Las demás van en el platillo.</p>
                </>
              ) : <p className="text-sm text-gray-600">Elige un sabor en Salsas y luego márcalo aquí para servirlo aparte.</p>)}
            </SeccionMenu>
          )}
          {salsa.permiteSazonador && (
            <SeccionMenu titulo="Sazonador" detalle={`${sazonadorExtra || "Opcional"} · ${precioSazonador
              ? `+$${precioSazonador} por orden con salsa` : "sin costo"}`}>
              <div className={columnas}>
                <OpcionMenu activa={!sazonadorExtra} elegir={() => setSazonadorExtra("")}>Sin sazonador</OpcionMenu>
                {salsa.sazonadores.map((nombre) => (
                  <OpcionMenu key={nombre} activa={sazonadorExtra === nombre} elegir={() => setSazonadorExtra(nombre)}>{nombre}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {salsa.banderillas && (
            <SeccionMenu titulo="Aderezos" detalle={aderezosBanderillas.join(", ") || "Opcional"}>
              <div className={columnas}>
                {ADEREZOS_BANDERILLAS.map((nombre) => (
                  <OpcionMenu key={nombre} activa={aderezosBanderillas.includes(nombre)} elegir={() => toggleArray(nombre, setAderezosBanderillas)}>{nombre}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {producto.extras?.length > 0 && (
            <SeccionMenu titulo="Extras" detalle={extrasSeleccionados.map(({ nombre }) => nombre).join(", ") || "Opcional"}>
              <div className={columnas}>
                {producto.extras.map((extra) => (
                  <OpcionMenu key={extra.id} activa={extrasSeleccionados.some((e) => e.id === extra.id)}
                    bloqueada={extra.agotada} elegir={() => toggleArray(extra, setExtrasSeleccionados)}
                    descripcion={extra.agotada ? "Agotado" : `+$${extra.precio}`}>{extra.nombre}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {producto.combos?.length > 1 && (
            <SeccionMenu titulo="Arma tu combo" detalle={comboActual?.nombre ?? "Elige una opción"}>
              <div className={columnas}>
                {producto.combos.map((combo, index) => (
                  <OpcionMenu key={combo.id} activa={comboIndex === index} elegir={() => setComboIndex(index)}
                    descripcion={combo.precioExtra > 0 ? `+$${combo.precioExtra}` : "Incluido"}>{combo.nombre}</OpcionMenu>
                ))}
              </div>
            </SeccionMenu>
          )}
          {comboActual?.incluyeSoda && (
            <SeccionMenu titulo="Sabor de la soda" detalle="Elige una opción">
              <div className={columnas}>
                {catalogos.sodas.map((sabor) => (
                  <OpcionMenu key={sabor} activa={saborSoda === sabor} elegir={() => setSaborSoda(sabor)}>{sabor}</OpcionMenu>
                ))}
              </div>
              <SeccionMenu titulo="Indicaciones para la soda" detalle={notaSoda.trim() ? "Nota agregada" : "Opcional"}>
                <NotaProducto etiqueta="Nota de la soda" valor={notaSoda} cambiar={setNotaSoda} ejemplo="Ej. Sin hielo" />
              </SeccionMenu>
            </SeccionMenu>
          )}
          {(comboActual?.incluyePapas || producto.esProductoPapas) && (
            <SeccionMenu titulo="Papas" detalle="Elige la preparación y agrega un sazonador si quieres">
              <div className={columnas}>
                {removiblesPapas.map((item) => (
                  <OpcionMenu key={item} activa={removiblesPapasSeleccionados.includes(item)}
                    bloqueada={preparacionBloqueada(item, removiblesPapasSeleccionados)}
                    elegir={() => toggleArray(item, setRemoviblesPapasSeleccionados)}
                    descripcion={item === "Todo Aparte" ? `+$${PRECIO_ADEREZOS_PAPAS_APARTE} por queso, catsup y salsa` : undefined}>{item}</OpcionMenu>
                ))}
              </div>
              <SeccionMenu titulo="Sazonador de las papas" detalle={sazonadorPapas || "Opcional"}>
                <div className={columnas}>
                <OpcionMenu activa={!sazonadorPapas} elegir={() => setSazonadorPapas("")}>Sin sazonador</OpcionMenu>
                {sazonadoresPapas.map((nombre) => (
                  <OpcionMenu key={nombre} activa={sazonadorPapas === nombre} elegir={() => setSazonadorPapas(nombre)}>{nombre}</OpcionMenu>
                ))}
              </div>
              </SeccionMenu>
              <SeccionMenu titulo="Indicaciones para las papas" detalle={notaPapas.trim() ? "Nota agregada" : "Opcional"}>
                <NotaProducto etiqueta="Nota de las papas" valor={notaPapas} cambiar={setNotaPapas} ejemplo="Ej. Bien doradas, poca salsa" />
              </SeccionMenu>
            </SeccionMenu>
          )}
          {!producto.esProductoPapas && (
            <SeccionMenu titulo="Indicaciones especiales" detalle={notas.trim() ? "Nota agregada" : "Opcional"}>
              <NotaProducto etiqueta="Nota del platillo" valor={notas} cambiar={setNotas} ejemplo="Ej. La carne bien dorada" />
            </SeccionMenu>
          )}
          {salsa.permiteAparte && salsa.opciones.length > 0 && (
            <SeccionMenu titulo="Salsa extra" detalle={`Opcional · +$${PRECIO_SALSA_EXTRA} por orden`}>
              <div className="grid">
                <OpcionMenu activa={pedirSalsaExtra} elegir={() => {
                  setPedirSalsaExtra(!pedirSalsaExtra);
                  setSalsaExtra("");
                  cerrarAviso?.();
                }}>Agregar salsa extra</OpcionMenu>
              </div>
              {pedirSalsaExtra && (
                <div className={columnas}>
                  {salsa.opciones.map((nombre) => (
                    <OpcionMenu key={nombre} activa={salsaExtra === nombre} descripcion={descripcionSalsa(nombre)}
                      elegir={() => {
                        setSalsaExtra(nombre);
                        cerrarAviso?.();
                      }}>{nombre}</OpcionMenu>
                  ))}
                </div>
              )}
            </SeccionMenu>
          )}
        </div>
        <div className="p-4 morchis-vidrio morchis-area-inferior border-t border-gray-100 shrink-0 flex gap-3 items-center">
          <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-xl p-1 w-28 sm:w-32 shrink-0 h-14">
            <button
              type="button" aria-label="Quitar una unidad" disabled={cantidadItem === 1} onClick={() => setCantidadItem((actual) => Math.max(1, actual - 1))}
              className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              -
            </button>
            <span className="font-black text-gray-900 text-lg">
              {cantidadItem}
            </span>
            <button
              type="button" aria-label="Sumar una unidad" onClick={() => setCantidadItem((actual) => actual + 1)}
              className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              +
            </button>
          </div>
          <button
            type="button" disabled={varianteActual.agotada} onClick={handleAgregar}
            className={`flex-1 h-14 px-5 rounded-xl font-bold text-lg transition-all flex justify-between items-center shadow-sm ${varianteActual.agotada ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "morchis-accion active:scale-95"}`}
          >
            <span>{varianteActual.agotada ? "Agotado" : "Agregar"}</span>
            <span>${totalFinal}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
