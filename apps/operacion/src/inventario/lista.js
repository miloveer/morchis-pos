import { pendiente } from "../costeo/modelo";

export const MAX_CANTIDAD_COMPRA = 1e6;
export const MAX_FOTO = 96 * 1024;

export function cantidadPlaneada(item) {
  return item.cantidadCompra ?? pendiente(item);
}

export function agruparPorTienda(items) {
  const grupos = new Map();
  for (const item of items) {
    const tienda = item.tienda.trim() || "Sin tienda";
    const clave = tienda.normalize("NFC").toLocaleLowerCase("es-MX");
    if (!grupos.has(clave)) grupos.set(clave, { clave, tienda, items: [] });
    grupos.get(clave).items.push(item);
  }
  return [...grupos.values()].sort((a, b) => a.tienda.localeCompare(b.tienda, "es-MX"));
}

export const cantidad = (v) => v.toLocaleString("es-MX", { maximumFractionDigits: 4 });

export function resumenPrecios(items, estimados) {
  let total = 0, sinPrecio = 0, conPrecio = 0, pendiente = 0, pendientesSinPrecio = 0;
  for (const i of items) {
    const precio = estimados.get(i.id);
    if (precio == null) {
      sinPrecio++;
      if (!i.comprado) pendientesSinPrecio++;
    } else {
      conPrecio++;
      total += precio;
      if (!i.comprado) pendiente += precio;
    }
  }
  return { total, sinPrecio, conPrecio, pendiente, pendientesSinPrecio };
}

export function textoCompras(items) {
  return ["Lista de compras MORCHIS", ...agruparPorTienda(items).flatMap(({ tienda, items: grupo }) =>
    ["", tienda, ...grupo.map((i) => `• ${i.nombre}: ${cantidad(cantidadPlaneada(i))} ${i.presentacion}`)])].join("\n");
}
