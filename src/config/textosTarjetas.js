import { obtenerTipoMenu } from "./tipoMenu";

const clave = (valor) => String(valor ?? "").normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

const textos = {
  burgers: "De la sencilla a la Morchis",
  jochos: "Hot dogs a tu gusto",
  alitas: "Elige tus salsas y sazonador",
  boneless: "Bocados de pollo con tu salsa",
  papas_francesa: "Clásicas, jumbo o con tocino",
  papas_francesas: "Clásicas, jumbo o con tocino",
  papas_lokas: "Con gomitas, cacahuates y chamoy",
  burritos: "Elige tu relleno favorito",
  alambres: "Con queso y tu carne favorita",
  hotcakes: "Con el jarabe que más te guste",
  hot_cakes: "Con el jarabe que más te guste",
  soda_italiana: "Burbujas con tu sabor favorito",
  frappes: "Fríos, cremosos y a tu gusto",
  chamoyadas: "Sabor helado con toque de chamoy",
  smoothies: "Fruta bien fría",
  refresco_solo: "Elige tu refresco favorito",
  refrescos: "Elige tu refresco favorito",
  refresco_preparado: "Con limón, sal o Tajín",
  sandwiches: "Jamón, queso y más",
  sincronizadas: "Jamón y queso en tortilla",
  banderillas_coreanas: "Elige salsa, aderezo y sazonador",
  oreos_fritas: "Con el topping que más te guste",
  ensaladas: "Con tu aderezo favorito",
  cafe_frio: "Elige tamaño y sabor",
  cafe_frio_clasico: "Americano, crema o leche",
  cafe_latte_frio: "Café, leche, hielo y sirope",
  cafe_caliente: "Americano, crema o leche",
  baguettes: "Combina tus rellenos",
  huevo_al_gusto: "Pídelo como más te guste",
  omelette: "Suave y recién hecho",
  chilaquiles: "Totopos bañados en salsa",
  molletes: "Frijoles y queso gratinado",
  licuados: "Para acompañar tu desayuno",
  te: "Una taza para empezar el día",
  te_helado: "Té frío y refrescante",
};

export function descripcionDeTarjeta(producto) {
  const personalizada = typeof producto.descripcionTarjeta === "string"
    ? producto.descripcionTarjeta.trim() : "";
  const dest = (valor) => {
    const id = clave(valor);
    return Object.hasOwn(textos, id) ? textos[id] : "";
  };
  return personalizada || dest(producto.id) || dest(producto.nombre) ||
    (obtenerTipoMenu(producto) === "bebidas" ? "Una bebida para tu antojo" : "Un platillo para tu antojo");
}
