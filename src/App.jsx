import { useState, useEffect, useRef } from "react";
import useCatalogoMenu from "./hooks/useCatalogoMenu";
import CatalogoMenu from "./components/CatalogoMenu";
import { revisarArticulo } from "./utils/validarPedido";
import { armarMensajePedido, formatoPesos } from "./utils/mensajePedido";
import AvisoPedido from "./components/AvisoPedido";
import ModalPersonalizacion from "./components/ModalPersonalizacion";
import CarritoPedido from "./components/CarritoPedido";
import { DESAYUNOS_HABILITADOS, TURNOS, turnoAbierto } from "./config/turnos";
import "./styles/menuMorchis.css";
// ==========================================
// CONFIGURACIÓN DE NEGOCIO
// ==========================================
const TELEFONO_MORCHIS = "5641375355";
const COSTO_ENVIO_DOMICILIO = 10;

export default function App() {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [aviso, setAviso] = useState(null);
  const temporizadorAviso = useRef(null);
  useEffect(() => () => clearTimeout(temporizadorAviso.current), []);
  // Estado del menú público
  const [turnoMenu, setTurnoMenu] = useState(() =>
  DESAYUNOS_HABILITADOS && turnoAbierto("desayunos")
    ? "desayunos"
    : "noche"
);
  const { menuData, menuVisible, catalogos, cargandoMenu } = useCatalogoMenu(turnoMenu);
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
  const cerrarAviso = () => {
    clearTimeout(temporizadorAviso.current);
    setAviso(null);
  };
  const mostrarAviso = (mensaje, tipo = "atencion") => {
    clearTimeout(temporizadorAviso.current);
    setAviso({ mensaje, tipo });
    if (tipo === "exito") {
      temporizadorAviso.current = setTimeout(() => setAviso(null), 3000);
    }
  };
  const agregarAlCarrito = (nuevoItem) => {
    setCarrito([...carrito, { ...nuevoItem, idUnico: Date.now() }]);
    mostrarAviso(`${nuevoItem.cantidad}x ${nuevoItem.nombreProducto} agregado`, "exito");
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
  const pagaCon = billete ? Number(billete) : totalPagar;
  const cambioEfectivo = Math.round((pagaCon - totalPagar) * 100) / 100;
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
  return mostrarAviso(`El menú de ${TURNOS[turnoMenu].nombre} está cerrado.`);
}
    if (!nombreCliente.trim()) return mostrarAviso("Por favor, ingresa tu nombre.");
    if (tipoEntrega === "domicilio" && !direccion.trim())
      return mostrarAviso("Ingresa tu dirección de entrega.");
    if (metodoPago === "efectivo" && cambioEfectivo < 0) {
      return mostrarAviso(`El monto en efectivo debe cubrir ${formatoPesos(totalPagar)}.`);
    }
    for (const item of carrito) {
  const producto = menuData.find((entrada) =>
    item.productoId
      ? entrada.id === item.productoId
      : entrada.nombre === item.nombreProducto
  );
  const error = revisarArticulo(item, producto, catalogos);
  if (error) {
    return mostrarAviso(
      `${item.nombreProducto}: ${error}. Quita este artículo y agrégalo de nuevo.`
    );
  }
}
    const mensaje = armarMensajePedido({
      carrito, menuData, nombreCliente, tipoEntrega, direccion, metodoPago, billete, totalPagar,
    });
    localStorage.removeItem("morchis_carrito");
    setCarrito([]);
    const url = `https://wa.me/${TELEFONO_MORCHIS}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };
  return (
    <div className="morchis-menu min-h-screen pb-28" data-turno={turnoMenu}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&display=swap" precedence="morchis-fonts" />
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
            return mostrarAviso(
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
</div>
        <CatalogoMenu productos={menuVisible} onSeleccionar={setProductoSeleccionado} />
      </main>
      {aviso && (
        <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="morchis-vidrio pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-black/10 p-3 text-left shadow-xl">
            <span aria-hidden="true" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-black ${aviso.tipo === "exito" ? "bg-green-100 text-green-900" : "morchis-tinte morchis-dorado"}`}>
              {aviso.tipo === "exito" ? "✓" : "!"}
            </span>
            <div role={aviso.tipo === "exito" ? "status" : "alert"} className="min-w-0 flex-1 break-words text-sm font-semibold text-gray-900">
              <p className="font-extrabold">{aviso.tipo === "exito" ? "Listo" : "Revisa tu pedido"}</p>
              <p>{aviso.mensaje}</p>
            </div>
            <button type="button" onClick={cerrarAviso} aria-label="Cerrar aviso" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gray-100 text-lg text-gray-700">
              ×
            </button>
          </div>
        </div>
      )}
      <AvisoPedido aviso={aviso} onCerrar={cerrarAviso} />
      {productoSeleccionado && (
        <ModalPersonalizacion
          key={productoSeleccionado.id}
          producto={productoSeleccionado}
          cerrar={() => {
            setProductoSeleccionado(null);
            cerrarAviso();
          }}
          agregarAlCarrito={agregarAlCarrito}
          catalogos={catalogos}
          mostrarAviso={mostrarAviso}
          cerrarAviso={cerrarAviso}
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
        <CarritoPedido
          carrito={carrito}
          menuData={menuData}
          setMostrarCarrito={setMostrarCarrito}
          quitarDelCarrito={quitarDelCarrito}
          nombreCliente={nombreCliente}
          setNombreCliente={setNombreCliente}
          tipoEntrega={tipoEntrega}
          setTipoEntrega={setTipoEntrega}
          direccion={direccion}
          setDireccion={setDireccion}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          billete={billete}
          setBillete={setBillete}
          cambioEfectivo={cambioEfectivo}
          mostrarAviso={mostrarAviso}
          totalProductos={totalProductos}
          costoEnvioReal={costoEnvioReal}
          totalPagar={totalPagar}
          estaAbierto={estaAbierto}
          enviarAWhatsApp={enviarAWhatsApp}
        />
      )}
      <footer className="pt-10 pb-6 text-center border-t border-gray-200 mt-10">
        <p className="text-gray-400 text-xs font-medium">
          © 2026 Morchis. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
