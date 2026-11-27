export const CLAVE_CARRITO = "morchis_carrito";
export const claveCarrito = (turno, vistaPrevia) => vistaPrevia ? null
  : turno === "noche" ? CLAVE_CARRITO : `${CLAVE_CARRITO}_${turno}`;

export function leerCarrito(clave) {
  if (!clave) return [];
  try {
    const items = JSON.parse(localStorage.getItem(clave) ?? "[]");
    return Array.isArray(items) ? items.filter((item) => item && typeof item.nombreProducto === "string" &&
      Number.isSafeInteger(item.cantidad) && item.cantidad > 0 && Number.isFinite(item.totalItem) && item.totalItem >= 0) : [];
  } catch {
    return [];
  }
}

export function persistirCarrito(clave, items) {
  if (!clave) return;
  try {
    if (items.length) localStorage.setItem(clave, JSON.stringify(items));
    else localStorage.removeItem(clave);
  } catch {
    // El carrito de la sesión sigue funcionando si el navegador bloquea el almacenamiento.
  }
}

export function idDeLinea() {
  return globalThis.crypto.randomUUID?.() ?? globalThis.crypto.getRandomValues(new Uint32Array(4)).join("-");
}
