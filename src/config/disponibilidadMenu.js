import { productosDesayuno } from "./menuDesayunos";
import { completarMenuNoche } from "./menuNoche";
import { aplicarIngredientesMenu } from "./ingredientesMenu";
import { prepararMenuPanes, PRODUCTOS_PAN } from "./panes";

export const DOCUMENTO_DISPONIBILIDAD = "disponibilidad_menu";

export const gruposDisponibilidad = [
  ["variantes", "Variantes"], ["opcionProteina", "Proteínas"], ["extras", "Extras"], ["combos", "Combos"],
];

export const idOpcion = (opcion) => opcion.id ?? opcion.nombre;
export const claveDisponibilidad = (id, grupo = "producto", opcion = "") =>
  JSON.stringify([id, grupo, opcion]);

export const estaAgotado = (opcion) => Boolean(opcion.agotado || opcion.agotada);

function aplicarEstado(opcion, clave, estados) {
  const valor = Object.hasOwn(estados, clave) ? estados[clave] : undefined;
  return typeof valor === "boolean" ? { ...opcion, agotado: valor, agotada: valor } : opcion;
}

export function aplicarDisponibilidad(menu, estados = {}) {
  const actualizado = menu.map((entrada) => {
    const producto = { ...aplicarEstado(entrada, claveDisponibilidad(entrada.id), estados) };
    for (const [grupo] of gruposDisponibilidad) {
      if (Array.isArray(producto[grupo])) {
        producto[grupo] = producto[grupo].map((opcion) =>
          aplicarEstado(opcion, claveDisponibilidad(producto.id, grupo, idOpcion(opcion)), estados));
      } else if (grupo === "combos") {
        delete producto.combos;
      }
    }
    const variantes = producto.variantes ?? [];
    const porId = new Map(variantes.map((v) => [v.id, v]));
    if (variantes.some((v) => v.chickenBaseId)) {
      producto.variantes = variantes.map((v) => {
        if (!v.chickenBaseId) return v;
        const estilo = porId.get(v.id.slice(v.chickenBaseId.length + 2));
        const bloqueada = Boolean(porId.get(v.chickenBaseId)?.agotada || estilo?.agotada);
        return bloqueada ? { ...v, agotada: true, motivoAgotado: "Chicken o estilo agotado" } : v;
      });
    }
    return producto;
  });
  const papas = actualizado.find((p) => ["papas_francesa", "papas_francesas"].includes(p.id));
  if (!papas?.agotado) return actualizado;
  return actualizado.map((p) => p.combos?.some((combo) => combo.incluyePapas)
    ? { ...p, combos: p.combos.map((combo) => combo.incluyePapas
      ? { ...combo, agotado: true, agotada: true, agotadoPorPapas: true, motivoAgotado: "Papas francesas agotadas" } : combo) }
    : p);
}

export function ensamblarMenu(datos, precios = {}, { vistaPrevia = false, operacion = false, estados = {} } = {}) {
  const defaults = productosDesayuno();
  const porId = new Map(defaults.map((p) => [p.id, p]));
  const base = completarMenuNoche(datos.map((producto) => aplicarIngredientesMenu({
    ...porId.get(producto.id), ...producto,
  })));
  const presentes = new Set(base.map(({ id }) => id));
  const desayunos = defaults.filter(({ id }) => !presentes.has(id));
  const preparados = prepararMenuPanes([...base, ...desayunos], precios, vistaPrevia);
  if (operacion) {
    const ids = new Set(preparados.map(({ id }) => id));
    for (const pan of Object.values(PRODUCTOS_PAN)) {
      if (!ids.has(pan.id)) preparados.push({ ...pan, publicacionPendiente: true });
    }
  }
  return aplicarDisponibilidad(preparados, estados);
}
