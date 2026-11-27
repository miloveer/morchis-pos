export default function AvisoPedido({ aviso, onCerrar }) {
  if (!aviso) return null;

  const esExito = aviso.tipo === "exito";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="morchis-vidrio pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-black/10 p-3 text-left shadow-xl">
        <span
          aria-hidden="true"
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-black ${
            esExito
              ? "bg-green-100 text-green-900"
              : "morchis-tinte morchis-dorado"
          }`}
        >
          {esExito ? "✓" : "!"}
        </span>

        <div
          role={esExito ? "status" : "alert"}
          className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-900"
        >
          <p className="font-extrabold">
            {esExito ? "Listo" : "Revisa tu pedido"}
          </p>
          <p>{aviso.mensaje}</p>
        </div>

        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar aviso"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-lg text-gray-700"
        >
          ×
        </button>
      </div>
    </div>
  );
}