import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { DOCUMENTO_PRECIOS } from "../config/preciosEditables";

const inicial = { precios: {}, cargando: true, error: "" };

function explicarError(codigo) {
  if (codigo === "permission-denied") return "Firebase rechazó la lectura. Revisa las reglas publicadas de Firestore para catalogos/precios_menu en el proyecto de MORCHIS.";
  if (codigo === "unavailable") return "Firebase no está disponible en este momento. Revisa la conexión e inténtalo de nuevo.";
  return codigo ? `Firebase devolvió «${codigo}». Intenta de nuevo.` : "No fue posible conectar con Firebase. Intenta de nuevo.";
}

export default function usePreciosMenu() {
  const [estado, setEstado] = useState(inicial);
  const [intento, setIntento] = useState(0);
  useEffect(() => onSnapshot(doc(db, "catalogos", DOCUMENTO_PRECIOS), (snapshot) => {
    setEstado({ precios: snapshot.data()?.precios ?? {}, cargando: false, error: "" });
  }, (error) => setEstado({ precios: {}, cargando: false, error: explicarError(error.code) })), [intento]);

  function reintentar() {
    setEstado(inicial);
    setIntento((actual) => actual + 1);
  }

  return { ...estado, reintentar };
}
