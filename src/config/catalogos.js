import {
  listaSalsasAlitas,
  saboresCafe,
  saboresFrappes,
  saboresRefresco,
  saboresSoda,
} from "../data/menu";

export const CATALOGOS_PREDETERMINADOS = {
  salsas_alitas: listaSalsasAlitas,
  frappes: saboresFrappes,
  sodas: saboresSoda,
  refrescos: saboresRefresco,
  cafes: saboresCafe,
};

export const NOMBRES_CATALOGOS = {
  salsas_alitas: "Salsas para alitas y boneless",
  frappes: "Sabores de frappes",
  sodas: "Sabores de sodas y bebidas frutales",
  refrescos: "Refrescos disponibles",
  cafes: "Sabores de café",
};

export function catalogoDeProducto(producto, catalogos) {
  const id = producto.id?.toLowerCase();
  if (id === "frappes") return catalogos.frappes;
  if (id === "soda italiana" || id === "chamoyadas" || id === "smoothies") return catalogos.sodas;
  if (id === "refresco_solo") return catalogos.refrescos;
  if (id?.includes("cafe") || id?.includes("café")) return catalogos.cafes;
  return producto.opcionObligatoria?.opciones || [];
}
