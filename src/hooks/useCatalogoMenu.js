import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { CATALOGOS_PREDETERMINADOS } from "../config/catalogos";

export default function useCatalogoMenu(turnoMenu) {
  const [menuData, setMenuData] = useState([]);
  const [catalogos, setCatalogos] = useState(CATALOGOS_PREDETERMINADOS);
  const [cargandoMenu, setCargandoMenu] = useState(true);
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "menu"), (snapshot) => {
      const menuDesdeLaNube = [];
      snapshot.forEach((doc) => {
        menuDesdeLaNube.push({ id: doc.id, ...doc.data() });
      });
      setMenuData(menuDesdeLaNube);
      setCargandoMenu(false);
    });
    return () => unsubscribe();
  }, []);
  useEffect(() => {
    return onSnapshot(collection(db, "catalogos"), (snapshot) => {
      const remotos = {};
      snapshot.docs.forEach((item) => {
        remotos[item.id] = item.data().opciones || [];
      });
      setCatalogos({ ...CATALOGOS_PREDETERMINADOS, ...remotos });
    });
  }, []);

  const menuVisible = menuData.filter((producto) => {
    const turnos = Array.isArray(producto.turnos)
      ? producto.turnos
      : ["noche"];
    return turnos.includes(turnoMenu);
  });

  return { menuData, menuVisible, catalogos, cargandoMenu };
}
