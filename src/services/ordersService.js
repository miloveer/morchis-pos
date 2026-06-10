import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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