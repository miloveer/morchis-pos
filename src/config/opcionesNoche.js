import { sazonadoresPapas } from "../data/menu";
import { catalogoDeProducto } from "./catalogos";
import { LIMITE_SALSAS_APARTE } from "./precios";

const normalizar = (valor) => String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
export const tipoSalsa = normalizar;
export const INGREDIENTES_CLASICAS = ["Salsas negras", "BBQ", "Salsa picante", "Tajín", "Limón"];
export function descripcionSalsa(nombre) {
  const tipo = tipoSalsa(nombre);
  if (tipo === "clasicas") return "Negras · BBQ · Picante · Tajín · Limón";
  if (tipo === "clasicos") return "Búfalo · Ranch";
}

export const ADEREZOS_BANDERILLAS = ["Queso", "Catsup", "Salsa"];
export const PRECIO_SAZONADOR = 5;
const sazonadoresSinSal = sazonadoresPapas.filter((nombre) => normalizar(nombre) !== "sal");

export function opcionesProducto(producto, variante, catalogos) {
  const id = normalizar(producto.id);
  if (id === "licuados") return { titulo: "Sabor del licuado", opciones: catalogos.frappes ?? [] };
  if (["te_caliente", "te_helado", "jarra_te_helado"].includes(id))
    return { titulo: "Sabor del té", opciones: catalogos.tes ?? [] };
  const esFrappe = Boolean(producto.esFrappe) || /frapp[eé]/i.test(`${producto.id ?? ""} ${producto.nombre ?? ""}`);
  const cafeConSabor = id === "cafe_frio" || id === "cafe_latte_frio" || (id === "cafe_caliente" && (variante?.id === "ccs" || normalizar(variante?.nombre) === "americano con sabor"));
  if (esFrappe || cafeConSabor) {
    const sabores = (cafeConSabor && id === "cafe_latte_frio" ? catalogos.cafes : catalogos.frappes) ?? [];
    return {
      titulo: esFrappe ? "Sabor del frappe" : "Sabor del café",
      opciones: cafeConSabor ? sabores.filter((nombre) => normalizar(nombre) !== "fresa") : sabores,
    };
  }
  if (id === "cafe_caliente" || id === "cafe_frio_clasico") return null;
  const opciones = catalogoDeProducto(producto, catalogos) ?? [];
  return producto.opcionObligatoria || opciones.length ? {
    titulo: producto.opcionObligatoria?.titulo ?? "Sabor",
    opciones,
  } : null;
}

export function opcionesSalsas(producto, variante, catalogos) {
  const id = normalizar(producto.id);
  const alitasOBoneless = id === "alitas" || id === "boneless";
  const banderillas = id === "banderillas_coreanas";
  const chicken = (id === "burgers" || id === "jochos") && Boolean(variante?.chicken || /\bchicken\b/i.test(variante?.nombre ?? ""));
  const maximo = banderillas || chicken ? 1 : producto.maxSalsas || (alitasOBoneless ? 3 : 0);
  const opciones = Array.from(new Set(catalogos.salsas_alitas ?? []))
    .filter((salsa) => !chicken || !["clasicas", "clasicos"].includes(tipoSalsa(salsa)));
  return { banderillas, chicken, maximo, opciones, obligatoria: !alitasOBoneless && !banderillas && !chicken && maximo > 0,
    permiteAparte: maximo > 0 && !banderillas && !chicken,
    permiteSazonador: (banderillas || alitasOBoneless),
    sazonadores: (banderillas || alitasOBoneless) ? sazonadoresSinSal : [],
    precioSazonadorConSalsa: alitasOBoneless ? PRECIO_SAZONADOR : 0 };
}

// El sazonador se cobra una vez por orden, solo cuando también hay salsa.
export function calcularSazonador(reglas, sazonador, salsas = []) {
  return reglas.sazonadores.includes(sazonador) && salsas.length
    ? reglas.precioSazonadorConSalsa : 0;
}

export function listaSalsasAparte(item) {
  return item.salsasServidasAparte ?? (item.salsasAparte ? item.salsas ?? [] : []);
}

export function revisarServicioSalsas(reglas, item) {
  const aparte = listaSalsasAparte(item);
  if (item.pedirSalsasAparte && aparte.length === 0) {
    return "elige al menos una salsa para servir aparte";
  }
  if (item.pedirSalsaExtra && !item.salsaExtra) {
    return "elige el sabor de la salsa extra";
  }
  if (aparte.length && (!reglas.permiteAparte || aparte.length > LIMITE_SALSAS_APARTE ||
      new Set(aparte).size !== aparte.length ||
      aparte.some((nombre) => !item.salsas?.includes(nombre)))) {
    return "revisa las salsas que quieres aparte";
  }
  if (item.salsaExtra && (!reglas.permiteAparte || !reglas.opciones.includes(item.salsaExtra))) {
    return "elige una salsa extra disponible";
  }
  return "";
}

export function detalleSalsasPedido(item, { marcarAparte = false } = {}) {
  const aparte = marcarAparte ? listaSalsasAparte(item) : [];
  return (item.salsas ?? []).map((salsa) => {
    const nombre = aparte.includes(salsa) ? `${salsa} (aparte)` : salsa;
    if (tipoSalsa(salsa) === "clasicas") {
      return item.sinClasicas?.length ? `${nombre} (sin ${item.sinClasicas.join(", ")})` : `${nombre} (con todo)`;
    }
    if (tipoSalsa(salsa) === "clasicos") return `${nombre} (Búfalo y ranch)`;
    return nombre;
  }).join(", ");
}
