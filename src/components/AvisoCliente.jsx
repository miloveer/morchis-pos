export default function AvisoCliente({ aviso, onCerrar }) {
  if (!aviso) return null;
  const exito = aviso.tipo === "exito";
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[70] mx-auto flex max-w-lg justify-center px-3">
      <div className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-neutral-300 bg-white p-3 text-neutral-900 shadow-lg">
        <p className="min-w-0 flex-1 wrap-anywhere text-sm font-semibold" role={exito ? "status" : "alert"}>{aviso.mensaje}</p>
        <button type="button" onClick={onCerrar} aria-label="Cerrar aviso" className="min-h-11 min-w-11 rounded-lg bg-neutral-100 text-xl">×</button>
      </div>
    </div>
  );
}
