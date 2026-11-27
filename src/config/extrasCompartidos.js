export const claveExtraCompartido = (id) => `extra_compartido__${id}`;

export function idExtraCompartido(nombre) {
  const id = String(nombre ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  if (["quesillo", "queso_oaxaca", "queso_quesillo"].includes(id)) return "quesillo";
  if (["pollo", "pollo_asado"].includes(id)) return "pollo";
  return id;
}

const importeValido = (valor) => Number.isFinite(valor) && valor >= 0;

export function precioExtraCompartido(precios, id, respaldo = null, clavesAnteriores = []) {
  const clave = claveExtraCompartido(id);
  if (Object.hasOwn(precios, clave)) return importeValido(precios[clave]) ? precios[clave] : null;
  const anteriores = new Set(clavesAnteriores.map((anterior) => precios[anterior]).filter(importeValido));
  return anteriores.size === 1 ? [...anteriores][0] : respaldo;
}

export function registrarExtra(indice, nombre, claveAnterior) {
  const id = idExtraCompartido(nombre);
  if (!id) return;
  if (!indice.has(id)) indice.set(id, { id, nombre: id === "quesillo" ? "Quesillo" : nombre, claves: [] });
  const entrada = indice.get(id);
  if (!entrada.claves.includes(claveAnterior)) entrada.claves.push(claveAnterior);
}
