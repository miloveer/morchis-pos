import { calcularCargosAparte } from "./calcularCargosAparte";
import {
  ADEREZOS_BANDERILLAS, INGREDIENTES_CLASICAS,
  calcularSazonador, opcionesProducto, opcionesSalsas, revisarServicioSalsas, tipoSalsa,
} from "../config/opcionesNoche";

export function revisarArticulo(item, producto, catalogos) {
  if (!producto) return "este producto ya no aparece en el menú";
  const combo = Array.isArray(producto.combos)
    ? producto.combos.find((opcion) => opcion.nombre === item.combo)
    : undefined;
  if ((producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length) && !item.removibles?.length)
    return "falta elegir cómo quieres el producto";
  if ((producto.esProductoPapas || combo?.incluyePapas || item.detallesPapas) && !item.detallesPapas?.sin?.length)
    return "falta elegir la preparación de las papas";

  const variante = producto.variantes?.find((opcion) =>
    item.varianteId
      ? opcion.id === item.varianteId
      : opcion.nombre === item.variante || item.variante?.startsWith(`${opcion.nombre} (`),
  ) ?? { nombre: item.variante };
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
    const cargos = calcularCargosAparte(item);
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
