import { useState, useEffect } from "react";
import {
          removiblesGlobales,
          sazonadoresPapas,
          removiblesPapas,
} from "./data/menu";
import {
  PRECIO_ADEREZOS_PAPAS_APARTE,
  PRECIO_SALSA_APARTE,
} from "./config/precios";
import { calcularCargosAparte } from "./utils/calcularCargosAparte";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import {
  CATALOGOS_PREDETERMINADOS,
  catalogoDeProducto,
} from "./config/catalogos";
// ==========================================
// CONFIGURACIÓN DE NEGOCIO
// ==========================================
const TELEFONO_MORCHIS = "5641375355";
const COSTO_ENVIO_DOMICILIO = 10;
const DESAYUNOS_HABILITADOS = false; // Cambiar a true si se habilitan los desayunos
const TURNOS = {
  desayunos: {
    nombre: "Desayunos",
    horario: "Lun a vie · 7:00 a. m. a 12:00 p. m.",
    dias: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    apertura: 7,
    cierre: 12,
  },
  noche: {
    nombre: "Noche",
    horario: "Jue a dom · 4:00 p. m. a 11:00 p. m.",
    dias: ["Thu", "Fri", "Sat", "Sun"],
    apertura: 16,
    cierre: 23,
  },
};
function turnoAbierto(turno, fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const dia = partes.find((parte) => parte.type === "weekday").value;
  const hora = Number(partes.find((parte) => parte.type === "hour").value);
  const { dias, apertura, cierre } = TURNOS[turno];
  return dias.includes(dia) && hora >= apertura && hora < cierre;
}
function ImageWithSkeleton({ src, alt }) {
  const [cargado, setCargado] = useState(false);
  return (
    <div className="relative w-full h-full bg-gray-200">
      {!cargado && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${cargado ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setCargado(true)}
      />
    </div>
  );
}
export default function App() {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  // Estado del menú público
  const [menuData, setMenuData] = useState([]);
  const [turnoMenu, setTurnoMenu] = useState(() =>
  DESAYUNOS_HABILITADOS && turnoAbierto("desayunos")
    ? "desayunos"
    : "noche"
);
  const [catalogos, setCatalogos] = useState(CATALOGOS_PREDETERMINADOS);
  const [cargandoMenu, setCargandoMenu] = useState(true);
  useEffect(() => {
    // onSnapshot se queda "escuchando" cambios 24/7
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
  // Estados del Carrito y Cliente
  const [carrito, setCarrito] = useState(() => {
    const guardado = localStorage.getItem("morchis_carrito");
    return guardado ? JSON.parse(guardado) : [];
  });
  const [nombreCliente, setNombreCliente] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("recoger"); // 'recoger' | 'domicilio' | 'sucursal'
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [billete, setBillete] = useState("");
  // Lógica de Horarios
  const estaAbierto = turnoAbierto(turnoMenu);
const estadoLocal = estaAbierto ? "ABIERTO" : "CERRADO";
const colorEstado = estaAbierto
  ? "bg-green-100 text-green-900"
  : "bg-red-100 text-red-900";
const menuVisible = menuData.filter((producto) => {
  const turnos = Array.isArray(producto.turnos)
    ? producto.turnos
    : ["noche"];
  return turnos.includes(turnoMenu);
});
  const mostrarToast = (mensaje) => {
    setToastMsg(mensaje);
    setTimeout(() => setToastMsg(""), 3000);
  };
  const agregarAlCarrito = (nuevoItem) => {
    setCarrito([...carrito, { ...nuevoItem, idUnico: Date.now() }]);
    mostrarToast(`${nuevoItem.cantidad}x ${nuevoItem.nombreProducto} agregado`);
  };
  const quitarDelCarrito = (idUnico) => {
    const nuevoCarrito = carrito.filter((item) => item.idUnico !== idUnico);
    setCarrito(nuevoCarrito);
    if (nuevoCarrito.length === 0) setMostrarCarrito(false);
  };
  // Cálculos
  const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalProductos = carrito.reduce(
    (sum, item) => sum + item.totalItem * item.cantidad,
    0,
  );
  const costoEnvioReal =
    tipoEntrega === "domicilio" ? COSTO_ENVIO_DOMICILIO : 0;
  const totalPagar = totalProductos + costoEnvioReal;
  // ========================================================
  // CONTROL DE CARGA DEL MENÚ PÚBLICO
  // ========================================================
  // 1. Mostrar pantalla de carga
  if (cargandoMenu) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#ffd200] mb-4"></div>
        <p className="font-black text-gray-900 tracking-widest uppercase text-center px-4">
          Cargando el menú de Morchis...
        </p>
      </div>
    );
  }
  // ========================================================
  // VISTA PRINCIPAL DE LA APP (Cliente)
  // ========================================================
  const enviarAWhatsApp = () => {
    if (!turnoAbierto(turnoMenu)) {
  return alert(`El menú de ${TURNOS[turnoMenu].nombre} está cerrado.`);
}
    if (!nombreCliente.trim()) return alert("Por favor, ingresa tu nombre.");
    if (tipoEntrega === "domicilio" && !direccion.trim())
      return alert("Ingresa tu dirección de entrega.");
    for (const item of carrito) {
  const producto = menuData.find((entrada) =>
    item.productoId
      ? entrada.id === item.productoId
      : entrada.nombre === item.nombreProducto
  );
  const error = revisarArticulo(item, producto, catalogos);
  if (error) {
    return alert(
      `${item.nombreProducto}: ${error}. Quita este artículo y agrégalo de nuevo.`
    );
  }
}
      let mensaje = "*NUEVO PEDIDO MORCHIS*\n\n";
    mensaje += `*CLIENTE:* ${nombreCliente.trim()}\n`;
    if (tipoEntrega === "domicilio") {
      mensaje += `*ENTREGA:* A domicilio\n`;
      mensaje += `*DIRECCIÓN:* ${direccion.trim()}\n`;
    } else if (tipoEntrega === "sucursal") {
      mensaje += `*ENTREGA:* Comer en Sucursal\n`;
    } else {
      mensaje += `*ENTREGA:* Paso a recoger\n`;
    }
    mensaje += `*PAGO:* ${metodoPago === "efectivo" ? "Efectivo" : "Transferencia"}\n`;
    if (metodoPago === "efectivo")
      mensaje += `*BILLETE:* $${billete || "Exacto"}\n\n`;
    mensaje += `*--- MI ORDEN ---*\n\n`;
    carrito.forEach((item, index) => {
  mensaje += `${index + 1}. *${item.cantidad}x ${item.nombreProducto} (${item.variante})*\n`;
  if (item.proteina) mensaje += `• Carne: ${item.proteina}\n`;
  if (item.removibles?.length)
    mensaje += `• Preparación: ${item.removibles.join(", ")}\n`;
  if (item.extras?.length)
    mensaje += `• Extras del producto: ${item.extras.map((extra) => extra.nombre).join(", ")}\n`;
  const seleccion = item.opcionObligatoria || item.saborFrappe;
  if (seleccion)
    mensaje += `• ${item.tituloOpcion || (item.saborFrappe ? "Sabor" : "Selección")}: ${seleccion}\n`;
  if (item.salsas?.length)
    mensaje += `• Salsas: ${item.salsas.join(", ")}\n`;
  if (item.salsasAparte && item.cargosAparte?.cargoSalsas > 0)
    mensaje += `• Salsas aparte: +$${item.cargosAparte.cargoSalsas} por orden\n`;
  if (item.modoMezclaSalsa && item.salsas?.length > 1)
    mensaje += `• Servir salsas: ${item.modoMezclaSalsa}\n`;
  if (item.notas) mensaje += `• Notas del producto: ${item.notas}\n`;
  const tieneCombo = item.combo && !item.combo.includes("Solo");
  if (tieneCombo) mensaje += `• Combo: ${item.combo}\n`;
  if (item.saborSoda) mensaje += `• Soda del combo: ${item.saborSoda}\n`;
  if (item.detallesPapas) {
    const etiqueta = tieneCombo ? "Papas del combo" : "Papas";
    const indicaciones = (item.detallesPapas.sin || [])
      .filter((opcion) => opcion !== "Todo Aparte");
    const detalles = [item.detallesPapas.sazonador, ...indicaciones].filter(Boolean);
    if (detalles.length) mensaje += `• ${etiqueta}: ${detalles.join(" · ")}\n`;
    if (item.cargosAparte?.cargoPapas > 0)
      mensaje += `• Aderezos de las papas aparte: +$${item.cargosAparte.cargoPapas} por orden\n`;
  }
  mensaje += `• Subtotal: $${item.totalItem * item.cantidad}\n\n`;
});
    mensaje += `*TOTAL A PAGAR: $${totalPagar}*\n\n`;
    mensaje += "¿Me confirman cuando mi pedido esté listo? Gracias.";
    localStorage.removeItem("morchis_carrito");
    setCarrito([]);
    const url = `https://wa.me/${TELEFONO_MORCHIS}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };
  return (
    <div className="morchis-menu min-h-screen pb-28" data-turno={turnoMenu}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&display=swap" precedence="morchis-fonts" />
      <style>{`
        .morchis-menu {
          --menu-acento: #ffd200;
          --heading: "Barlow", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          background: linear-gradient(#f5f5f7, #bfbfbf);
          color: #1c1c1e;
          color-scheme: light;
          font-family: var(--heading);
        }
        .morchis-menu .morchis-encabezado,
        .morchis-menu .morchis-pestana-activa,
        .morchis-menu .morchis-accion {
          background: var(--menu-acento);
          color: #161616;
        }
        .morchis-menu .morchis-accion { border-radius: 18px; }
        .morchis-menu .morchis-accion:hover { filter: brightness(.96); }
        .morchis-menu .morchis-tinte,
        .morchis-menu .morchis-elegido { background: #fff6cb; }
        .morchis-menu .morchis-borde,
        .morchis-menu .morchis-elegido { border-color: #b99727; }
        .morchis-menu .morchis-dorado { color: #624e0b; }
        .morchis-menu .morchis-elegido { color: #1c1c1e; }
        .morchis-menu .morchis-check { accent-color: #7b620f; }
        .morchis-menu .morchis-carrito { background: #f2f2f7; }
        .morchis-menu .morchis-vidrio {
          background: rgb(255 255 255 / 94%);
          -webkit-backdrop-filter: blur(18px);
          backdrop-filter: blur(18px);
        }
        .morchis-menu .morchis-area-inferior {
          padding-bottom: max(1rem, env(safe-area-inset-bottom));
        }
        .morchis-menu .morchis-hoja {
          border-radius: 28px 28px 0 0;
          box-shadow: 0 -12px 44px rgb(0 0 0 / 18%);
        }
        .morchis-menu .morchis-logo {
          margin: 0;
          min-width: 0;
        }
        .morchis-menu .morchis-logo img {
          display: block;
          width: clamp(9rem, 54vw, 19rem);
          max-width: 100%;
          height: clamp(4rem, 18vw, 6rem);
          object-fit: contain;
          object-position: left center;
        }
        .morchis-menu .morchis-titulo-producto { font-weight: 800; }
        .morchis-menu .morchis-titulo-hoja {
          margin: 0;
          color: #fff;
          font-size: clamp(1.875rem, 8vw, 3rem);
          line-height: 1.06;
          overflow-wrap: anywhere;
        }
        .morchis-menu button:disabled { cursor: not-allowed; }
        .morchis-menu button:focus-visible,
        .morchis-menu input[type="checkbox"]:focus-visible,
        .morchis-menu input[type="radio"]:focus-visible {
          outline: 2px solid #554000;
          outline-offset: 2px;
        }
        @media (min-width: 640px) {
          .morchis-menu .morchis-hoja { border-radius: 28px; }
        }
      `}</style>
      <header className="morchis-encabezado border-b border-black/10 px-4 py-2 sticky top-0 z-20">
        <div className="flex justify-between items-center gap-3 max-w-lg mx-auto">
          <h1 className="morchis-logo">
            <img
              src="/img/logoicon.webp"
              alt="MORCHIS"
            />
          </h1>
          <div className="shrink-0 whitespace-nowrap text-right">
            <span
              className={`${colorEstado} px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider`}
            >
              {estadoLocal}
            </span>
          </div>
        </div>
      </header>
      <main className="max-w-lg mx-auto pt-6 px-4 pb-6">
        <div className="mb-5">
  <div className="flex gap-2" aria-label="Menús de MORCHIS">
    {Object.entries(TURNOS).map(([id, turno]) => (
      <button
        key={id}
        type="button"
        aria-pressed={turnoMenu === id}
        disabled={id === "desayunos" && !DESAYUNOS_HABILITADOS}
        onClick={() => {
          if (id === turnoMenu) return;
          if (carrito.length > 0) {
            return alert(
              "Termina tu pedido o quita los productos del carrito antes de cambiar de menú."
            );
          }
          setTurnoMenu(id);
        }}
        className={`flex-1 rounded-xl border px-4 py-3 font-bold ${
          turnoMenu === id
            ? "morchis-pestana-activa border-transparent"
            : "bg-white border-gray-200 text-gray-900 disabled:text-gray-500"
        }`}
      >
        {id === "desayunos" && !DESAYUNOS_HABILITADOS
  ? "Desayunos · Próximamente"
  : turno.nombre}
      </button>
    ))}
  </div>
  <p className="mt-2 text-center text-sm text-gray-600">
    {TURNOS[turnoMenu].horario}
  </p>
  {menuVisible.length === 0 && (
    <p className="mt-5 text-center text-sm text-gray-600">
      Todavía no hay productos en este menú.
    </p>
  )}
</div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[...menuVisible]
            .sort((a, b) => (a.agotado === b.agotado ? 0 : a.agotado ? 1 : -1))
            .map((categoria) => {
              const estaAgotado = categoria.agotado;
              return (
                <div
                  key={categoria.id}
                  id={categoria.id}
                  onClick={() =>
                    !estaAgotado && setProductoSeleccionado(categoria)
                  }
                  className={`bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col group scroll-mt-32 ${estaAgotado ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95"}`}
                >
                  <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                    <ImageWithSkeleton
                      src={categoria.imagen}
                      alt={categoria.nombre}
                    />
                    {estaAgotado && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                        <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg tracking-widest shadow-lg">
                          AGOTADO
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col justify-between items-center text-center">
                    <h3 className="morchis-titulo-producto text-gray-900 text-lg sm:text-xl leading-tight">
                      {categoria.nombre}
                    </h3>
                    <span
                      className={`text-[10px] sm:text-xs font-bold mt-2 px-2 py-1 rounded-md ${estaAgotado ? "text-gray-500 bg-gray-100" : "morchis-tinte morchis-dorado"}`}
                    >
                      {estaAgotado ? "No disponible" : "Ver opciones"}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </main>
      {toastMsg && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full text-sm font-semibold shadow-lg animate-fade-in-down whitespace-nowrap">
          {toastMsg}
        </div>
      )}
      {productoSeleccionado && (
        <ModalPersonalizacion
          key={productoSeleccionado.id}
          producto={productoSeleccionado}
          cerrar={() => setProductoSeleccionado(null)}
          agregarAlCarrito={agregarAlCarrito}
          catalogos={catalogos}
        />
      )}
      {carrito.length > 0 && !mostrarCarrito && !productoSeleccionado && (
        <div className="fixed bottom-0 left-0 right-0 p-4 morchis-vidrio morchis-area-inferior border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-lg mx-auto flex justify-between items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                {totalArticulos} artículos
              </p>
              <p className="font-black text-xl text-gray-900">
                ${totalProductos}{" "}
                <span className="text-sm font-medium">MXN</span>
              </p>
            </div>
            <button
              onClick={() => setMostrarCarrito(true)}
              className="morchis-accion px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm"
            >
              Ver Orden
            </button>
          </div>
        </div>
      )}
      {mostrarCarrito && (
        <div className="fixed inset-0 morchis-carrito z-50 flex flex-col overflow-hidden animate-fade-in">
          <header className="morchis-vidrio p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">
              Checkout
            </h2>
            <button
              onClick={() => setMostrarCarrito(false)}
              className="text-gray-900 font-bold text-sm bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
            >
              Volver
            </button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-6">
            {carrito.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-bold text-gray-900">
                  Tu orden está vacía
                </h3>
                <button
                  onClick={() => setMostrarCarrito(false)}
                  className="mt-6 bg-gray-900 text-white font-bold px-6 py-3 rounded-lg text-sm"
                >
                  Regresar al menú
                </button>
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 tracking-tight">
                    Resumen de Orden
                  </h3>
                  {carrito.map((item) => (
                    <div
                      key={item.idUnico}
                      className="py-4 flex justify-between items-start border-b border-gray-100 last:border-0 last:pb-0"
                    >
                      <div className="flex-1 pr-4">
                        <p className="font-black text-gray-900 text-sm mb-1">
                          {item.cantidad}x {item.nombreProducto}
                        </p>
                        {/* Bloque de detalles minuciosos */}
                        <div className="text-[11px] text-gray-500 space-y-0.5 leading-tight mb-2">
                          <p>
                            <span className="font-bold">Opción:</span>{" "}
                            {item.variante}
                          </p>
                          {item.proteina && (
                            <p>
                              <span className="font-bold">Carne:</span>{" "}
                              {item.proteina}
                            </p>
                          )}
                          {item.removibles && item.removibles.length > 0 && (
                            <p className="text-red-500">
                              <span className="font-bold">Sin:</span>{" "}
                              {item.removibles.join(", ")}
                            </p>
                          )}
                          {item.opcionObligatoria && (
                            <p>
                              <span className="font-bold">Elección:</span>{" "}
                              {item.opcionObligatoria}
                            </p>
                          )}
                          {item.salsas && item.salsas.length > 0 && (
                            <p>
                              <span className="font-bold">Salsas:</span>{" "}
                              {item.salsas.join(", ")}
                              {item.modoMezclaSalsa && (
                                <span className="italic">
                                  {" "}
                                  ({item.modoMezclaSalsa})
                                </span>
                              )}
                            </p>
                          )}
                          {item.salsasAparte && (
                            <p className="morchis-dorado">
                              <span className="font-bold">Servicio:</span>{" "}
                              Salsas aparte (+${item.cargosAparte.cargoSalsas})
                            </p>
                          )}
                          {item.combo && !item.combo.includes("Solo") && (
                            <p>
                              <span className="font-bold">Combo:</span>{" "}
                              {item.combo}
                            </p>
                          )}
                          {item.saborSoda && (
                            <p>
                              <span className="font-bold">Refresco:</span>{" "}
                              {item.saborSoda}
                            </p>
                          )}
                          {item.saborFrappe && (
                            <p>
                              <span className="font-bold">Frappe:</span>{" "}
                              {item.saborFrappe}
                            </p>
                          )}
                          {item.detallesPapas && (
                            <div>
                              <p><span className="font-bold">Papas:</span> {item.detallesPapas.sazonador}</p>
                              {/* EL CAMBIO ESTÁ AQUÍ: Protegemos con ?. */}
                              {item.detallesPapas?.sin?.length > 0 && (
                                <p className="text-red-500"><span className="font-bold">Papas sin:</span> {item.detallesPapas.sin.join(', ')}</p>
                              )}
                              {item.cargosAparte?.cargoPapas > 0 && (
                                <p className="morchis-dorado"><span className="font-bold">Servicio:</span> Queso, catsup y salsa aparte (+${item.cargosAparte.cargoPapas})</p>
                              )}
                            </div>
                          )}
                          {item.extras && item.extras.length > 0 && (
                            <p className="morchis-dorado">
                              <span className="font-bold">Extras:</span>{" "}
                              {item.extras.map((e) => e.nombre).join(", ")}
                            </p>
                          )}
                          {item.notas && (
                            <p className="italic text-gray-700 bg-gray-50 p-1.5 rounded mt-1 border border-gray-100 text-[10px]">
                              "{item.notas}"
                            </p>
                          )}
                        </div>
                        <p className="text-sm font-black text-gray-900">
                          ${item.totalItem * item.cantidad}
                        </p>
                      </div>
                      <button
                        onClick={() => quitarDelCarrito(item.idUnico)}
                        className="text-gray-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-wider underline transition-colors pt-1"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  {/* AQUÍ TERMINA EL NUEVO DESGLOSE */}
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-900 tracking-tight">
                    Detalles de Entrega
                  </h3>
                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      placeholder="¿A nombre de quién?"
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium text-[16px]"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                      Tipo de entrega
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setTipoEntrega("recoger")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "recoger" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                      >
                        Recoger
                      </button>
                      <button
                        onClick={() => setTipoEntrega("sucursal")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "sucursal" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                      >
                        En Mesa
                      </button>
                      <button
                        onClick={() => setTipoEntrega("domicilio")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === "domicilio" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                      >
                        Domicilio
                      </button>
                    </div>
                  </div>
                  {tipoEntrega === "domicilio" && (
                    <div className="animate-fade-in mt-4">
                      <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                        Dirección completa *
                      </label>
                      <textarea
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        placeholder="Calle, Número, Referencias..."
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none font-medium text-[16px]"
                        rows="2"
                      ></textarea>
                    </div>
                  )}
                  <div className="border-t border-gray-100 pt-6">
                    <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                      Método de pago
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMetodoPago("efectivo")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${metodoPago === "efectivo" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                      >
                        Efectivo
                      </button>
                      <button
                        onClick={() => setMetodoPago("transferencia")}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${metodoPago === "transferencia" ? "morchis-elegido" : "bg-gray-50 border-gray-200 text-gray-600"}`}
                      >
                        Transferencia
                      </button>
                    </div>
                  </div>
                  {metodoPago === "efectivo" && (
                    <div className="animate-fade-in">
                      <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">
                        Cambio (Monto del billete)
                      </label>
                      <input
                        type="number"
                        placeholder="Ej. 500"
                        value={billete}
                        onChange={(e) => setBillete(e.target.value)}
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium text-[16px]"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          {carrito.length > 0 && (
            <div className="morchis-vidrio morchis-area-inferior p-5 border-t border-gray-100">
              <div className="max-w-lg mx-auto">
                <div className="flex justify-between text-gray-500 mb-2 text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    ${totalProductos}
                  </span>
                </div>
                {tipoEntrega === "domicilio" && (
                  <div className="flex justify-between text-gray-500 mb-4 text-sm">
                    <span>Costo de envío:</span>
                    <span className="font-medium text-gray-900">
                      ${COSTO_ENVIO_DOMICILIO}
                    </span>
                  </div>
                )}
                <div className="flex justify-between mb-5 border-t border-gray-100 pt-4">
                  <span className="font-black text-gray-900 text-lg tracking-tight">
                    Total a pagar
                  </span>
                  <span className="font-black text-2xl text-gray-900">
                    ${totalPagar}
                  </span>
                </div>
                {estaAbierto ? (
                  <button
                    onClick={enviarAWhatsApp}
                    className="w-full morchis-accion p-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2"
                  >
                    Enviar Orden
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-200 text-gray-400 p-4 rounded-xl font-bold text-lg cursor-not-allowed"
                  >
                    Fuera de horario
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <footer className="pt-10 pb-6 text-center border-t border-gray-200 mt-10">
        <p className="text-gray-400 text-xs font-medium">
          © 2026 Morchis. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
function revisarArticulo(item, producto, catalogos) {
  if (!producto) return "este producto ya no aparece en el menú";
  const combo = producto.combos?.find(
    (opcion) => opcion.nombre === item.combo
  );
  if (
    (producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length) &&
    !item.removibles?.length
  ) {
    return "falta elegir cómo quieres el producto";
  }
  if (
    (producto.esProductoPapas || combo?.incluyePapas || item.detallesPapas) &&
    !item.detallesPapas?.sin?.length
  ) {
    return "falta elegir la preparación de las papas";
  }
  const esFrappe =
    Boolean(producto.esFrappe) ||
    /frapp[eé]/i.test(`${producto.id ?? ""} ${producto.nombre ?? ""}`);
  const opciones = esFrappe
    ? (catalogos.frappes ?? [])
    : catalogoDeProducto(producto, catalogos);
  const seleccion = item.opcionObligatoria || item.saborFrappe;
  if (
    (esFrappe || producto.opcionObligatoria || opciones.length > 0) &&
    !opciones.includes(seleccion)
  ) {
    return "falta una opción válida de sabor o preparación";
  }
  if (combo?.incluyeSoda && !catalogos.sodas.includes(item.saborSoda)) {
    return "falta elegir el sabor de la soda del combo";
  }
  return "";
}
function preparacionBloqueada(opcion, seleccion) {
  // La opción marcada siempre se puede desmarcar.
  if (seleccion.includes(opcion)) return false;
  // «Sin…» se puede combinar con otras opciones «Sin…».
  const esParaQuitar = (texto) => /^sin\s/i.test(texto.trim());
  return seleccion.length > 0 &&
    (!esParaQuitar(opcion) || seleccion.some((valor) => !esParaQuitar(valor)));
}
function ModalPersonalizacion({ producto, cerrar, agregarAlCarrito, catalogos }) {
  // Buscamos la primera variante que NO esté agotada para seleccionarla por defecto
  const indiceInicial = Math.max(
    0,
    producto.variantes.findIndex((v) => !v.agotada),
  );
  const [varianteIndex, setVarianteIndex] = useState(indiceInicial);
  const [comboIndex, setComboIndex] = useState(0);
  const [opcionObligatoria, setOpcionObligatoria] = useState("");
  const proteinaInicial =
    producto.opcionProteina?.find((p) => !p.agotada)?.nombre || "";
  const [proteina, setProteina] = useState(proteinaInicial);
  const [salsasSeleccionadas, setSalsasSeleccionadas] = useState([]);
  const [salsasAparte, setSalsasAparte] = useState(false);
  const [saborSoda, setSaborSoda] = useState("");
  const [sazonadorPapas, setSazonadorPapas] = useState(sazonadoresPapas[0]);
  const [removiblesPapasSeleccionados, setRemoviblesPapasSeleccionados] =
    useState([]);
  const [modoMezclaSalsa, setModoMezclaSalsa] = useState("mitad y mitad");
  const [removibles, setRemovibles] = useState([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]);
  const [notas, setNotas] = useState("");
  const [cantidadItem, setCantidadItem] = useState(1);
  const [quesoVariante, setQuesoVariante] = useState("");
  const varianteActual =
    producto.variantes[varianteIndex] || producto.variantes[0];
  const comboActual = producto.combos ? producto.combos[comboIndex] : null;
 const esFrappe =
  Boolean(producto.esFrappe) ||
  /frapp[eé]/i.test(`${producto.id ?? ""} ${producto.nombre ?? ""}`);
const opcionesObligatorias = esFrappe
  ? catalogos.frappes ?? []
  : catalogoDeProducto(producto, catalogos);
const opcionRequerida = esFrappe
  ? { titulo: "Sabor del frappe" }
  : producto.opcionObligatoria ||
    (opcionesObligatorias.length > 0 ? { titulo: "Sabor" } : null);
  const cargosAparte = calcularCargosAparte({
    salsasSeleccionadas,
    salsasAparte,
    removiblesPapasSeleccionados,
  });
  const totalExtras = extrasSeleccionados.reduce(
    (total, extra) => total + extra.precio,
    0,
  );
  const precioUnitario =
    varianteActual.precioBase +
    (comboActual ? comboActual.precioExtra : 0) +
    totalExtras +
    cargosAparte.total;
  const totalFinal = precioUnitario * cantidadItem;
  const handleAgregar = () => {
        const requierePreparacion = Boolean(
      producto.usaRemoviblesGlobales || producto.removiblesEspecificos?.length
    );
    const llevaPapas = producto.esProductoPapas || comboActual?.incluyePapas;
    if (requierePreparacion && removibles.length === 0) {
      return alert("Elige cómo quieres preparar tu producto.");
    }
    if (llevaPapas && removiblesPapasSeleccionados.length === 0) {
      return alert("Elige cómo quieres preparar tus papas.");
    }
    if (varianteActual.agotada) return alert("Esta variante está agotada.");
    if (producto.maxSalsas && salsasSeleccionadas.length === 0)
      return alert("Selecciona al menos una salsa.");
    if (opcionRequerida && !opcionesObligatorias.includes(opcionObligatoria)) {
  return alert(
    opcionesObligatorias.length
      ? `Elige una opción en «${opcionRequerida.titulo}».`
      : "Por el momento no hay opciones disponibles para este producto."
  );
}
if (comboActual?.incluyeSoda && !catalogos.sodas.includes(saborSoda)) {
  return alert("Elige el sabor de la soda del combo.");
}
    if (varianteActual.opcionesQueso && !quesoVariante)
      return alert("Selecciona una opción de queso.");
    const requiereProteina =
      producto.opcionProteina &&
      !varianteActual.nombre.toLowerCase().includes("chicken");
    const itemParaCarrito = {
      productoId: producto.id,
      nombreProducto: producto.nombre,
      variante: varianteActual.opcionesQueso
        ? `${varianteActual.nombre} (${quesoVariante})`
        : varianteActual.nombre,
      proteina: requiereProteina ? proteina : null,
      combo: comboActual ? comboActual.nombre : null,
      opcionObligatoria: opcionRequerida ? opcionObligatoria : null,
tituloOpcion: opcionRequerida?.titulo ?? null,
      salsas: salsasSeleccionadas,
      salsasAparte,
      cargosAparte,
      modoMezclaSalsa: producto.maxSalsas === 2 ? modoMezclaSalsa : null,
      saborSoda: comboActual && comboActual.incluyeSoda ? saborSoda : null,
      detallesPapas:
        (comboActual && comboActual.incluyePapas) || producto.esProductoPapas
          ? { sazonador: sazonadorPapas, sin: removiblesPapasSeleccionados }
          : null,
      extras: extrasSeleccionados,
      removibles: removibles,
      notas: notas,
      totalItem: precioUnitario,
      cantidad: cantidadItem,
    };
    agregarAlCarrito(itemParaCarrito);
    cerrar();
  };
  const toggleSalsa = (salsa) =>
    setSalsasSeleccionadas((prev) => {
      if (prev.includes(salsa)) return prev.filter((s) => s !== salsa);
      if (prev.length >= producto.maxSalsas) return prev;
      return [...prev, salsa];
    });
  const toggleArray = (item, setter) =>
    setter((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  const mostrarProteina =
    producto.opcionProteina &&
    !varianteActual.nombre.toLowerCase().includes("chicken");
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 sm:p-4 sm:items-center animate-fade-in">
      <div className="bg-white w-full max-w-md h-[92dvh] sm:h-auto sm:max-h-[90vh] morchis-hoja flex flex-col overflow-hidden">
        <div className="relative h-48 sm:h-56 bg-gray-900 shrink-0">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-0"></div>
          <button
            onClick={cerrar}
            className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 w-10 h-10 rounded-full font-bold shadow-sm transition-colors flex items-center justify-center text-sm z-10"
          >
            ✕
          </button>
          <h2 className="morchis-titulo-producto morchis-titulo-hoja absolute bottom-5 left-5 right-5 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] z-10 uppercase">
            {producto.nombre}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-7 bg-white">
          <section>
            <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
              Elige tu opción <span className="morchis-dorado">*</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {producto.variantes.map((variante, index) => {
                const estaAgotada = variante.agotada;
                return (
                  <label
                    key={variante.id}
                    className={`flex flex-col p-3 border rounded-xl transition-all w-full text-left ${estaAgotada ? "opacity-50 grayscale cursor-not-allowed bg-gray-50" : varianteIndex === index ? "border-gray-900 bg-gray-50 shadow-sm cursor-pointer" : "border-gray-200 bg-white hover:border-gray-300 cursor-pointer"}`}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <input
                        type="radio"
                        disabled={estaAgotada}
                        checked={!estaAgotada && varianteIndex === index}
                        onChange={() => setVarianteIndex(index)}
                        className="w-4 h-4 mt-0.5 text-gray-900 morchis-check shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <span className="font-black text-gray-900 text-sm block leading-tight pr-1">
                            {variante.nombre}
                          </span>
                          {estaAgotada && (
                            <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                              Agotado
                            </span>
                          )}
                        </div>
                        {variante.descripcion && (
                          <span className="text-gray-500 text-[10px] mt-1 mb-1 block leading-tight">
                            {variante.descripcion}
                          </span>
                        )}
                        <span className="morchis-dorado font-bold text-xs mt-1 block">
                          ${variante.precioBase}
                        </span>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </section>
          {mostrarProteina && (
            <section className="morchis-tinte p-4 rounded-xl border morchis-borde animate-fade-in">
              <h3 className="font-bold morchis-dorado mb-3 text-xs tracking-wider uppercase">
                Tipo de Carne <span className="morchis-dorado">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.opcionProteina.map((prot) => {
                  const estaAgotada = prot.agotada;
                  return (
                    <button
                      key={prot.nombre}
                      disabled={estaAgotada}
                      onClick={() => setProteina(prot.nombre)}
                      className={`p-3 rounded-xl text-sm font-bold border transition-all text-left leading-tight relative ${estaAgotada ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-70" : proteina === prot.nombre ? "morchis-elegido shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                    >
                      {prot.nombre}
                      {estaAgotada && (
                        <span className="block text-[9px] font-black text-red-500 uppercase mt-1">
                          Agotada
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
          {varianteActual.opcionesQueso && (
            <section className="morchis-tinte p-4 rounded-xl border morchis-borde animate-fade-in">
              <h3 className="font-bold morchis-dorado mb-3 text-xs tracking-wider uppercase">
                Elige tu Queso <span className="morchis-dorado">*</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {varianteActual.opcionesQueso.map((queso) => (
                  <button
                    key={queso}
                    onClick={() => setQuesoVariante(queso)}
                    className={`p-3 rounded-xl text-sm font-bold border transition-all text-left leading-tight ${quesoVariante === queso ? "morchis-elegido shadow-md" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    {queso}
                  </button>
                ))}
              </div>
            </section>
          )}
          {/* NUEVA SECCIÓN DE FRAPPES */}
          {opcionRequerida && (
  <section>
    <h3 className="mb-3 text-sm font-bold">{opcionRequerida.titulo} *</h3>
    {opcionesObligatorias.length === 0 ? (
      <p>No hay sabores disponibles por el momento.</p>
    ) : (
      <div className="grid grid-cols-2 gap-2">
        {opcionesObligatorias.map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => setOpcionObligatoria(opcion)}
            aria-pressed={opcionObligatoria === opcion}
            className={`rounded-xl border p-3 text-sm font-bold ${
              opcionObligatoria === opcion
                ? "morchis-elegido"
                : "bg-white text-gray-900"
            }`}
          >
            {opcion}
          </button>
        ))}
      </div>
    )}
  </section>
)}
          {(producto.usaRemoviblesGlobales ||
            producto.removiblesEspecificos) && (
            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                ¿Cómo lo quieres?
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(producto.removiblesEspecificos || removiblesGlobales).map(
                  (item) => {
                    const isChecked = removibles.includes(item);
                    return (
                      <label
                        key={item}
                        className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-left ${isChecked ? "border-gray-400 bg-gray-100" : "border-gray-200 bg-white hover:border-gray-300"}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleArray(item, setRemovibles)}
                          disabled={preparacionBloqueada(item, removibles)}
                          className="w-4 h-4 shrink-0 rounded text-gray-600 accent-gray-600"
                        />
                        <span
                          className={`text-xs font-bold leading-tight ${isChecked ? "text-gray-500 line-through" : "text-gray-700"}`}
                        >
                          {item}
                        </span>
                      </label>
                    );
                  },
                )}
              </div>
            </section>
          )}
          {producto.maxSalsas && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1 text-xs tracking-wider uppercase">
                Tus Salsas <span className="morchis-dorado">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {catalogos.salsas_alitas.map((salsa) => {
                  const isChecked = salsasSeleccionadas.includes(salsa);
                  const isDisabled =
                    !isChecked &&
                    salsasSeleccionadas.length >= producto.maxSalsas;
                  return (
                    <label
                      key={salsa}
                      className={`flex items-center gap-2 p-3 bg-white rounded-lg border transition-all text-left ${isDisabled ? "opacity-50" : "cursor-pointer"} ${isChecked ? "border-gray-900" : "border-gray-200"}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSalsa(salsa)}
                        disabled={isDisabled}
                        className="w-4 h-4 shrink-0 rounded text-gray-900 morchis-check"
                      />
                      <span className="text-xs font-bold text-gray-800 leading-tight">
                        {salsa}
                      </span>
                    </label>
                  );
                })}
              </div>
              <label className={`mt-4 flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${salsasAparte ? "morchis-borde morchis-tinte" : "border-gray-200 bg-white"}`}>
                <input
                  type="checkbox"
                  checked={salsasAparte}
                  onChange={(e) => setSalsasAparte(e.target.checked)}
                  className="w-4 h-4 mt-0.5 morchis-check"
                />
                <span className="text-xs font-bold text-gray-800">
                  Servir salsas aparte (+${PRECIO_SALSA_APARTE} por cada salsa)
                </span>
              </label>
              {salsasSeleccionadas.length === 2 && (
                <div className="mt-4 p-3 morchis-tinte rounded-xl border morchis-borde animate-fade-in">
                  <p className="text-[10px] font-black morchis-dorado uppercase mb-2 tracking-tighter">
                    ¿Cómo servimos tus 2 salsas?
                  </p>
                  <div className="flex gap-2">
                    {["mitad y mitad", "combinadas"].map((modo) => (
                      <button
                        key={modo}
                        onClick={() => setModoMezclaSalsa(modo)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all border ${
                          modoMezclaSalsa === modo
                            ? "morchis-elegido shadow-sm"
                            : "bg-white morchis-borde morchis-dorado"
                        }`}
                      >
                        {modo}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
          {producto.extras && producto.extras.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Extras
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.extras.map((extra) => {
                  const estaAgotado = extra.agotada;
                  const isChecked = extrasSeleccionados.some(
                    (e) => e.id === extra.id,
                  );
                  return (
                    <label
                      key={extra.id}
                      className={`flex flex-col p-3 border rounded-xl transition-all text-left ${estaAgotado ? "opacity-50 grayscale cursor-not-allowed bg-gray-50" : isChecked ? "border-gray-900 bg-gray-50 shadow-sm cursor-pointer" : "border-gray-200 hover:border-gray-300 cursor-pointer"}`}
                    >
                      <div className="flex items-start gap-2 w-full">
                        <input
                          type="checkbox"
                          disabled={estaAgotado}
                          checked={!estaAgotado && isChecked}
                          onChange={() =>
                            toggleArray(extra, setExtrasSeleccionados)
                          }
                          className="w-4 h-4 mt-0.5 shrink-0 rounded text-gray-900 morchis-check"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-900 text-sm block leading-tight pr-1">
                              {extra.nombre}
                            </span>
                            {estaAgotado && (
                              <span className="text-[8px] font-black text-red-500 uppercase bg-red-50 px-1 py-0.5 rounded">
                                Agotado
                              </span>
                            )}
                          </div>
                          <span className="text-gray-500 font-medium text-xs mt-1 block">
                            +${extra.precio}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </section>
          )}
          {producto.combos && producto.combos.length > 1 && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Hazlo Combo
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.combos.map((combo, index) => (
                  <label
                    key={combo.id}
                    className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all text-left ${comboIndex === index ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300"}`}
                  >
                    <div className="flex items-start gap-2 w-full">
                      <input
                        type="radio"
                        checked={comboIndex === index}
                        onChange={() => setComboIndex(index)}
                        className="w-4 h-4 mt-0.5 shrink-0 text-gray-900 morchis-check"
                      />
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 text-sm block leading-tight">
                          {combo.nombre}
                        </span>
                        {combo.precioExtra > 0 ? (
                          <span className="text-gray-500 font-medium text-xs mt-1 block">
                            +${combo.precioExtra}
                          </span>
                        ) : (
                          <span className="text-gray-500 font-medium text-xs mt-1 block">
                            Incluido
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}
          {/* ... SODA Y PAPAS (Se quedan igual) ... */}
          {comboActual && comboActual.incluyeSoda && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Sabor de Soda
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {catalogos.sodas.map((sabor) => (
                  <button
                    key={sabor}
                    onClick={() => setSaborSoda(sabor)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left leading-tight ${saborSoda === sabor ? "morchis-elegido" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    {sabor}
                  </button>
                ))}
              </div>
            </section>
          )}
          {((comboActual && comboActual.incluyePapas) ||
            producto.esProductoPapas) && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
                Preparación Papas
              </h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {sazonadoresPapas.map((saz) => (
                  <button
                    key={saz}
                    onClick={() => setSazonadorPapas(saz)}
                    className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left leading-tight ${sazonadorPapas === saz ? "morchis-elegido" : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"}`}
                  >
                    {saz}
                  </button>
                ))}
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-[10px] tracking-wider uppercase">
                ¿Cómo quieres tus papas? *
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {removiblesPapas.map((item) => (
                  <label
                    key={item}
                    className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-left"
                  >
                    <input
                      type="checkbox"
                      checked={removiblesPapasSeleccionados.includes(item)}
                      disabled={preparacionBloqueada(item, removiblesPapasSeleccionados)}
                      onChange={() =>
                        toggleArray(item, setRemoviblesPapasSeleccionados)
                      }
                      className="w-4 h-4 shrink-0 rounded text-gray-900 morchis-check"
                    />
                    <span className="text-xs font-medium text-gray-700 leading-tight">
                      {item}
                      {item === "Todo Aparte" && ` (+$${PRECIO_ADEREZOS_PAPAS_APARTE} por queso, catsup y salsa)`}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          )}
          <section className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">
              Notas adicionales
            </h3>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Bien doradas"
              className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-gray-900 focus:bg-white font-medium text-[16px] text-gray-900 transition-colors"
              rows="2"
            ></textarea>
          </section>
        </div>
        <div className="p-4 morchis-vidrio morchis-area-inferior border-t border-gray-100 shrink-0 flex gap-3 items-center">
          <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-xl p-1 w-28 sm:w-32 shrink-0 h-14">
            <button
              onClick={() => setCantidadItem(Math.max(1, cantidadItem - 1))}
              className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              -
            </button>
            <span className="font-black text-gray-900 text-lg">
              {cantidadItem}
            </span>
            <button
              onClick={() => setCantidadItem(cantidadItem + 1)}
              className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95"
            >
              +
            </button>
          </div>
          <button
            onClick={handleAgregar}
            className={`flex-1 h-14 px-5 rounded-xl font-bold text-lg transition-all flex justify-between items-center shadow-sm ${varianteActual.agotada ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "morchis-accion active:scale-95"}`}
          >
            <span>{varianteActual.agotada ? "Agotado" : "Agregar"}</span>
            <span>${totalFinal}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
