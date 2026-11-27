const normalizar = (valor) => String(valor ?? "").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");

const nombresDeBebidas = /^(?:bebidas?|cafes?|frappes?|sodas?|smoothies?|slushies?|chamoyadas?|refrescos?|licuados?|jugos?|limonadas?|tes?|aguas?)(?: |$)/;

export function obtenerTipoMenu(producto, tipoGrupo) {
  const tipo = normalizar(producto.tipoMenu || tipoGrupo);
  if (tipo === "bebidas" || tipo === "bebida") return "bebidas";
  if (tipo === "comida") return "comida";
  return [producto.id, producto.nombre].some((valor) => nombresDeBebidas.test(normalizar(valor)))
    ? "bebidas" : "comida";
}

export function gruposPorTipo(grupos, tipo) {
  return grupos.map((grupo) => ({
    ...grupo,
    productos: grupo.productos.filter((producto) => obtenerTipoMenu(producto, grupo.tipoMenu) === tipo),
  })).filter(({ productos }) => productos.length > 0);
}
