import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const ORDERS_COLLECTION = "orders";

export async function guardarPedido(pedido) {
  const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
    ...pedido,
    estado: "nuevo",
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });

  return docRef.id;
}

export function escucharPedidos(callback, onError) {
  const pedidosQuery = query(
    collection(db, ORDERS_COLLECTION),
    orderBy("creadoEn", "desc")
  );

  return onSnapshot(
    pedidosQuery,
    (snapshot) => {
      const pedidos = snapshot.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      }));

      callback(pedidos);
    },
    (error) => {
      console.error("Error al escuchar pedidos:", error);
      if (onError) onError(error);
    }
  );
}

export async function actualizarEstadoPedido(pedidoId, nuevoEstado) {
  const pedidoRef = doc(db, ORDERS_COLLECTION, pedidoId);

  await updateDoc(pedidoRef, {
    estado: nuevoEstado,
    actualizadoEn: serverTimestamp(),
  });
}