import { useEffect, useState } from "react";
import { doc, getDocFromServer, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DOCUMENTO_SERVICIO_DOMICILIO, domicilioActivo } from "../config/servicioDomicilio";

const referencia = () => doc(db, "catalogos", DOCUMENTO_SERVICIO_DOMICILIO);

export function guardarServicioDomicilio(activo) {
  return setDoc(referencia(), { activo }, { merge: true });
}

export async function verificarServicioDomicilio() {
  return domicilioActivo((await getDocFromServer(referencia())).data());
}

export default function useServicioDomicilio() {
  const [estado, setEstado] = useState({ activo: false, verificado: false, error: false });
  useEffect(() => onSnapshot(referencia(), { includeMetadataChanges: true }, (snapshot) => {
    setEstado({ activo: domicilioActivo(snapshot.data()), verificado: !snapshot.metadata.fromCache, error: false });
  }, () => setEstado({ activo: false, verificado: false, error: true })), []);
  return estado;
}
