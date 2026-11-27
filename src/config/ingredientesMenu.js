// Ingredientes que el cliente puede pedir que se retiren.
const aderezos = ["Mayonesa", "Mostaza", "Catsup"];
const verduras = ["Cebolla caramelizada", "Jitomate", "Lechuga"];
export const CHILES_A_ELEGIR = ["Jalapeños", "Chipotle", "Sin chile"];
const productosConChile = new Set(["burritos", "sandwiches", "baguettes", "sincronizadas"]);

export const INGREDIENTES_PAN = ["Frijoles", ...verduras, "Mayonesa"];
const ingredientesPorProducto = {
  burgers: ["Cebolla caramelizada", "Jitomate", "Lechuga", "Jalapeños", ...aderezos],
  jochos: ["Cebolla caramelizada", "Jitomate", "Jalapeños", ...aderezos],
  burritos: ["Chile morrón", "Cebolla caramelizada", "Frijoles", "Jitomate"],
  alambres: ["Chile morrón", "Cebolla caramelizada", "Salchicha", "Tocino", "Jamón", "Queso", "Salsa", "Limón"],
  sandwiches: INGREDIENTES_PAN,
  baguettes: INGREDIENTES_PAN,
  sincronizadas: ["Frijoles", ...verduras],
  papas_lokas: ["Gomitas", "Cacahuates", "Salsas negras", "Salsa picante", "Chamoy", "Miguelito", "Tajín", "Limón"],
};

export function aplicarIngredientesMenu(producto) {
  if (!Object.hasOwn(ingredientesPorProducto, producto.id)) return producto;
  return {
    ...producto,
    usaRemoviblesGlobales: false,
    ...(productosConChile.has(producto.id) ? { opcionesChile: CHILES_A_ELEGIR } : {}),
    removiblesEspecificos: ["Con todo", ...ingredientesPorProducto[producto.id].map((ingrediente) => `Sin ${ingrediente.toLowerCase()}`)],
  };
}
