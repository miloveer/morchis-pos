import DatosPago from "./DatosPago";
import { armarMensajePedido, mostrarCarneEnPedido } from "../utils/mensajePedido";

export default function CarritoPedido({
  carrito,
  menuData,
  setMostrarCarrito,
  quitarDelCarrito,
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
}) {
  return (
    <div className="fixed inset-0 morchis-carrito z-50 flex flex-col overflow-hidden animate-fade-in">
      <header className="morchis-vidrio p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-xl font-black text-gray-900 tracking-tight">
          Checkout
        </h2>
        <button
          onClick={() => setMostrarCarrito(false)}
          className="text-gray-900 font-bold text-sm bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
        >
          Volver
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-6">
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
                Resumen de Orden
              </h3>
              {carrito.map((item) => (
                <div
                  key={item.idUnico}
                  className="py-4 flex justify-between items-start border-b border-gray-100 last:border-0 last:pb-0"
                >
                  <div className="flex-1 pr-4">
                    <p className="font-black text-gray-900 text-sm mb-1">
                      {item.cantidad}x {item.nombreProducto}
                    </p>
                    {/* Bloque de detalles minuciosos */}
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
                      {item.removibles && item.removibles.length > 0 && (
                        <p className="text-red-500">
                          <span className="font-bold">Sin:</span>{" "}
                          {item.removibles.join(", ")}
                        </p>
                      )}
                      {item.opcionObligatoria && (
                        <p>
                          <span className="font-bold">Elección:</span>{" "}
                          {item.opcionObligatoria}
                        </p>
                      )}
                      {item.salsas && item.salsas.length > 0 && (
                        <p>
                          <span className="font-bold">Salsas:</span>{" "}
                          {item.salsas.join(", ")}
                          {item.modoMezclaSalsa && (
                            <span className="italic">
                              {" "}
                              ({item.modoMezclaSalsa})
                            </span>
                          )}
                        </p>
                      )}
                      {item.salsasAparte && (
                        <p className="morchis-dorado">
                          <span className="font-bold">Servicio:</span>{" "}
                          Salsas aparte (+${item.cargosAparte.cargoSalsas})
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
                    <p className="text-sm font-black text-gray-900">
                      ${item.totalItem * item.cantidad}
                    </p>
                  </div>
                  <button
                    onClick={() => quitarDelCarrito(item.idUnico)}
                    className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-wider underline transition-colors pt-1"
                  >
                    Quitar
                  </button>
                </div>
              ))}
              {/* AQUÍ TERMINA EL NUEVO DESGLOSE */}
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <h3 className="font-bold text-gray-900 tracking-tight">
                Detalles de Entrega
              </h3>
              <div>
                <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                  Nombre completo *
                </label>
                <input
                  type="text"
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
                    onClick={() => setTipoEntrega("recoger")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "recoger" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    Recoger
                  </button>
                  <button
                    onClick={() => setTipoEntrega("sucursal")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "sucursal" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    En Mesa
                  </button>
                  <button
                    onClick={() => setTipoEntrega("domicilio")}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "domicilio" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                  >
                    Domicilio
                  </button>
                </div>
              </div>
              {tipoEntrega === "domicilio" && (
                <div className="animate-fade-in mt-4">
                  <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                    Dirección completa *
                  </label>
                  <textarea
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, Número, Referencias..."
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none font-medium text-[16px]"
                    rows="2"
                  ></textarea>
                </div>
              )}
              <DatosPago
                metodoPago={metodoPago}
                setMetodoPago={setMetodoPago}
                billete={billete}
                setBillete={setBillete}
                cambioEfectivo={cambioEfectivo}
                mostrarAviso={mostrarAviso}
              />
            </div>
          </>
        )}
      </div>
      {carrito.length > 0 && (
        <div className="morchis-vidrio morchis-area-inferior p-5 border-t border-gray-100">
          <div className="max-w-lg mx-auto">
            <div className="flex justify-between text-gray-500 mb-2 text-sm">
              <span>Subtotal:</span>
              <span className="font-medium text-gray-900">
                ${totalProductos}
              </span>
            </div>
            {tipoEntrega === "domicilio" && (
              <div className="flex justify-between text-gray-500 mb-4 text-sm">
                <span>Costo de envío:</span>
                <span className="font-medium text-gray-900">
                  ${costoEnvioReal}
                </span>
              </div>
            )}
            <div className="flex justify-between mb-5 border-t border-gray-100 pt-4">
              <span className="font-black text-gray-900 text-lg tracking-tight">
                Total a pagar
              </span>
              <span className="font-black text-2xl text-gray-900">
                ${totalPagar}
              </span>
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
            {estaAbierto ? (
              <button
                onClick={enviarAWhatsApp}
                className="w-full morchis-accion p-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2"
              >
                Enviar Orden
              </button>
            ) : (
              <button
                disabled
                className="w-full bg-gray-200 text-gray-400 p-4 rounded-xl font-bold text-lg cursor-not-allowed"
              >
                Fuera de horario
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
