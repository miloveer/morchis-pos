import { useState } from "react";
import {
  removiblesGlobales,
  sazonadoresPapas,
  removiblesPapas,
} from "../data/menu";
import {
  PRECIO_ADEREZOS_PAPAS_APARTE,
  PRECIO_SALSA_APARTE,
} from "../config/precios";
import { catalogoDeProducto } from "../config/catalogos";
import { calcularCargosAparte } from "../utils/calcularCargosAparte";
import { preparacionBloqueada } from "../utils/validarPedido";

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
  const [salsasAparte, setSalsasAparte] = useState(false);
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
  const comboActual = producto.combos ? producto.combos[comboIndex] : null;
 const esFrappe =
  Boolean(producto.esFrappe) ||
  /frapp[eé]/i.test(`${producto.id ?? ""} ${producto.nombre ?? ""}`);
const opcionesObligatorias = esFrappe
  ? catalogos.frappes ?? []
  : catalogoDeProducto(producto, catalogos);
const opcionRequerida = esFrappe
  ? { titulo: "Sabor del frappe" }
  : producto.opcionObligatoria ||
    (opcionesObligatorias.length > 0 ? { titulo: "Sabor" } : null);
  const cargosAparte = calcularCargosAparte({
    salsasSeleccionadas,
    salsasAparte,
    removiblesPapasSeleccionados,
  });
  const totalExtras = extrasSeleccionados.reduce(
    (total, extra) => total + extra.precio,
    0,
  );
  const precioUnitario =
    varianteActual.precioBase +
    (comboActual ? comboActual.precioExtra : 0) +
    totalExtras +
    cargosAparte.total;
  const totalFinal = precioUnitario * cantidadItem;
  const handleAgregar = () => {
    const requierePreparacion = Boolean(
      producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length,
    );
    const llevaPapas = producto.esProductoPapas || comboActual?.incluyePapas;
    if (requierePreparacion && removibles.length === 0) {
      return mostrarAviso("Elige cómo quieres preparar tu producto.");
    }
    if (llevaPapas && removiblesPapasSeleccionados.length === 0) {
      return mostrarAviso("Elige cómo quieres preparar tus papas.");
    }
    if (varianteActual.agotada) return mostrarAviso("Esta variante está agotada.");
    if (producto.maxSalsas && salsasSeleccionadas.length === 0)
      return mostrarAviso("Selecciona al menos una salsa.");
    if (opcionRequerida && !opcionesObligatorias.includes(opcionObligatoria)) {
      return mostrarAviso(
        opcionesObligatorias.length === 0
          ? "Por el momento no hay opciones disponibles."
          : esFrappe
            ? "Elige un sabor para tu frappé antes de agregarlo."
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
      salsasAparte,
      cargosAparte,
      modoMezclaSalsa: producto.maxSalsas === 2 ? modoMezclaSalsa : null,
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
  const toggleSalsa = (salsa) =>
    setSalsasSeleccionadas((prev) => {
      if (prev.includes(salsa)) return prev.filter((s) => s !== salsa);
      if (prev.length >= producto.maxSalsas) return prev;
      return [...prev, salsa];
    });
  const toggleArray = (item, setter) =>
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  const mostrarProteina =
  proteinasDisponibles.length > 1 &&
  !varianteActual.nombre.toLowerCase().includes("chicken");
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
            onClick={cerrar}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 w-10 h-10 rounded-full font-bold shadow-sm transition-colors flex items-center justify-center text-sm z-10"
          >
            ✕
          </button>
          <h2 className="morchis-titulo-producto morchis-titulo-hoja absolute bottom-5 left-5 right-5 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] z-10 uppercase">
            {producto.nombre}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-7 bg-white">
          <section>
            <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
              Elige tu opción <span className="morchis-dorado">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {producto.variantes.map((variante, index) => {
                const estaAgotada = variante.agotada;
                return (
                  <label
                    key={variante.id}
                    className={`flex flex-col p-3 border rounded-xl transition-all w-full text-left ${estaAgotada ? "opacity-50 grayscale cursor-not-allowed bg-gray-50" : varianteIndex === index ? "border-gray-900 bg-gray-50 shadow-sm cursor-pointer" : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <input
                        type="radio"
                        disabled={estaAgotada}
                        checked={!estaAgotada && varianteIndex === index}
                        onChange={() => setVarianteIndex(index)}
                        className="w-4 h-4 mt-0.5 text-gray-900 morchis-check shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-black text-gray-900 text-sm block leading-tight pr-1">
                            {variante.nombre}
                          </span>
                          {estaAgotada && (
                            <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                              Agotado
                            </span>
                          )}
                        </div>
                        {variante.descripcion && (
                          <span className="text-gray-500 text-[10px] mt-1 mb-1 block leading-tight">
                            {variante.descripcion}
                          </span>
                        )}
                        <span className="morchis-dorado font-bold text-xs mt-1 block">
                          ${variante.precioBase}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
          {mostrarProteina && (
            <section className="morchis-tinte p-4 rounded-xl border morchis-borde animate-fade-in">
              <h3 className="font-bold morchis-dorado mb-3 text-xs tracking-wider uppercase">
                Tipo de Carne <span className="morchis-dorado">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.opcionProteina.map((prot) => {
                  const estaAgotada = prot.agotada;
                  return (
                    <button
                      key={prot.nombre}
                      disabled={estaAgotada}
                      onClick={() => setProteina(prot.nombre)}
                      className={`p-3 rounded-xl text-sm font-bold border transition-all text-left leading-tight relative ${estaAgotada ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70" : proteina === prot.nombre ? "morchis-elegido shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                    >
                      {prot.nombre}
                      {estaAgotada && (
                        <span className="block text-[9px] font-black text-red-500 uppercase mt-1">
                          Agotada
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {varianteActual.opcionesQueso && (
            <section className="morchis-tinte p-4 rounded-xl border morchis-borde animate-fade-in">
              <h3 className="font-bold morchis-dorado mb-3 text-xs tracking-wider uppercase">
                Elige tu Queso <span className="morchis-dorado">*</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {varianteActual.opcionesQueso.map((queso) => (
                  <button
                    key={queso}
                    onClick={() => setQuesoVariante(queso)}
                    className={`p-3 rounded-xl text-sm font-bold border transition-all text-left leading-tight ${quesoVariante === queso ? "morchis-elegido shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    {queso}
                  </button>
                ))}
              </div>
            </section>
          )}
          {/* NUEVA SECCIÓN DE FRAPPES */}
          {opcionRequerida && (
  <section>
    <h3 className="mb-3 text-sm font-bold">{opcionRequerida.titulo} *</h3>
    {opcionesObligatorias.length === 0 ? (
      <p>No hay sabores disponibles por el momento.</p>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        {opcionesObligatorias.map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => {
              setOpcionObligatoria(opcion);
              cerrarAviso();
            }}
            aria-pressed={opcionObligatoria === opcion}
            className={`rounded-xl border p-3 text-sm font-bold ${
              opcionObligatoria === opcion
                ? "morchis-elegido"
                : "bg-white text-gray-900"
            }`}
          >
            {opcion}
          </button>
        ))}
      </div>
    )}
  </section>
)}
          {(producto.usaRemoviblesGlobales ||
            producto.removiblesEspecificos) && (
            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                ¿Cómo lo quieres?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(producto.removiblesEspecificos || removiblesGlobales).map(
                  (item) => {
                    const isChecked = removibles.includes(item);
                    return (
                      <label
                        key={item}
                        className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-left ${isChecked ? "border-gray-400 bg-gray-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleArray(item, setRemovibles)}
                          disabled={preparacionBloqueada(item, removibles)}
                          className="w-4 h-4 shrink-0 rounded text-gray-600 accent-gray-600"
                        />
                        <span
                          className={`text-xs font-bold leading-tight ${isChecked ? "text-gray-500 line-through" : "text-gray-700"}`}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            </section>
          )}
          {producto.maxSalsas && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1 text-xs tracking-wider uppercase">
                Tus Salsas <span className="morchis-dorado">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {catalogos.salsas_alitas.map((salsa) => {
                  const isChecked = salsasSeleccionadas.includes(salsa);
                  const isDisabled =
                    !isChecked &&
                    salsasSeleccionadas.length >= producto.maxSalsas;
                  return (
                    <label
                      key={salsa}
                      className={`flex items-center gap-2 p-3 bg-white rounded-lg border transition-all text-left ${isDisabled ? "opacity-50" : "cursor-pointer"} ${isChecked ? "border-gray-900" : "border-gray-200"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSalsa(salsa)}
                        disabled={isDisabled}
                        className="w-4 h-4 shrink-0 rounded text-gray-900 morchis-check"
                      />
                      <span className="text-xs font-bold text-gray-800 leading-tight">
                        {salsa}
                      </span>
                    </label>
                  );
                })}
              </div>
              <label className={`mt-4 flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${salsasAparte ? "morchis-borde morchis-tinte" : "border-gray-200 bg-white"}`}>
                <input
                  type="checkbox"
                  checked={salsasAparte}
                  onChange={(e) => setSalsasAparte(e.target.checked)}
                  className="w-4 h-4 mt-0.5 morchis-check"
                />
                <span className="text-xs font-bold text-gray-800">
                  Servir salsas aparte (+${PRECIO_SALSA_APARTE} por cada salsa)
                </span>
              </label>
              {salsasSeleccionadas.length === 2 && (
                <div className="mt-4 p-3 morchis-tinte rounded-xl border morchis-borde animate-fade-in">
                  <p className="text-[10px] font-black morchis-dorado uppercase mb-2 tracking-tighter">
                    ¿Cómo servimos tus 2 salsas?
                  </p>
                  <div className="flex gap-2">
                    {["mitad y mitad", "combinadas"].map((modo) => (
                      <button
                        key={modo}
                        onClick={() => setModoMezclaSalsa(modo)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                          modoMezclaSalsa === modo
                            ? "morchis-elegido shadow-sm"
                            : "bg-white morchis-borde morchis-dorado"
                        }`}
                      >
                        {modo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          {producto.extras && producto.extras.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Extras
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.extras.map((extra) => {
                  const estaAgotado = extra.agotada;
                  const isChecked = extrasSeleccionados.some(
                    (e) => e.id === extra.id,
                  );
                  return (
                    <label
                      key={extra.id}
                      className={`flex flex-col p-3 border rounded-xl transition-all text-left ${estaAgotado ? "opacity-50 grayscale cursor-not-allowed bg-gray-50" : isChecked ? "border-gray-900 bg-gray-50 shadow-sm cursor-pointer" : "border-gray-200 hover:border-gray-300 cursor-pointer"}`}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <input
                          type="checkbox"
                          disabled={estaAgotado}
                          checked={!estaAgotado && isChecked}
                          onChange={() =>
                            toggleArray(extra, setExtrasSeleccionados)
                          }
                          className="w-4 h-4 mt-0.5 shrink-0 rounded text-gray-900 morchis-check"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-900 text-sm block leading-tight pr-1">
                              {extra.nombre}
                            </span>
                            {estaAgotado && (
                              <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                                Agotado
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 font-medium text-xs mt-1 block">
                            +${extra.precio}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
          {producto.combos && producto.combos.length > 1 && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Hazlo Combo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.combos.map((combo, index) => (
                  <label
                    key={combo.id}
                    className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all text-left ${comboIndex === index ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <input
                        type="radio"
                        checked={comboIndex === index}
                        onChange={() => setComboIndex(index)}
                        className="w-4 h-4 mt-0.5 shrink-0 text-gray-900 morchis-check"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 text-sm block leading-tight">
                          {combo.nombre}
                        </span>
                        {combo.precioExtra > 0 ? (
                          <span className="text-gray-500 font-medium text-xs mt-1 block">
                            +${combo.precioExtra}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium text-xs mt-1 block">
                            Incluido
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}
          {!producto.esProductoPapas && (
            <NotaProducto etiqueta="Nota del platillo" valor={notas} cambiar={setNotas} ejemplo="Ej. La carne bien dorada" />
          )}
          {comboActual && comboActual.incluyeSoda && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Sabor de Soda
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {catalogos.sodas.map((sabor) => (
                  <button
                    key={sabor}
                    onClick={() => setSaborSoda(sabor)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left leading-tight ${saborSoda === sabor ? "morchis-elegido" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    {sabor}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <NotaProducto etiqueta="Nota de la soda" valor={notaSoda} cambiar={setNotaSoda} ejemplo="Ej. Sin hielo" />
              </div>
            </section>
          )}
          {((comboActual && comboActual.incluyePapas) ||
            producto.esProductoPapas) && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Preparación Papas
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {sazonadoresPapas.map((saz) => (
                  <button
                    key={saz}
                    aria-pressed={sazonadorPapas === saz}
                    onClick={() => setSazonadorPapas((actual) => actual === saz ? "" : saz)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left leading-tight ${sazonadorPapas === saz ? "morchis-elegido" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    {saz}
                  </button>
                ))}
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-[10px] tracking-wider uppercase">
                ¿Cómo quieres tus papas? *
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {removiblesPapas.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-left"
                  >
                    <input
                      type="checkbox"
                      checked={removiblesPapasSeleccionados.includes(item)}
                      disabled={preparacionBloqueada(item, removiblesPapasSeleccionados)}
                      onChange={() =>
                        toggleArray(item, setRemoviblesPapasSeleccionados)
                      }
                      className="w-4 h-4 shrink-0 rounded text-gray-900 morchis-check"
                    />
                    <span className="text-xs font-medium text-gray-700 leading-tight">
                      {item}
                      {item === "Todo Aparte" && ` (+$${PRECIO_ADEREZOS_PAPAS_APARTE} por queso, catsup y salsa)`}
                    </span>
                  </label>
                ))}
              </div>
              <div className="mt-3">
                <NotaProducto etiqueta="Nota de las papas" valor={notaPapas} cambiar={setNotaPapas} ejemplo="Ej. Bien doradas, poca salsa" />
              </div>
            </section>
          )}
        </div>
        <div className="p-4 morchis-vidrio morchis-area-inferior border-t border-gray-100 shrink-0 flex gap-3 items-center">
          <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-xl p-1 w-28 sm:w-32 shrink-0 h-14">
            <button
              onClick={() => setCantidadItem(Math.max(1, cantidadItem - 1))}
              className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              -
            </button>
            <span className="font-black text-gray-900 text-lg">
              {cantidadItem}
            </span>
            <button
              onClick={() => setCantidadItem(cantidadItem + 1)}
              className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAgregar}
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
