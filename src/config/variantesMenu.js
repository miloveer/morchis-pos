import { menuData as catalogoInicial } from "../data/menu";

const preciosChicken = { burgers: 90, jochos: 70 };
const idsChicken = { burgers: "b7", jochos: "j7" };
export const QUESOS_BASE_SYNC = ["Manchego", "Quesillo"];
const QUESOS_SYNC = [...QUESOS_BASE_SYNC, "Americano"];
export const quesosAdicionalesSync = (base) =>
  QUESOS_BASE_SYNC.includes(base) ? QUESOS_SYNC.filter((queso) => queso !== base) : [];

// Completa solo los precios aprobados. Mientras sean null se puede revisar la
// combinación en pantalla, pero no agregarla al pedido.
const preciosSincronizadas = { dosQuesos: null, morchis: null, porky: null };
const precioValido = (precio) => Number.isFinite(precio) && precio >= 0;

function variantesChicken(producto) {
  const originales = producto.variantes.filter((v) => !v.chickenBaseId);
  const referencia = catalogoInicial.find(({ id }) => id === producto.id).variantes;
  const chickenId = idsChicken[producto.id];
  const anterior = originales.find(({ id, nombre }) => id === chickenId || /^chicken$/i.test(nombre));
  const base = { ...anterior, id: anterior?.id ?? chickenId, nombre: "Chicken",
    descripcion: "Con boneless", precioBase: preciosChicken[producto.id], chicken: true };
  const estilos = originales.filter((v) => v !== anterior);
  const sencilla = estilos.find(({ id, nombre }) => id === referencia[0].id || /^sencill[ao]$/i.test(nombre));
  const derivadas = estilos.filter((estilo) => estilo !== sencilla).map((estilo) => {
    const recargo = precioValido(estilo.precioBase) && precioValido(sencilla?.precioBase) && estilo.precioBase >= sencilla.precioBase
      ? Math.round((estilo.precioBase - sencilla.precioBase) * 100) / 100 : null;
    return { ...estilo, id: `${base.id}--${estilo.id}`, nombre: `Chicken · ${estilo.nombre}`,
      nombreEstilo: estilo.nombre, chicken: true, chickenBaseId: base.id, recargo,
      precioBase: recargo === null ? null : Math.round((base.precioBase + recargo) * 100) / 100,
      agotada: Boolean(base.agotada || estilo.agotada) };
  });
  return { ...producto, variantes: [...estilos, base, ...derivadas] };
}

function variantesSincronizadas(producto) {
  const originales = producto.variantes;
  const catalogo = catalogoInicial.find(({ id }) => id === "sincronizadas");
  function precioComun(ids) {
    const precios = ids.map((id) => {
      const datos = originales.find((v) => v.id === id) ?? catalogo.variantes.find((v) => v.id === id);
      return datos?.precioBase;
    });
    return precioValido(precios[0]) && precios.every((precio) => precio === precios[0]) ? precios[0] : null;
  }
  const base = (id, nombre, precioBase, descripcion, dosQuesos = false, idsOrigen = []) => {
    const opcionesQuesoBase = QUESOS_BASE_SYNC.filter((_, i) =>
      !originales.find((v) => v.id === idsOrigen[i])?.agotada);
    return { id, nombre, precioBase, descripcion, dosQuesos, opcionesQuesoBase, agotada: !opcionesQuesoBase.length };
  };
  const extrasBurger = catalogoInicial.find(({ id }) => id === "burgers")?.extras?.filter(({ id }) => id !== "ext1") ?? [];
  return { ...producto,
    extras: [...extrasBurger, ...(producto.extras ?? []).filter((extra) => extra.id !== "ext1" && !/^doble carne$/i.test(extra.nombre?.trim()) && !extrasBurger.some(({ id }) => id === extra.id))],
    variantes: [
      base("sync-clasica", "Clásica", precioComun(["sync1", "sync2"]), "Jamón y queso a elegir", false, ["sync1", "sync2"]),
      base("sync-honolulu", "Honolulu", precioComun(["sync5", "sync6"]), "+ Tocino y piña", false, ["sync5", "sync6"]),
      base("sync-dos-quesos", "2 quesos", preciosSincronizadas.dosQuesos, "Elige un queso base y otro distinto", true),
      base("sync-morchis", "Morchis", preciosSincronizadas.morchis, "+ Queso Americano y salchicha"),
      base("sync-porky", "Porky", preciosSincronizadas.porky, "+ Tocino, salchicha y BBQ"),
    ],
  };
}

const recetasEnsalada = [
  { id: "frutos", nombre: "Frutos rojos", descripcion: "Lechuga, espinaca, fresa, zarzamora, arándano azul, frambuesa y arándano." },
  { id: "jamon", nombre: "Jamón y uvas", descripcion: "Lechuga, espinaca, jamón, uva, arándano, pepino y jitomate cherry." },
];

export function ajustarVariantesMenu(producto) {
  if (!producto.variantes?.length) return producto;
  if (Object.hasOwn(preciosChicken, producto.id)) return variantesChicken(producto);
  if (producto.id === "sincronizadas") return variantesSincronizadas(producto);
  if (producto.id === "ensaladas") {
    return { ...producto, opcionObligatoria: {
      titulo: "Aderezo",
      opciones: ["Ranch", "Italiano", "César", "Mil islas", "Mostaza miel"],
    }, variantes: recetasEnsalada.flatMap((receta) => producto.variantes.map((tamano) => ({
      ...tamano, id: `${tamano.id}--${receta.id}`, nombre: `${receta.nombre} · ${tamano.nombre}`,
      descripcion: receta.descripcion,
    }))) };
  }
  if (producto.id === "hotcakes") return { ...producto,
    variantes: producto.variantes.map((v) => v.id === "hc1" ? { ...v, nombre: "6 piezas" } : v),
  };
  return producto;
}
