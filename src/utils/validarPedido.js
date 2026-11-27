import { quesosAdicionalesSync } from "../config/variantesMenu";
import { CHILES_A_ELEGIR, INGREDIENTES_PAN } from "../config/ingredientesMenu";
import { calcularPan } from "./calcularPan";
import { calcularCargosAparte } from "./calcularCargosAparte";
import {
  ADEREZOS_BANDERILLAS, INGREDIENTES_CLASICAS,
  calcularSazonador, opcionesProducto, opcionesSalsas, revisarServicioSalsas, tipoSalsa,
} from "../config/opcionesNoche";

export function revisarArticulo(item, producto, catalogos, tipoEntrega) {
  if (!Number.isSafeInteger(item.cantidad) || item.cantidad < 1 || !Number.isFinite(item.totalItem)) return "revisa la cantidad y el precio";
  if (!producto) return "este producto ya no aparece en el menú";
  if (producto.agotado) return "este producto está agotado";
  if (producto.soloSucursal && tipoEntrega !== "sucursal") return "solo disponible para comer en sucursal";
  if (item.proteina && !producto.opcionProteina?.some((opcion) =>
    opcion.nombre === item.proteina && !opcion.agotada && !opcion.agotado)) return "esa proteína ya no está disponible";
  if (producto.opcionesChile && !producto.opcionesChile.includes(item.chile)) return "elige el chile del producto";
  if (item.panPersonalizado) {
    if (!CHILES_A_ELEGIR.includes(item.chile)) return "elige el chile del producto";
    const { tipo } = item.panPersonalizado;
    if (producto.tipoPan !== tipo) return "esta presentación ya no está disponible";
    const cotizacion = calcularPan(tipo, item.panPersonalizado, producto.preciosPan);
    if (cotizacion.estado === "sin_queso") return "falta elegir el queso de Cheese";
    if (cotizacion.estado === "pendiente") return `falta el precio de: ${cotizacion.faltantes.join(", ")}`;
    if (cotizacion.estado !== "listo") return "edita el platillo y elige un solo relleno principal";
    if (item.sinIngredientes != null && (!Array.isArray(item.sinIngredientes) ||
        item.sinIngredientes.some((ingrediente) => !INGREDIENTES_PAN.includes(ingrediente)))) {
      return "revisa los ingredientes que quieres quitar";
    }
    if (cotizacion.total !== item.totalItem || JSON.stringify(cotizacion) !== JSON.stringify(item.detallePan)) {
      return "cambió el precio o la preparación; edita el producto para actualizarlo";
    }
    return "";
  }
  if (producto.tipoPan) return "vuelve a armar este producto con las nuevas opciones";
  const combo = Array.isArray(producto.combos)
    ? producto.combos.find((opcion) => opcion.nombre === item.combo)
    : undefined;
  if (item.combo && (!combo || combo.agotado || combo.agotada)) return "el combo ya no está disponible";
  if ((producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length) && !item.removibles?.length)
    return "falta elegir cómo quieres el producto";
  if ((producto.esProductoPapas || combo?.incluyePapas || item.detallesPapas) && !item.detallesPapas?.sin?.length)
    return "falta elegir la preparación de las papas";

  const encontrada = producto.variantes?.find((opcion) =>
    item.varianteId
      ? opcion.id === item.varianteId
      : opcion.nombre === item.variante || item.variante?.startsWith(`${opcion.nombre} (`),
  );
  if (!encontrada || !Number.isFinite(encontrada.precioBase) || encontrada.agotada) return "esta opción ya no está disponible";
  const variante = encontrada;
  if (variante.opcionesQuesoBase && (
    !variante.opcionesQuesoBase.includes(item.quesoBase) ||
    (variante.dosQuesos && !quesosAdicionalesSync(item.quesoBase).includes(item.quesoAdicional))
  )) return "revisa los quesos de la sincronizada";
  if (variante.opcionesQueso && !variante.opcionesQueso.includes(item.quesoVariante))
    return "falta elegir el queso";

  const extras = (item.extras ?? []).map((extra) => producto.extras?.find(({ id, nombre }) =>
    extra.id ? extra.id === id : extra.nombre === nombre));
  if (extras.some((extra) => !extra || extra.agotada || extra.agotado || !Number.isFinite(extra.precio)))
    return "un extra ya no está disponible";
  const cargos = calcularCargosAparte({ ...item, removiblesPapasSeleccionados: item.detallesPapas?.sin ?? [] });
  const reglasSazonador = opcionesSalsas(producto, variante, catalogos);
  const total = variante.precioBase + (combo?.precioExtra ?? 0) +
    extras.reduce((suma, extra) => suma + extra.precio, 0) + cargos.total +
    calcularSazonador(reglasSazonador, item.sazonadorExtra, item.salsas ?? []);
  if (Math.round(total * 100) !== Math.round(item.totalItem * 100)) return "cambió el precio; vuelve a agregar el producto";
  const opcion = opcionesProducto(producto, variante, catalogos);
  const seleccion = item.opcionObligatoria || item.saborFrappe;
  if (opcion && !opcion.opciones.includes(seleccion))
    return "falta una opción válida de sabor o preparación";
  if (combo?.incluyeSoda && !catalogos.sodas.includes(item.saborSoda))
    return "falta elegir el sabor de la soda del combo";

  const reglas = opcionesSalsas(producto, variante, catalogos);
  const salsas = item.salsas ?? [];
  if ((reglas.obligatoria && !salsas.length) || salsas.length > reglas.maximo ||
      salsas.some((salsa) => !reglas.opciones.includes(salsa)))
    return "elige las salsas de nuevo";
  const errorServicio = revisarServicioSalsas(reglas, item);
  if (errorServicio) return errorServicio;
  if (item.salsasServidasAparte || item.salsaExtra) {
    if ((item.cargosAparte?.cargoSalsas ?? 0) !== cargos.cargoSalsas ||
        (item.cargosAparte?.cargoSalsaExtra ?? 0) !== cargos.cargoSalsaExtra) {
      return "el precio del servicio de salsas cambió";
    }
  }
  if (item.sinClasicas?.length && (
    !salsas.some((salsa) => tipoSalsa(salsa) === "clasicas") ||
    item.sinClasicas.some((ingrediente) => !INGREDIENTES_CLASICAS.includes(ingrediente))
  )) return "revisa la preparación de Clásicas";
  if (item.sazonadorExtra && (
    !reglas.permiteSazonador || !reglas.sazonadores.includes(item.sazonadorExtra) ||
    item.cargoSazonador !== calcularSazonador(reglas, item.sazonadorExtra, salsas)
  )) return "revisa el sazonador";
  if (item.aderezosBanderillas?.length && (
    !reglas.banderillas || item.aderezosBanderillas.some((aderezo) => !ADEREZOS_BANDERILLAS.includes(aderezo))
  )) return "revisa los aderezos";
  return "";
}

export function preparacionBloqueada(opcion, seleccion) {
  // La opción marcada siempre se puede desmarcar.
  if (seleccion.includes(opcion)) return false;
  const esParaQuitar = (texto) => /^sin\s/i.test(texto.trim());
  return seleccion.length > 0 &&
    (!esParaQuitar(opcion) || seleccion.some((valor) => !esParaQuitar(valor)));
}
