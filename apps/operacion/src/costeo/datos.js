import { useEffect, useState } from "react";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../src/firebase";
import { fusionarRespaldo, normalizarRespaldo, VACIO } from "./modelo";

const ref = () => doc(db, "costos", "recetario");
const inicial = { data: null, existe: false, error: "" };

export function useCosteo() {
  const [estado, setEstado] = useState(inicial);
  useEffect(() => onSnapshot(ref(), { includeMetadataChanges: true }, (snap) => {
    if (snap.metadata.hasPendingWrites) return;
    try {
      const data = snap.exists() ? normalizarRespaldo(snap.data().data) : VACIO;
      setEstado({ data, existe: snap.exists(), error: "", desdeCache: snap.metadata.fromCache });
    } catch {
      setEstado({ ...inicial, error: "El recetario guardado tiene un formato incompatible." });
    }
  }, () => setEstado({ ...inicial, error: "No se pudo abrir el costeo. Revisa la conexión y el acceso de socio." })), []);
  return estado;
}

function escribir(tx, documento, data) {
  if (new TextEncoder().encode(JSON.stringify(data)).length > 500_000) {
    throw new Error("El recetario llegó al límite de guardado de esta versión.");
  }
  tx.set(documento, { data, actualizado: serverTimestamp() });
}

function guardar(transformar) {
  const documento = ref();
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(documento);
    const actual = snap.exists() ? normalizarRespaldo(snap.data().data) : VACIO;
    const data = normalizarRespaldo(transformar(actual));
    escribir(tx, documento, data);
  });
}

export function importarCosteo(respaldo) {
  return runTransaction(db, async (tx) => {
    const documento = ref();
    const snap = await tx.get(documento);
    const actual = snap.exists() ? normalizarRespaldo(snap.data().data) : VACIO;
    const { datos, agregados, conservados, horario } = fusionarRespaldo(actual, respaldo);
    if (agregados || horario) escribir(tx, documento, datos);
    return { agregados, conservados, horario };
  });
}

export function crearRecetasManana(recetas) {
  return guardar((actual) => {
    const nombres = new Set(actual.recs.filter((r) => !r.sub && r.sh === "am")
      .map((r) => r.n.toLocaleLowerCase("es-MX")));
    const nuevas = recetas.filter((r) => !nombres.has(r.n.toLocaleLowerCase("es-MX")));
    return { ...actual, recs: [...actual.recs, ...nuevas] };
  });
}

export function guardarCosteo(grupo, anterior, nuevo) {
  return guardar((actual) => {
    const valor = grupo === "fixed" ? actual.fixed : (actual[grupo].find((x) => x.id === (anterior ?? nuevo).id) ?? null);
    if (JSON.stringify(valor) !== JSON.stringify(anterior)) {
      throw new Error("Alguien actualizó este registro. Cierra la edición y vuelve a abrirlo para ver los cambios.");
    }
    if (grupo === "fixed") return { ...actual, fixed: nuevo };
    if (!nuevo && (grupo === "ings" || grupo === "recs")) {
      const usado = actual.recs.some((r) => r.lines.some((l) => l.id === anterior.id && l.k === (grupo === "ings" ? "i" : "r"))) ||
        (grupo === "recs" && actual.combos.some((c) => c.items.some((l) => l.id === anterior.id)));
      if (usado) throw new Error("Este registro está en una receta o combo. Quita la referencia antes de borrarlo.");
    }
    const grupoNuevo = anterior
      ? actual[grupo].flatMap((x) => x.id === anterior.id ? (nuevo ? [nuevo] : []) : [x])
      : [...actual[grupo], nuevo];
    return { ...actual, [grupo]: grupoNuevo };
  });
}
