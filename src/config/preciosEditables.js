import { idExtraCompartido, precioExtraCompartido } from "./extrasCompartidos";
import { configurarDesayuno } from "./menuDesayunos";

export const DOCUMENTO_PRECIOS = "precios_menu";
export const clavePrecio = (...partes) => partes.join("__");

export function precioDeMenu(precios, clave, anterior) {
  if (!Object.hasOwn(precios, clave)) return anterior;
  const valor = precios[clave];
  return Number.isFinite(valor) && valor >= 0 ? valor : null;
}

export function aplicarPreciosVariantes(entrada, precios, indiceExtras) {
  const producto = configurarDesayuno(entrada);
  return {
    ...producto,
    variantes: (producto.variantes ?? []).map((variante) => ({
      ...variante,
      precioEditado: Object.hasOwn(precios, clavePrecio(producto.id, variante.id)),
      precioBase: precioDeMenu(precios, clavePrecio(producto.id, variante.id), variante.precioBase),
    })),
    ...(producto.extras ? { extras: producto.extras.map((extra) => {
      const id = idExtraCompartido(extra.nombre);
      return {
        ...extra,
        precio: precioExtraCompartido(precios, id,
          precioDeMenu(precios, clavePrecio(producto.id, "extra", extra.id), extra.precio),
          indiceExtras?.get(id)?.claves),
      };
    }) } : {}),
  };
}
