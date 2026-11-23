import {
  PRECIO_ADEREZOS_PAPAS_APARTE,
  PRECIO_SALSA_APARTE,
  PRECIO_SALSA_EXTRA,
} from "../config/precios";

export function calcularCargosAparte({
  salsasSeleccionadas = [],
  salsasAparte = false,
  salsasServidasAparte,
  salsaExtra = "",
  removiblesPapasSeleccionados = [],
}) {
  const cantidadAparte = salsasServidasAparte?.length ??
    (salsasAparte ? salsasSeleccionadas.length : 0);
  const cargoSalsas = cantidadAparte * PRECIO_SALSA_APARTE;
  const cargoSalsaExtra = salsaExtra ? PRECIO_SALSA_EXTRA : 0;
  const aderezosPapasAparte =
    removiblesPapasSeleccionados.includes("Todo Aparte");
  const cargoPapas = aderezosPapasAparte
    ? PRECIO_ADEREZOS_PAPAS_APARTE
    : 0;

  return {
    cargoSalsas,
    cargoPapas,
    cargoSalsaExtra,
    total: cargoSalsas + cargoPapas + cargoSalsaExtra,
  };
}
