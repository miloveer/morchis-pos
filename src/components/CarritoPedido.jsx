import FotoProducto from "./FotoProducto";
import { detalleSalsasPedido, listaSalsasAparte } from "../config/opcionesNoche";
import PagoCliente from "./PagoCliente";
import { armarMensajePedido, detallePanParaPedido, formatoPesos, mostrarCarneEnPedido } from "../utils/mensajePedido";

export default function CarritoPedido({
  carrito,
  menuData,
  setMostrarCarrito,
  quitarDelCarrito,
  editarPan,
  nombreCliente,
  setNombreCliente,
  tipoEntrega,
  setTipoEntrega,
  direccion,
  setDireccion,
  metodoPago,
  setMetodoPago,
  billete,
  setBillete,
  cambioEfectivo,
  mostrarAviso,
  totalProductos,
  costoEnvioReal,
  totalPagar,
  estaAbierto,
  enviarAWhatsApp,
  razonCierre,
  abiertoEnWhatsApp,
  finalizarCarrito,
}) {
  return (
    <div role="dialog" aria-modal="true" aria-label="Tu pedido" data-dialogo-cliente className="fixed inset-0 morchis-carrito z-50 flex flex-col overflow-hidden animate-fade-in">
      <header className="morchis-vidrio p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          Tu pedido
        </h2>
        <button
          data-cerrar-dialogo onClick={() => setMostrarCarrito(false)}
          className="min-h-11 text-gray-900 font-bold text-sm bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </header>
      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 max-w-lg mx-auto w-full space-y-6">
        {carrito.length === 0 ? (
          <div className="text-center py-20">
            <h3 className="text-xl font-bold text-gray-900">
              Tu orden está vacía
            </h3>
            <button
              onClick={() => setMostrarCarrito(false)}
              className="mt-6 bg-gray-900 text-white font-bold px-6 py-3 rounded-lg text-sm"
            >
              Regresar al menú
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4 tracking-tight">
                Resumen del pedido
              </h3>
              {carrito.map((item) => {
                const producto = menuData?.find((entrada) => item.productoId ? entrada.id === item.productoId : entrada.nombre === item.nombreProducto);
                const pan = item.detallePan ? detallePanParaPedido(item) : null;
                return (
                <div
                  key={item.idUnico}
                  className="py-4 flex gap-2 justify-between items-start border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <FotoProducto producto={producto} miniatura />
                  <div className="min-w-0 flex-1 wrap-anywhere">
                    <p className="font-black text-gray-900 text-sm mb-1">
                      {pan ? pan.titulo : `${item.cantidad}x ${item.nombreProducto}`}
                    </p>
                    {pan ? (
                      <div className="space-y-1 py-1 text-sm text-gray-700">
                        {pan.lineas.map((linea) => <p key={linea}>{linea}</p>)}
                      </div>
                    ) : (
                    <div className="text-[11px] text-gray-500 space-y-0.5 leading-tight mb-2">
                      <p>
                        <span className="font-bold">Opción:</span>{" "}
                        {item.variante}
                      </p>
                      {mostrarCarneEnPedido(item, menuData) && (
                        <p>
                          <span className="font-bold">Carne:</span>{" "}
                          {item.proteina}
                        </p>
                      )}
                      {item.chile && <p><strong>Chile:</strong> {item.chile}</p>}
                      {item.removibles && item.removibles.length > 0 && (
                        <p className="text-red-500">
                          <span className="font-bold">Sin:</span>{" "}
                          {item.removibles.join(", ")}
                        </p>
                      )}
                      {item.opcionObligatoria && (
                        <p>
                          <span className="font-bold">{item.tituloOpcion || "Elección"}:</span>{" "}
                          {item.opcionObligatoria}
                        </p>
                      )}
                      {item.salsas && item.salsas.length > 0 && (
                        <p>
                          <span className="font-bold">Salsas:</span>{" "}
                          {detalleSalsasPedido(item, { marcarAparte: true })}
                          {listaSalsasAparte(item).length > 0 && item.cargosAparte?.cargoSalsas > 0 &&
                            ` · +$${item.cargosAparte.cargoSalsas} por orden`}
                          {item.modoMezclaSalsa && (
                            <span className="italic">
                              {" "}
                              ({item.modoMezclaSalsa})
                            </span>
                          )}
                        </p>
                      )}
                      {item.sazonadorExtra && (
                        <p><span className="font-bold">Sazonador:</span> {item.sazonadorExtra}{item.cargoSazonador ? ` (+$${item.cargoSazonador} por orden)` : ""}</p>
                      )}
                      {item.aderezosBanderillas?.length > 0 && (
                        <p><span className="font-bold">Aderezos:</span> {item.aderezosBanderillas.join(", ")}</p>
                      )}
                      {item.salsaExtra && (
                        <p><span className="font-bold">Salsa extra:</span> {item.salsaExtra} (aparte)
                          {item.cargosAparte?.cargoSalsaExtra > 0 && ` · +$${item.cargosAparte.cargoSalsaExtra} por orden`}
                        </p>
                      )}
                      {item.combo && !item.combo.includes("Solo") && (
                        <p>
                          <span className="font-bold">Combo:</span>{" "}
                          {item.combo}
                        </p>
                      )}
                      {item.saborSoda && (
                        <p>
                          <span className="font-bold">+ Soda italiana:</span>{" "}
                          {item.saborSoda}
                          {item.notaSoda && <span className="block">Nota: {item.notaSoda}</span>}
                        </p>
                      )}
                      {item.saborFrappe && (
                        <p>
                          <span className="font-bold">Frappe:</span>{" "}
                          {item.saborFrappe}
                        </p>
                      )}
                      {item.detallesPapas && (
                        <div>
                          <p className="font-bold">{item.papasDeCombo ?? (item.combo && !/^solo\b/i.test(item.combo)) ? "+ Papas" : "Papas"}</p>
                          {item.detallesPapas?.sin?.length > 0 && (
                            <p>{item.detallesPapas.sin.join(", ")}</p>
                          )}
                          {item.detallesPapas.sazonador && <p>Sazonador: {item.detallesPapas.sazonador}</p>}
                          {item.notaPapas && <p>Nota: {item.notaPapas}</p>}
                          {item.cargosAparte?.cargoPapas > 0 && (
                            <p className="morchis-dorado"><span className="font-bold">Servicio:</span> Queso, catsup y salsa aparte (+${item.cargosAparte.cargoPapas})</p>
                          )}
                        </div>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <p className="morchis-dorado">
                          <span className="font-bold">Extras:</span>{" "}
                          {item.extras.map((e) => e.nombre).join(", ")}
                        </p>
                      )}
                      {item.notas && (
                        <p className="italic text-gray-700 bg-gray-50 p-1.5 rounded mt-1 border border-gray-100 text-[10px]">
                          Nota: {item.notas}
                        </p>
                      )}
                    </div>
                    )}
                    <p className="text-sm font-black text-gray-900">
                      {pan ? pan.importe : `$${item.totalItem * item.cantidad}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {pan && editarPan && <button type="button" onClick={() => editarPan(item)}
                      className="min-h-8 text-sm font-bold underline">Editar</button>}
                    <button
                    onClick={() => quitarDelCarrito(item.idUnico)}
                    className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-wider underline transition-colors pt-1"
                  >
                    Quitar
                  </button>
                  </div>
                </div>
                );
              })}
              {/* AQUÍ TERMINA EL NUEVO DESGLOSE */}
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-900 tracking-tight">
                Detalles de Entrega
              </h3>
              <div>
                <label htmlFor="pedido-nombre" className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                  Nombre completo *
                </label>
                <input
                  id="pedido-nombre" type="text" autoComplete="name"
                  value={nombreCliente}
                  onChange={(e) => setNombreCliente(e.target.value)}
                  placeholder="¿A nombre de quién?"
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium text-[16px]"
                />
              </div>
              <div>
                <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                  Tipo de entrega
                </label>
                <div className="flex gap-2">
                  <button
                    type="button" aria-pressed={tipoEntrega === "recoger"} onClick={() => setTipoEntrega("recoger")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "recoger" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    Recoger
                  </button>
                  <button
                    type="button" aria-pressed={tipoEntrega === "sucursal"} onClick={() => setTipoEntrega("sucursal")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "sucursal" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    En Mesa
                  </button>
                  <button
                    type="button" aria-pressed={tipoEntrega === "domicilio"} onClick={() => setTipoEntrega("domicilio")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "domicilio" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    Domicilio
                  </button>
                </div>
              </div>
              {tipoEntrega === "domicilio" && (
                <div className="animate-fade-in mt-4">
                  <label htmlFor="pedido-direccion" className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                    Dirección completa *
                  </label>
                  <textarea id="pedido-direccion" autoComplete="street-address"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, Número, Referencias..."
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none font-medium text-[16px]"
                    rows="2"
                  ></textarea>
                </div>
              )}
              <PagoCliente
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago}
                billete={billete}
                setBillete={setBillete}
                cambioEfectivo={cambioEfectivo}
                mostrarAviso={mostrarAviso}
              />
            </div>
            {import.meta.env.DEV && carrito.length > 0 && (
              <details className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 text-left">
                <summary className="cursor-pointer font-bold text-gray-900">
                  Vista previa de WhatsApp · Solo pruebas
                </summary>
                <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-800">
                  {armarMensajePedido({
                    carrito,
                    menuData,
                    nombreCliente: nombreCliente.trim() || "Cliente de prueba",
                    tipoEntrega,
                    direccion,
                    metodoPago,
                    billete,
                    totalPagar,
                  })}
                </pre>
              </details>
            )}
            {abiertoEnWhatsApp && (
              <div className="rounded-xl border border-green-300 bg-green-50 p-3 text-sm text-green-950" role="status">
                Se abrió WhatsApp. El pedido se envía cuando pulsas Enviar allí. Tu carrito sigue guardado.
                <button type="button" onClick={finalizarCarrito} className="mt-1 block min-h-11 font-bold underline">
                  Ya envié mi pedido · Vaciar carrito
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {carrito.length > 0 && (
        <div className="morchis-vidrio morchis-area-inferior shrink-0 px-4 pt-3 border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between text-gray-500 mb-2 text-sm">
              <span>Subtotal:</span>
              <span className="font-medium text-gray-900">
                {formatoPesos(totalProductos)}
              </span>
            </div>
            {tipoEntrega === "domicilio" && (
              <div className="flex justify-between text-gray-500 mb-4 text-sm">
                <span>Costo de envío:</span>
                <span className="font-medium text-gray-900">
                  {formatoPesos(costoEnvioReal)}
                </span>
              </div>
            )}
            <div className="flex justify-between mb-3 border-t border-gray-100 pt-2">
              <span className="font-black text-gray-900 text-lg tracking-tight">
                Total a pagar
              </span>
              <span className="font-black text-2xl text-gray-900">
                {formatoPesos(totalPagar)}
              </span>
            </div>
            {estaAbierto ? (
              <button
                onClick={enviarAWhatsApp}
                className="w-full morchis-accion p-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2"
              >
                {abiertoEnWhatsApp ? "Volver a abrir WhatsApp" : "Abrir pedido en WhatsApp"}
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-400 p-4 rounded-xl font-bold text-lg cursor-not-allowed"
              >
                {razonCierre ?? "Fuera de horario"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
