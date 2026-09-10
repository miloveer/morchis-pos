import {
  PRECIO_ADEREZOS_PAPAS_APARTE,
  PRECIO_SALSA_APARTE,
} from "../config/precios";

export function calcularCargosAparte({
  salsasSeleccionadas = [],
  salsasAparte = false,
  removiblesPapasSeleccionados = [],
}) {
  const cargoSalsas = salsasAparte
    ? salsasSeleccionadas.length * PRECIO_SALSA_APARTE
    : 0;
  const aderezosPapasAparte =
    removiblesPapasSeleccionados.includes("Todo Aparte");
  const cargoPapas = aderezosPapasAparte
    ? PRECIO_ADEREZOS_PAPAS_APARTE
    : 0;

  return {
    cargoSalsas,
    cargoPapas,
    total: cargoSalsas + cargoPapas,
  };
}
