import { ESTILOS_PAN, EXTRAS_PAN, PRECIOS_PANES, QUESOS_CHEESE, RELLENOS_PAN, precioDefinido } from "../config/panes";

const orden = new Map(RELLENOS_PAN.map(({ id }, indice) => [id, indice]));
const aCentavos = (valor) => Math.round(valor * 100);

export function calcularPan(tipo, { rellenos = [], estiloId = "sencilla", quesoId = "", extras = {} } = {}, precios = PRECIOS_PANES[tipo]) {
  if (!precios || !Array.isArray(rellenos) || !extras || typeof extras !== "object") {
    return { estado: "invalido", mensaje: "Revisa la selección del pan." };
  }
  const elegidos = [...new Set(rellenos)];
  if (!elegidos.length) return { estado: "sin_rellenos", mensaje: "Elige un relleno principal." };
  if (rellenos.length !== 1) return { estado: "invalido", mensaje: "Elige un solo relleno principal y agrega el resto en Extras." };
  const estilo = ESTILOS_PAN.find(({ id }) => id === estiloId);
  if (!estilo || elegidos.some((id) => !orden.has(id)) || (estiloId === "tresQuesos" && elegidos.includes("tresQuesos"))) {
    return { estado: "invalido", mensaje: "Revisa el relleno y el estilo." };
  }

  const queso = estilo.eligeQueso ? QUESOS_CHEESE.find(({ id }) => id === quesoId) : undefined;
  if (estilo.eligeQueso && !queso) {
    return { estado: "sin_queso", mensaje: "Elige un tipo de queso para Cheese." };
  }

  // Cada relleno marcado aporta una porción. Los extras que también son
  // rellenos suman porciones al mismo conjunto, sin importar el bloque.
  const porciones = new Map(elegidos.map((id) => [id, 1]));
  for (const [id, cantidad] of Object.entries(extras)) {
    if (!EXTRAS_PAN.some((ingrediente) => ingrediente.id === id) ||
        !Number.isSafeInteger(cantidad) || cantidad < 0 || cantidad > 99) {
      return { estado: "invalido", mensaje: "Revisa las porciones extra." };
    }
    if (cantidad && estiloId === "tresQuesos" && id === "tresQuesos")
      return { estado: "invalido", mensaje: "Ya agregaste 3 quesos como extra." };
    if (cantidad) porciones.set(id, (porciones.get(id) ?? 0) + cantidad);
  }

  const baseElegida = elegidos[0];
  if (!precioDefinido(precios.base[baseElegida])) return {
    estado: "pendiente",
    faltantes: [`Base de ${RELLENOS_PAN.find(({ id }) => id === baseElegida).nombre}`],
  };

  // Un ingrediente con precio solo de extra no se vende como base en este platillo.
  // Si tiene precio de base, sí participa en la comparación, incluso al elegirse como extra.
  const candidatos = RELLENOS_PAN.filter(({ id }) =>
    porciones.has(id) && precioDefinido(precios.base[id]));
  const principal = [...candidatos].sort((a, b) =>
    aCentavos(precios.base[b.id]) - aCentavos(precios.base[a.id]) || orden.get(a.id) - orden.get(b.id),
  )[0];
  const cobros = EXTRAS_PAN.map((opcion) => ({
    ...opcion,
    cantidad: (porciones.get(opcion.id) ?? 0) - Number(opcion.id === principal.id),
    precio: precios.extra[opcion.id],
  })).filter(({ cantidad }) => cantidad > 0);
  const recargo = precios.estilo[estiloId];
  const faltantes = [
    ...(!precioDefinido(recargo) ? [`Estilo ${estilo.nombre}`] : []),
    ...cobros.filter(({ precio }) => !precioDefinido(precio)).map(({ nombre }) => `Extra de ${nombre}`),
  ];
  if (faltantes.length) return { estado: "pendiente", faltantes };

  const baseCentavos = aCentavos(precios.base[principal.id]);
  const estiloCentavos = aCentavos(recargo);
  const detalleExtras = cobros.map(({ nombre, cantidad, precio }) => ({
    nombre,
    cantidad,
    unitario: aCentavos(precio) / 100,
    importe: aCentavos(precio) * cantidad / 100,
  }));
  return {
    estado: "listo",
    pan: precios.nombre,
    base: { nombre: principal.nombre, importe: baseCentavos / 100 },
    estilo: { id: estilo.id, nombre: estilo.nombre, incluye: queso ? [`queso ${queso.nombre}`] : estilo.incluye, importe: estiloCentavos / 100 },
    extras: detalleExtras,
    total: (baseCentavos + estiloCentavos +
      cobros.reduce((suma, { precio, cantidad }) => suma + aCentavos(precio) * cantidad, 0)) / 100,
  };
}

export function tituloPan(detalle) {
  return `${detalle.pan} de ${detalle.base.nombre.toLocaleLowerCase("es-MX")}${
    detalle.estilo.id !== "sencilla" ? ` · Estilo ${detalle.estilo.nombre}` : ""}`;
}
