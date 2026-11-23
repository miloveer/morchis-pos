// Ingredientes que el cliente puede quitar en la app de pedidos.
const ingredientesBase = ["Frijoles", "Cebolla", "Jitomate", "Lechuga", "Chile"];

const ingredientesPorProducto = new Map([
  ["burritos", [...ingredientesBase, "Chile morrón"]],
  ["sandwiches", [...ingredientesBase, "Mayonesa"]],
  ["sincronizadas", ingredientesBase],
]);

export function aplicarIngredientesMenu(producto) {
  const ingredientes = ingredientesPorProducto.get(producto.id);
  if (!ingredientes) return producto;

  return {
    ...producto,
    usaRemoviblesGlobales: false,
    removiblesEspecificos: ["Con todo", ...ingredientes.map((ingrediente) => `Sin ${ingrediente.toLowerCase()}`)],
  };
}
