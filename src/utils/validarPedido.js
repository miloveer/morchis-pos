import { catalogoDeProducto } from "../config/catalogos";

export function revisarArticulo(item, producto, catalogos) {
  if (!producto) return "este producto ya no aparece en el menú";
  const combo = producto.combos?.find(
    (opcion) => opcion.nombre === item.combo
  );
  if (
    (producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length) &&
    !item.removibles?.length
  ) {
    return "falta elegir cómo quieres el producto";
  }
  if (
    (producto.esProductoPapas || combo?.incluyePapas || item.detallesPapas) &&
    !item.detallesPapas?.sin?.length
  ) {
    return "falta elegir la preparación de las papas";
  }
  const esFrappe =
    Boolean(producto.esFrappe) ||
    /frapp[eé]/i.test(`${producto.id ?? ""} ${producto.nombre ?? ""}`);
  const opciones = esFrappe
    ? (catalogos.frappes ?? [])
    : catalogoDeProducto(producto, catalogos);
  const seleccion = item.opcionObligatoria || item.saborFrappe;
  if (
    (esFrappe || producto.opcionObligatoria || opciones.length > 0) &&
    !opciones.includes(seleccion)
  ) {
    return "falta una opción válida de sabor o preparación";
  }
  if (combo?.incluyeSoda && !catalogos.sodas.includes(item.saborSoda)) {
    return "falta elegir el sabor de la soda del combo";
  }
  return "";
}
export function preparacionBloqueada(opcion, seleccion) {
  // La opción marcada siempre se puede desmarcar.
  if (seleccion.includes(opcion)) return false;
  // «Sin…» se puede combinar con otras opciones «Sin…».
  const esParaQuitar = (texto) => /^sin\s/i.test(texto.trim());
  return seleccion.length > 0 &&
    (!esParaQuitar(opcion) || seleccion.some((valor) => !esParaQuitar(valor)));
}