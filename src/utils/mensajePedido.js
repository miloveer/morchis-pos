import { detalleSalsasPedido, listaSalsasAparte } from "../config/opcionesNoche";

const numeroMX = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const formatoPesos = (importe) => `$${numeroMX.format(importe)}`;

function texto(valor) {
  return String(valor ?? "").replace(/\s+/g, " ").trim();
}

function tituloArticulo(item) {
  const nombre = texto(item.nombreProducto);
  const nombresCortos = {
    burgers: "Burger",
    hamburguesas: "Hamburguesa",
    jochos: "Jocho",
  };
  const base = nombresCortos[nombre.toLowerCase()] ?? nombre;
  const variante = texto(item.variante).replace(/[()]/g, "");
  const nombreCompleto = variante && variante.toLowerCase() !== base.toLowerCase()
    ? `${base} ${variante}`
    : base;

  return `${nombreCompleto.toLocaleUpperCase("es-MX")}${item.cantidad > 1 ? ` ×${item.cantidad}` : ""}`;
}

function nota(lineas, valor, sangria = "  ") {
  if (texto(valor)) lineas.push(`${sangria}Nota: ${texto(valor)}`);
}

function detallesPapas(lineas, item) {
  const papas = item.detallesPapas;
  if (!papas) return;
  const esCombo = item.papasDeCombo ?? Boolean(item.combo && !/^solo\b/i.test(item.combo));
  if (esCombo) lineas.push("+ Papas francesas");
  const sangria = esCombo ? "  " : "";
  const preparacion = papas.sin?.filter((opcion) => opcion !== "Todo Aparte");

  if (preparacion?.length) lineas.push(`${sangria}- ${preparacion.join(", ")}`);
  if (texto(papas.sazonador)) lineas.push(`${sangria}Sazonador: ${texto(papas.sazonador)}`);
  if (item.cargosAparte?.cargoPapas > 0)
    lineas.push(`${sangria}- Queso, catsup y salsa aparte (+${formatoPesos(item.cargosAparte.cargoPapas)} por orden)`);
  nota(lineas, esCombo ? item.notaPapas : item.notaPapas || item.notas);
}

// El menú actual manda, incluso si el carrito guardó una selección anterior.
export function mostrarCarneEnPedido(item, menuData = []) {
  if (!texto(item.proteina)) return false;

  const producto = menuData.find((entrada) =>
    item.productoId
      ? entrada.id === item.productoId
      : entrada.nombre === item.nombreProducto,
  );
  if (!Array.isArray(producto?.opcionProteina)) return false;

  const disponibles = new Set(
    producto.opcionProteina
      .filter((opcion) => opcion && !opcion.agotada)
      .map((opcion) => texto(opcion.nombre).toLowerCase())
      .filter(Boolean),
  );
  return disponibles.size > 1 && disponibles.has(texto(item.proteina).toLowerCase());
}

function chileParaPedido(chile) {
  return /^jalapeños?$/i.test(texto(chile)) ? "Jalapeño" : texto(chile);
}

export function detallePanParaPedido(item) {
  const detalle = item.detallePan;
  const extras = detalle.extras.map(({ nombre, cantidad }) => `${nombre}${cantidad > 1 ? ` ×${cantidad} por pieza` : ""}`);
  const queso = detalle.estilo.id === "cheese"
    ? texto(detalle.estilo.incluye?.[0]).replace(/^queso\s+/i, "")
    : "";
  const estilo = [detalle.estilo.nombre, queso].filter(Boolean).join(" ");
  const titulo = [
    `${detalle.pan} de ${detalle.base.nombre.toLocaleLowerCase("es-MX")}${item.cantidad > 1 ? ` ×${item.cantidad}` : ""}`,
    ...extras,
  ].join(" + ") + (detalle.estilo.id !== "sencilla" ? ` · Estilo ${estilo}` : "");
  const preparacion = item.sinIngredientes?.length ? `Sin ${item.sinIngredientes.join(", ")}` : "Con todo";
  const lineas = [[preparacion, chileParaPedido(item.chile)].filter(Boolean).join(", ")];
  nota(lineas, item.notas, "");
  return { titulo, lineas, importe: `${formatoPesos(detalle.total * item.cantidad)} MXN` };
}

