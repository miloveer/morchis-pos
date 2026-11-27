import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../src/firebase";
import { cantidadPlaneada, MAX_CANTIDAD_COMPRA, MAX_FOTO } from "./lista";

const coleccion = () => collection(db, "inventario", "operacion", "insumos");
const inicial = { items: null, error: "" };

export const coloresInventario = {
  rojo: "#dc2626", morado: "#7c3aed", rosa: "#db2777", amarillo: "#c38b00", gris: "#64748b",
};

export function useInventario() {
  const [estado, setEstado] = useState(inicial);
  useEffect(() => onSnapshot(coleccion(), (snap) => {
    const items = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
    items.sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es-MX"));
    setEstado({ items, error: "" });
  }, () => setEstado({ items: null, error: "No se pudo cargar el inventario. Revisa la conexión y los permisos de Firestore." })), []);
  return estado;
}

function autor(perfil) {
  return {
    registradoPor: perfil.uid,
    registradoNombre: perfil.nombre || "Personal",
    registradoColor: Object.hasOwn(coloresInventario, perfil.colorInventario) ? perfil.colorInventario : "gris",
    registradoEn: serverTimestamp(),
  };
}

export function guardarInventario(perfil, datos, anterior = null, id = null) {
  const ref = id || anterior ? doc(coleccion(), id || anterior.id) : doc(coleccion());
  const info = {
    nombre: datos.nombre.trim(), tienda: datos.tienda.trim() || "Sin tienda",
    presentacion: datos.presentacion.trim(), stock: Number(datos.stock), minimo: Number(datos.minimo),
  };
  if (datos.foto && (!datos.foto.startsWith("data:image/jpeg;base64,") || datos.foto.length > MAX_FOTO)) {
    throw new Error("La foto no tiene un formato válido.");
  }
  if (!info.nombre || !info.presentacion || ![info.stock, info.minimo].every((n) => Number.isFinite(n) && n >= 0 && n <= 1e6)) {
    throw new Error("Revisa el nombre, la presentación y las cantidades.");
  }
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (anterior === null && snap.exists()) throw new Error("Este insumo ya está en el inventario.");
    const actual = snap.data();
    if (anterior && (!actual || ["nombre", "tienda", "presentacion", "stock", "minimo", "foto"].some((k) => actual[k] !== anterior[k]) ||
      !actual.registradoEn?.isEqual(anterior.registradoEn))) {
      throw new Error("El equipo actualizó este insumo. Ciérralo y vuelve a abrirlo para ver el registro nuevo.");
    }
    const cambiaUnidad = actual && actual.presentacion !== info.presentacion;
    const cambiaConteo = actual && (actual.stock !== info.stock || actual.minimo !== info.minimo);
    const reiniciar = cambiaUnidad || (cambiaConteo && actual.comprado);
    const conservarPlan = !reiniciar && actual?.cantidadCompra != null;
    tx.set(ref, {
      ...info, ...autor(perfil), comprado: reiniciar ? false : (actual?.comprado ?? false),
      ...(conservarPlan ? { cantidadCompra: actual.cantidadCompra } : {}),
      ...(datos.foto ? { foto: datos.foto } : {}),
    });
  });
}

export function actualizarCompra(item, comprado) {
  const ref = doc(coleccion(), item.id);
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const actual = snap.data();
    if (!actual || !actual.registradoEn?.isEqual(item.registradoEn)
      || actual.cantidadCompra !== item.cantidadCompra || cantidadPlaneada(actual) <= 0) {
      throw new Error("La cantidad de compra cambió. Revisa la lista e inténtalo de nuevo.");
    }
    tx.update(ref, { comprado });
  });
}

export function guardarCantidadCompra(item, cantidad) {
  if (typeof cantidad !== "number" || !Number.isFinite(cantidad) || cantidad < 0 || cantidad > MAX_CANTIDAD_COMPRA) {
    throw new Error("Escribe una cantidad válida. Usa 0 para quitar el insumo de la lista.");
  }
  const ref = doc(coleccion(), item.id);
  return runTransaction(db, async (tx) => {
    const actual = (await tx.get(ref)).data();
    if (!actual || !actual.registradoEn?.isEqual(item.registradoEn)
      || actual.cantidadCompra !== item.cantidadCompra || actual.comprado !== item.comprado) {
      throw new Error("El registro cambió. Revisa la cantidad actual y vuelve a guardar.");
    }
    tx.update(ref, { cantidadCompra: cantidad, comprado: false });
  });
}

export async function publicarInsumo(perfil, i) {
  await guardarInventario(perfil, {
    nombre: i.n, tienda: i.c, presentacion: i.u, stock: i.s, minimo: i.m,
  }, null, i.id);
}
