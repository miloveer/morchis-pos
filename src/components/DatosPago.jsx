import { formatoPesos } from "../utils/mensajePedido";
// Completa solo los datos que MORCHIS quiere mostrar a sus clientes.
const DATOS_TRANSFERENCIA = { banco: "Mercado Pago", titular: "Natasha Medina", clabe: "722969020770198269" };
const CLABE = DATOS_TRANSFERENCIA.clabe.replace(/\s/g, "");
const TRANSFERENCIA_CONFIGURADA =
  Boolean(DATOS_TRANSFERENCIA.banco.trim() && DATOS_TRANSFERENCIA.titular.trim()) &&
  /^\d{18}$/.test(CLABE);
export default function DatosPago({
  metodoPago,
  setMetodoPago,
  billete,
  setBillete,
  cambioEfectivo,
  mostrarAviso,
}) {
const copiarDato = async (valor, exito) => {
    try {
      await navigator.clipboard.writeText(valor);
      mostrarAviso(exito, "exito");
    } catch {
      mostrarAviso("No se pudo copiar. Selecciona el dato y cópialo manualmente.");
    }
  };

  return (
    <>
      <div className="border-t border-gray-100 pt-6">
                          <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                            Método de pago
                          </label>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setMetodoPago("efectivo")}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${metodoPago === "efectivo" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                            >
                              Efectivo
                            </button>
                            <button
                              onClick={() => setMetodoPago("transferencia")}
                              className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${metodoPago === "transferencia" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                            >
                              Transferencia
                            </button>
                          </div>
                        </div>
                        {metodoPago === "efectivo" && (
                          <div className="animate-fade-in">
                            <label htmlFor="billete-morchis" className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                              ¿Con cuánto pagas?
                            </label>
                            <input
                              id="billete-morchis"
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Ej. 300"
                              value={billete}
                              onChange={(e) => {
                                if (/^\d{0,7}$/.test(e.target.value)) setBillete(e.target.value);
                              }}
                              className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium text-[16px]"
                            />
                            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                              <button type="button" onClick={() => setBillete("")} className="morchis-tinte morchis-dorado rounded-xl px-3 py-2 text-sm font-bold">
                                Pago exacto
                              </button>
                              <p aria-live="polite" className="text-sm font-semibold text-gray-700">
                                {!billete ? "Sin cambio" : cambioEfectivo < 0
                                  ? `Faltan ${formatoPesos(-cambioEfectivo)}`
                                  : `Tu cambio: ${formatoPesos(cambioEfectivo)}`}
                              </p>
                            </div>
                          </div>
                        )}
                        {metodoPago === "transferencia" && (
                          <section aria-label="Datos de transferencia" className="morchis-tinte morchis-borde rounded-2xl border p-4 text-left">
                            <h3 className="font-bold text-gray-900">Datos de transferencia</h3>
                            {TRANSFERENCIA_CONFIGURADA ? (
                              <>
                                <dl className="mt-3 grid gap-2 text-sm text-gray-800">
                                  <div><dt className="font-bold">Banco</dt><dd className="select-all">{DATOS_TRANSFERENCIA.banco}</dd></div>
                                  <div><dt className="font-bold">Titular</dt><dd className="select-all">{DATOS_TRANSFERENCIA.titular}</dd></div>
                                  <div><dt className="font-bold">CLABE</dt><dd className="select-all break-all font-mono">{CLABE}</dd></div>
                                </dl>
                                <div className="mt-4 flex flex-wrap gap-2">
                                  <button type="button" onClick={() => copiarDato(CLABE, "CLABE copiada.")} className="morchis-accion px-4 py-2 text-sm font-bold">Copiar CLABE</button>
                                  <button type="button" onClick={() => copiarDato(
                                    `Banco: ${DATOS_TRANSFERENCIA.banco}\nTitular: ${DATOS_TRANSFERENCIA.titular}\nCLABE: ${CLABE}`,
                                    "Datos de transferencia copiados.",
                                  )} className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-gray-900">Copiar datos</button>
                                </div>
                              </>
                            ) : (
                              <p className="mt-2 text-sm text-gray-700">Pide los datos de transferencia por WhatsApp al enviar tu orden.</p>
                            )}
                          </section>
                        )}
    </>
  );
}
