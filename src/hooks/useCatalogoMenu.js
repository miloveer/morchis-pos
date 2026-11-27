import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { CATALOGOS_PREDETERMINADOS } from "../config/catalogos";
import { DOCUMENTO_DISPONIBILIDAD } from "../config/disponibilidadMenu";

export default function useCatalogoMenu() {
  const [menuData, setMenuData] = useState([]);
  const [estadosDisponibilidad, setEstadosDisponibilidad] = useState({});
  const [catalogos, setCatalogos] = useState(CATALOGOS_PREDETERMINADOS);
  const [cargandoMenu, setCargandoMenu] = useState(true);
  const [errorMenu, setErrorMenu] = useState(false);
  const [errorCatalogos, setErrorCatalogos] = useState(false);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [intento, setIntento] = useState(0);

  useEffect(() => onSnapshot(collection(db, "menu"), (snapshot) => {
    setMenuData(snapshot.docs.map((documento) => ({ ...documento.data(), id: documento.id })));
    setErrorMenu(false);
    setCargandoMenu(false);
  }, () => {
    setErrorMenu(true);
    setCargandoMenu(false);
  }), [intento]);

  useEffect(() => onSnapshot(collection(db, "catalogos"), (snapshot) => {
    const remotos = {};
    let estados = {};
    snapshot.docs.forEach((item) => {
      const datos = item.data();
      if (item.id === DOCUMENTO_DISPONIBILIDAD) estados = datos.estados ?? {};
      const opciones = datos.opciones;
      if (Array.isArray(opciones)) remotos[item.id] = opciones;
    });
    setEstadosDisponibilidad(estados);
    setCatalogos({ ...CATALOGOS_PREDETERMINADOS, ...remotos });
    setErrorCatalogos(false);
    setCargandoCatalogos(false);
  }, () => {
    setErrorCatalogos(true);
    setCargandoCatalogos(false);
  }), [intento]);

  function reintentarMenu() {
    setCargandoMenu(true);
    setCargandoCatalogos(true);
    setIntento((valor) => valor + 1);
  }

  return { menuData, catalogos, estadosDisponibilidad, cargandoMenu: cargandoMenu || cargandoCatalogos, errorMenu, errorCatalogos, reintentarMenu };
}
