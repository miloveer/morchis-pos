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

function ficha(item, menuData) {
  const lineas = [`*${tituloArticulo(item)}*`];
  const papasSolas = item.detallesPapas &&
    !(item.papasDeCombo ?? Boolean(item.combo && !/^solo\b/i.test(item.combo)));
  if (mostrarCarneEnPedido(item, menuData)) lineas.push(`- Carne: ${item.proteina}`);
  if (item.removibles?.length) lineas.push(`- ${item.removibles.join(", ")}`);
  const seleccion = item.opcionObligatoria || item.saborFrappe;
  if (seleccion) lineas.push(`- ${item.tituloOpcion || (item.saborFrappe ? "Sabor" : "Selección")}: ${seleccion}`);
  if (item.salsas?.length) lineas.push(`- Salsas: ${item.salsas.join(", ")}`);
  if (item.salsasAparte && item.cargosAparte?.cargoSalsas > 0)
    lineas.push(`- Salsas aparte: +${formatoPesos(item.cargosAparte.cargoSalsas)} por orden`);
  if (item.modoMezclaSalsa && item.salsas?.length > 1)
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
