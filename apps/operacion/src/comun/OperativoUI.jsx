export function Campo({ etiqueta, children }) {
  return <label className="op-campo"><span>{etiqueta}</span>{children}</label>;
}

export function Numero({ valor, cambiar, max = 1e9, min = 0, ...rest }) {
  return <input type="number" inputMode="decimal" step="any" min={min} max={max} value={valor ?? ""}
    onChange={(e) => cambiar(e.target.value === "" ? "" : Number(e.target.value))} {...rest} />;
}

export function Aviso({ error, children }) {
  return children && <p role={error ? "alert" : "status"} className={error ? "op-error" : "op-aviso"}>{children}</p>;
}
