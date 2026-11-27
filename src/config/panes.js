import { configurarDesayuno, productosDesayuno } from "./menuDesayunos";
import { idExtraCompartido, precioExtraCompartido, registrarExtra } from "./extrasCompartidos";
import { clavePrecio, precioDeMenu, aplicarPreciosVariantes } from "./preciosEditables";
import { ajustarVariantesMenu } from "./variantesMenu";

export const RELLENOS_PAN = [
  { id: "huevo", nombre: "Huevo" },
  { id: "jamon", nombre: "Jamón" },
  { id: "salchicha", nombre: "Salchicha" },
  { id: "longaniza", nombre: "Longaniza" },
  { id: "bistec", nombre: "Bistec" },
  { id: "milanesa", nombre: "Milanesa" },
  { id: "pechuga", nombre: "Pechuga empanizada" },
  { id: "pollo", nombre: "Pollo asado" },
  { id: "tresQuesos", nombre: "3 quesos" },
];

export const EXTRAS_PAN = [
  ...RELLENOS_PAN,
  { id: "pina", nombre: "Piña" },
  { id: "quesoManchego", nombre: "Queso Manchego" },
  { id: "quesoAmericano", nombre: "Queso Americano" },
  { id: "quesoOaxaca", nombre: "Quesillo" },
  { id: "dobleCarne", nombre: "Doble carne" },
  { id: "tocino", nombre: "Tocino" },
];

export const QUESOS_CHEESE = [
  { id: "americano", nombre: "Americano" },
  { id: "manchego", nombre: "Manchego" },
  { id: "oaxaca", nombre: "Oaxaca (quesillo)" },
];

export const ESTILOS_PAN = [
  { id: "sencilla", nombre: "Sencilla", incluye: [] },
  { id: "honolulu", nombre: "Honolulu", incluye: ["queso Manchego", "piña"] },
  { id: "cheese", nombre: "Cheese", incluye: [], eligeQueso: true },
  { id: "morchis", nombre: "Morchis", incluye: ["jamón", "salchicha", "queso americano"] },
  { id: "porky", nombre: "Porky", incluye: ["jamón", "tocino", "salchicha", "BBQ"] },
  { id: "tresQuesos", nombre: "3 quesos", incluye: ["queso Manchego", "quesillo", "queso Americano"] },
];

// Cada tabla es independiente. Completa los valores pendientes en MXN.
// Ejemplo de edición: base: { ...preciosPendientes(RELLENOS_PAN), huevo: 65 }
const preciosPendientes = (opciones) => Object.fromEntries(opciones.map(({ id }) => [id, null]));

export const PRECIOS_PANES = {
  baguette: {
    nombre: "Baguette",
    publicar: false,
    base: preciosPendientes(RELLENOS_PAN),
    extra: preciosPendientes(EXTRAS_PAN),
    estilo: { ...preciosPendientes(ESTILOS_PAN), sencilla: 0 },
  },
  sandwich: {
    nombre: "Sándwich",
    publicar: false,
    // Honolulu cambió de receta. Su recargo queda pendiente de confirmar.
    base: { ...preciosPendientes(RELLENOS_PAN), jamon: 55 },
    extra: preciosPendientes(EXTRAS_PAN),
    estilo: { ...preciosPendientes(ESTILOS_PAN), sencilla: 0, cheese: 10 },
  },
};

const AMBOS_TURNOS = ["desayunos", "noche"];
export const COMPARTIDOS = new Set([
  "baguettes", "burritos", "alambres", "sandwiches", "sincronizadas",
  "hotcakes", "jochos", "burgers", "frappes", "smoothies", "chamoyadas",
  "soda italiana", "soda_italiana", "refresco_solo", "refresco_preparado",
]);
export const esCompartido = (id) => COMPARTIDOS.has(id) || /^caf[eé](?:_| |$)/i.test(id);


