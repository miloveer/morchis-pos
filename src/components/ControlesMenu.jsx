export function OpcionMenu({ children, activa, elegir, descripcion, bloqueada = false }) {
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
      <span aria-hidden="true"
        className={`mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border ${activa ? "border-current" : "border-gray-300"}`}>
        {activa && <span className="h-2 w-2 rounded-full bg-current" />}
      </span>
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

export function SeccionMenu({ titulo, detalle, children }) {
  return (
    <section className="min-w-0 space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-3.5 sm:p-4">
      <TituloSeleccion detalle={detalle}>{titulo}</TituloSeleccion>
      {children}
    </section>
  );
}