function ficha(item, menuData) {
  if (item.detallePan) {
    const { titulo, lineas, importe } = detallePanParaPedido(item);
    return [`*${titulo}*`, ...lineas, `Total: ${importe}`].join("\n");
  }
  const lineas = [`*${tituloArticulo(item)}*`];
  const papasSolas = item.detallesPapas &&
    !(item.papasDeCombo ?? Boolean(item.combo && !/^solo\b/i.test(item.combo)));
  if (mostrarCarneEnPedido(item, menuData)) lineas.push(`- Carne: ${item.proteina}`);
  const preparacion = [...(item.removibles ?? []), chileParaPedido(item.chile)].filter(Boolean);
  if (preparacion.length) lineas.push(`- ${preparacion.join(", ")}`);
  const seleccion = item.opcionObligatoria || item.saborFrappe;
  if (seleccion) lineas.push(`- ${item.tituloOpcion || (item.saborFrappe ? "Sabor" : "Selección")}: ${seleccion}`);
  if (item.salsas?.length) {
    const cargo = item.cargosAparte?.cargoSalsas;
    const extra = listaSalsasAparte(item).length > 0 && cargo > 0 ? ` · +${formatoPesos(cargo)} por orden` : "";
    lineas.push(`- Salsas: ${detalleSalsasPedido(item, { marcarAparte: true })}${extra}`);
  }
  if (item.sazonadorExtra) lineas.push(`- Sazonador: ${item.sazonadorExtra}${item.cargoSazonador ? ` (+${formatoPesos(item.cargoSazonador)} por orden)` : ""}`);
  if (item.aderezosBanderillas?.length) lineas.push(`- Aderezos: ${item.aderezosBanderillas.join(", ")}`);
  if (item.salsaExtra) {
    const extra = item.cargosAparte?.cargoSalsaExtra;
    lineas.push(`- Salsa extra: ${item.salsaExtra} (aparte)${extra > 0 ? ` · +${formatoPesos(extra)} por orden` : ""}`);
  }
  const aparte = listaSalsasAparte(item);
  if (item.modoMezclaSalsa && item.salsas?.filter((nombre) => !aparte.includes(nombre)).length === 2)
    lineas.push(`- Servir salsas: ${item.modoMezclaSalsa}`);
  if (item.extras?.length) lineas.push(`- Extras: ${item.extras.map((extra) => extra.nombre).join(", ")}`);
  if (!papasSolas) nota(lineas, item.notas);
  detallesPapas(lineas, item);
  if (item.saborSoda) {
    lineas.push(`+ Soda italiana: ${item.saborSoda}`);
    nota(lineas, item.notaSoda);
  }
  return lineas.join("\n");
}

export function armarMensajePedido({
  carrito, menuData, nombreCliente, tipoEntrega, direccion, metodoPago, billete, totalPagar,
}) {
  const entrega = {
    recoger: "Para llevar",
    sucursal: "Comer en sucursal",
    domicilio: "A domicilio",
  }[tipoEntrega];
  const encabezado = [
    "*NUEVO PEDIDO MORCHIS*",
    `Cliente: ${texto(nombreCliente)} · ${entrega}`,
  ];
  if (tipoEntrega === "domicilio") encabezado.push(`Dirección: ${texto(direccion)}`);
  if (metodoPago === "transferencia") {
    encabezado.push("Pago: Transferencia");
  } else if (billete && Number(billete) > totalPagar) {
    encabezado.push(`Pago: Efectivo · Paga con ${formatoPesos(Number(billete))} · Cambio: ${formatoPesos(Number(billete) - totalPagar)}`);
  } else {
    encabezado.push("Pago: Efectivo · Pago exacto");
  }

  return [
    encabezado.join("\n"),
    ...carrito.map((item) => ficha(item, menuData)),
    `*TOTAL A PAGAR: ${formatoPesos(totalPagar)} MXN*`,
    "¿Me confirman cuando mi pedido esté listo? Gracias.",
  ].join("\n\n");
}