export const PRODUCTOS_PAN = {
  baguette: { id: "baguettes", nombre: "Baguettes", icono: "🥖", turnos: AMBOS_TURNOS, tipoPan: "baguette" },
  sandwich: { id: "sandwiches", nombre: "Sándwiches", icono: "🥪", turnos: AMBOS_TURNOS, tipoPan: "sandwich" },
};

export function precioDefinido(valor) {
  return Number.isFinite(valor) && valor >= 0 && Number.isSafeInteger(Math.round(valor * 100));
}

export function indiceExtrasMenu(productos = []) {
  const indice = new Map();
  for (const { id, nombre } of EXTRAS_PAN) {
    for (const tipo of Object.keys(PRODUCTOS_PAN)) registrarExtra(indice, nombre, clavePrecio("pan", tipo, "extra", id));
  }
  for (const entrada of [...productos, ...productosDesayuno()]) {
    const producto = configurarDesayuno(entrada);
    for (const extra of producto.extras ?? []) {
      registrarExtra(indice, extra.nombre, clavePrecio(producto.id, "extra", extra.id));
    }
  }
  return indice;
}

export function preciosDelPan(tipo, editables = {}, indice = indiceExtrasMenu()) {
  const base = PRECIOS_PANES[tipo];
  const grupos = Object.fromEntries(["base", "estilo", "extra"].map((grupo) => [grupo, Object.fromEntries(
    Object.entries(base[grupo]).map(([id, anterior]) => [id, grupo === "estilo" && id === "sencilla" ? 0 : precioDeMenu(editables, clavePrecio("pan", tipo, grupo, id), anterior)]),
  )]));
  for (const { id, nombre } of EXTRAS_PAN) {
    const compartido = idExtraCompartido(nombre);
    grupos.extra[id] = precioExtraCompartido(editables, compartido, grupos.extra[id], indice.get(compartido)?.claves);
  }
  return { ...base, ...grupos, publicar: editables[clavePrecio("pan", tipo, "activo")] === true };
}

export function panDisponibleEnMenu(tipo, editables = {}, indice) {
  const precios = preciosDelPan(tipo, editables, indice);
  return Boolean(precios?.publicar &&
    RELLENOS_PAN.every(({ id }) => precioDefinido(precios.base[id])) &&
    EXTRAS_PAN.every(({ id }) => precioDefinido(precios.extra[id])) &&
    ESTILOS_PAN.every(({ id }) => precioDefinido(precios.estilo[id])));
}

export function prepararMenuPanes(productos, precios = {}, vistaPrevia = false) {
  const indice = indiceExtrasMenu(productos);
  const tipos = Object.keys(PRODUCTOS_PAN).filter((tipo) => vistaPrevia || panDisponibleEnMenu(tipo, precios, indice));
  const configurado = (tipoPan) => ({ tipoPan, preciosPan: preciosDelPan(tipoPan, precios, indice) });
  const porId = new Map(tipos.map((tipo) => [PRODUCTOS_PAN[tipo].id, tipo]));
  return [
    ...productos.map((entrada) => {
      const producto = aplicarPreciosVariantes(ajustarVariantesMenu(entrada), precios, indice);
      if (!esCompartido(producto.id)) return producto;
      const compartido = {
        ...producto,
        nombre: producto.id === "smoothies" ? "Slushie" : producto.nombre,
        turnos: AMBOS_TURNOS,
        ...(producto.id === "smoothies" ? { tipoMenu: "bebidas" } : {}),
      };
      const tipoPan = porId.get(producto.id);
      return tipoPan ? { ...compartido, ...configurado(tipoPan), ...(vistaPrevia ? { agotado: false } : {}) } : compartido;
    }),
    ...tipos.map((tipo) => ({ ...PRODUCTOS_PAN[tipo], ...configurado(tipo) })).filter(({ id }) => !productos.some((producto) => producto.id === id)),
  ];
}
