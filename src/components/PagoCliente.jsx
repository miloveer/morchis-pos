import { formatoPesos } from "../utils/mensajePedido";

// Conserva el panel de pago existente cuando está instalado, incluidos sus datos de transferencia.
const instalado = import.meta.glob("./DatosPago.jsx", { eager: true, import: "default" })["./DatosPago.jsx"];

function PagoBasico({ metodoPago, setMetodoPago, billete, setBillete, cambioEfectivo }) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-2 font-bold">Forma de pago</legend>
      <div className="grid grid-cols-2 gap-2">
        {[["efectivo", "Efectivo"], ["transferencia", "Transferencia"]].map(([id, texto]) => (
          <button type="button" key={id} aria-pressed={id === metodoPago} onClick={() => setMetodoPago(id)}
            className={`min-h-11 rounded-xl border px-2 text-sm font-bold ${id === metodoPago ? "morchis-elegido" : "border-gray-200 bg-gray-50"}`}>
            {texto}
          </button>
        ))}
      </div>
      {metodoPago === "efectivo" ? (
        <label className="block text-sm font-semibold">
          ¿Con cuánto pagas? (opcional)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={billete}
            onChange={(evento) => setBillete(evento.target.value)} placeholder="Pago exacto"
            className="mt-1 block min-h-11 w-full rounded-xl border border-gray-300 px-3 text-base" />
          {billete && cambioEfectivo > 0 && <span className="mt-1 block">Cambio: {formatoPesos(cambioEfectivo)} MXN</span>}
        </label>
      ) : metodoPago === "transferencia" ? <p className="text-sm text-gray-700">Solicita los datos de transferencia al confirmar por WhatsApp.</p> : null}
    </fieldset>
  );
}

export default function PagoCliente(props) {
  const Componente = instalado ?? PagoBasico;
  return <Componente {...props} />;
}
