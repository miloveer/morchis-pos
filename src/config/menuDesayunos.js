const mexicana = { nombre: "A la mexicana", detalle: "Jitomate, cebolla y chile" };
const guisos = ["Jamón", "Salchicha", "Tocino", "Longaniza", "Champiñones"].map((nombre) => ({ nombre }));

// Recetas para revisar en la vista local mientras se confirman los precios.
export const RECETAS_DESAYUNO = {
  "Huevos al gusto": {
    incluye: "Frijoles y pan.",
    preparaciones: {
      Revueltos: [...guisos, mexicana],
      Estrellados: guisos,
    },
  },
  Omelette: {
    incluye: "Queso Manchego, frijoles y pan.",
    preparaciones: { Omelette: [...guisos, mexicana] },
  },
  Chilaquiles: {
    incluye: "Salsa verde, queso rallado, cebolla, crema y pan.",
    preparaciones: {
      Chilaquiles: [
        ...["Sencillos", "Pollo", "Milanesa", "Bistec", "Longaniza", "Campechano"].map((nombre) => ({ nombre })),
        { nombre: "Huevo revuelto" },
        { nombre: "Huevo estrellado" },
      ],
    },
  },
  Licuados: {
    incluye: "Los mismos sabores que los frappes.",
    preparaciones: { Tamaño: [{ nombre: "Chico" }, { nombre: "Grande" }] },
  },
  "Té caliente": {
    incluye: "Un tamaño.",
    preparaciones: {},
  },
  "Té helado": {
    incluye: "Sabores por confirmar.",
    preparaciones: { Tamaño: [{ nombre: "Chico" }, { nombre: "Grande" }] },
  },
  "Jarra de té helado": {
    incluye: "Disponible solo para consumo en el local.",
    preparaciones: {},
    soloSucursal: true,
  },
  Molletes: {
    incluye: "Frijoles y queso Manchego.",
    preparaciones: {
      Molletes: ["Sencillos", "Jamón", "Tocino", "Salchicha", "Longaniza"].map((nombre) => ({ nombre })),
    },
  },
};

export const GRUPOS_DESAYUNO = [
  { titulo: "De la mañana", productos: ["Huevos al gusto", "Omelette", "Molletes", "Chilaquiles"] },
  { titulo: "Bebidas", productos: ["Licuados", "Té caliente", "Té helado", "Jarra de té helado"] },
];

const idsDesayuno = {
  "Huevos al gusto": "huevos_al_gusto",
  Omelette: "omelette",
  Chilaquiles: "chilaquiles",
  Molletes: "molletes",
  Licuados: "licuados",
  "Té caliente": "te_caliente",
  "Té helado": "te_helado",
  "Jarra de té helado": "jarra_te_helado",
};
const iconos = ["🍳", "🍳", "🌶️", "🥖", "🥛", "🍵", "🧊", "🫖"];
const clave = (nombre) => nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "_");

const extrasPorDesayuno = {
  huevos_al_gusto: ["Jamón", "Salchicha", "Tocino", "Longaniza", "Champiñones", "Queso"],
  omelette: ["Jamón", "Salchicha", "Tocino", "Longaniza", "Champiñones", "Queso"],
  chilaquiles: ["Huevo", "Pollo", "Milanesa", "Bistec", "Longaniza", "Queso", "Crema"],
  molletes: ["Jamón", "Tocino", "Salchicha", "Longaniza", "Queso"],
};

export function configurarDesayuno(producto) {
  const opciones = extrasPorDesayuno[producto.id];
  if (!opciones) return producto;
  const existentes = producto.extras ?? [];
  const nuevos = opciones.filter((nombre) => !existentes.some((extra) =>
    String(extra.nombre ?? "").trim().toLowerCase() === nombre.toLowerCase()
  )).map((nombre) => ({ id: `desayuno_${clave(nombre)}`, nombre, precio: null }));
  const chilaquiles = RECETAS_DESAYUNO.Chilaquiles;
  return {
    ...producto,
    extras: [...existentes, ...nuevos],
    ...(producto.id === "chilaquiles" ? {
      incluyeUnaVez: chilaquiles.incluye,
      variantes: (producto.variantes ?? []).map((variante) => ({
        ...variante, descripcion: variante.descripcion === chilaquiles.incluye ? undefined : variante.descripcion,
      })),
    } : {}),
    ...(producto.id === "huevos_al_gusto" ? {
      elegirPreparacionHuevo: true,
      variantes: (producto.variantes ?? []).map((variante) => {
        const [grupo, ingrediente] = String(variante.nombre ?? "").split(" · ");
        const preparacion = /^(?:Revueltos|Estrellados)$/.test(grupo) ? grupo : "";
        return { ...variante, preparacionHuevo: preparacion, ingredienteHuevo: ingrediente ?? variante.nombre };
      }),
    } : {}),
  };
}

export function productosDesayuno() {
  return Object.entries(RECETAS_DESAYUNO).map(([nombre, receta], indice) => {
    const id = idsDesayuno[nombre];
    const variantes = Object.entries(receta.preparaciones).flatMap(([grupo, opciones]) =>
      opciones.map(({ nombre: opcion, detalle }) => ({
        id: clave(`${grupo}_${opcion}`),
        nombre: grupo === nombre || grupo === "Tamaño" ? opcion : `${grupo} · ${opcion}`,
        descripcion: detalle ?? receta.incluye,
        precioBase: null,
      })));
    return {
      id, nombre, icono: iconos[indice], turnos: ["desayunos"], etiquetaTarjeta: receta.soloSucursal ? "Solo en sucursal" : undefined,
      soloSucursal: Boolean(receta.soloSucursal),
      tipoMenu: ["licuados", "te_caliente", "te_helado", "jarra_te_helado"].includes(id) ? "bebidas" : "comida",
      variantes: variantes.length ? variantes : [{ id: "unico", nombre: receta.soloSucursal ? "Jarra" : "Único", precioBase: null }],
    };
  });
}
