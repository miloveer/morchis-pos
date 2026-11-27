import { useState, useEffect, useRef } from "react";
import useCatalogoMenu from "./hooks/useCatalogoMenu";
import CatalogoMenu from "./components/CatalogoMenu";
import usePreciosMenu from "./hooks/usePreciosMenu";
import { revisarArticulo } from "./utils/validarPedido";
import { armarMensajePedido, formatoPesos } from "./utils/mensajePedido";
import AvisoCliente from "./components/AvisoCliente";
import { claveCarrito, idDeLinea, leerCarrito, persistirCarrito } from "./utils/carritoCliente";
import ModalPersonalizacion from "./components/ModalPersonalizacion";
import ModalPan from "./components/ModalPan";
import { ensamblarMenu } from "./config/disponibilidadMenu";
import CarritoPedido from "./components/CarritoPedido";
import { TURNOS, turnoActivo, turnoDisponible } from "./config/turnos";
import BarraTurnos from "./components/BarraTurnos";
import "./styles/clientes.css";
// ==========================================
// CONFIGURACIÓN DE NEGOCIO
// ==========================================
const TELEFONO_MORCHIS = "5641375355";
const COSTO_ENVIO_DOMICILIO = 10;

export default function App() {
  const vistaDesayunosLocal = import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("desayunos") === "1";
  const [turnoElegido, setTurnoElegido] = useState(null);
  const catalogoActual = useCatalogoMenu();
  const preciosActuales = usePreciosMenu();
  const [horario, setHorario] = useState(() => {
    const reloj = new Date();
    return { reloj, ultimoTurno: turnoActivo(reloj) ?? "noche" };
  });

  useEffect(() => {
    const actualizar = () => {
      const reloj = new Date();
      const abierto = turnoActivo(reloj);
      setHorario((anterior) => ({ reloj, ultimoTurno: abierto ?? anterior.ultimoTurno }));
    };
    const intervalo = setInterval(actualizar, 5000);
    window.addEventListener("focus", actualizar);
    document.addEventListener("visibilitychange", actualizar);
    return () => {
      clearInterval(intervalo);
      window.removeEventListener("focus", actualizar);
      document.removeEventListener("visibilitychange", actualizar);
    };
  }, []);

  const turnoMenu = turnoElegido ?? (vistaDesayunosLocal ? "desayunos" : horario.ultimoTurno);
  function cambiarTurno(id) {
    setTurnoElegido(id);
    window.scrollTo(0, 0);
  }
  return <MenuClientes key={turnoMenu} turnoMenu={turnoMenu} reloj={horario.reloj} vistaDesayunosLocal={vistaDesayunosLocal}
    cambiarTurno={cambiarTurno} catalogoActual={catalogoActual} preciosActuales={preciosActuales} />;
}

function MenuClientes({ vistaDesayunosLocal, turnoMenu, reloj, cambiarTurno, catalogoActual, preciosActuales }) {
  const [panEnEdicion, setPanEnEdicion] = useState(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [aviso, setAviso] = useState(null);
  const hayDialogo = Boolean(productoSeleccionado || mostrarCarrito);
  useEffect(() => {
    if (!hayDialogo) return;
    const origen = document.activeElement;
    const manejarTecla = (evento) => {
      const dialogo = document.querySelector("[data-dialogo-cliente]");
      if (!dialogo) return;
      if (evento.key === "Escape") {
        evento.preventDefault();
        dialogo.querySelector("[data-cerrar-dialogo]")?.click();
      }
      if (evento.key === "Tab") {
        const controles = [...dialogo.querySelectorAll("button:not(:disabled), input:not(:disabled), textarea:not(:disabled), summary, a[href]")]
          .filter((control) => control.getClientRects().length);
        if (!controles.length) return;
        const primero = controles[0], ultimo = controles.at(-1);
        if (!dialogo.contains(document.activeElement) || (evento.shiftKey ? document.activeElement === primero : document.activeElement === ultimo)) {
          evento.preventDefault();
          (evento.shiftKey ? ultimo : primero).focus();
        }
      }
    };
    document.addEventListener("keydown", manejarTecla);
    return () => {
      document.removeEventListener("keydown", manejarTecla);
      origen?.focus?.({ preventScroll: true });
    };
  }, [hayDialogo]);
  useEffect(() => {
    if (productoSeleccionado || mostrarCarrito) document.querySelector("[data-cerrar-dialogo]")?.focus();
  }, [productoSeleccionado, mostrarCarrito]);
  const temporizadorAviso = useRef(null);
  useEffect(() => () => clearTimeout(temporizadorAviso.current), []);
  // Estado del menú público
  const { menuData: datosMenu, catalogos, estadosDisponibilidad, cargandoMenu, errorMenu, errorCatalogos, reintentarMenu } = catalogoActual;
  const { precios, cargando: cargandoPrecios, error: errorPrecios, reintentar: reintentarPrecios } = preciosActuales;
  const menuData = ensamblarMenu(datosMenu, precios, { vistaPrevia: vistaDesayunosLocal, estados: estadosDisponibilidad });
  const productoActual = menuData.find(({ id }) => id === productoSeleccionado?.id) ?? productoSeleccionado;
  const menuVisible = menuData.filter((producto) =>
    (Array.isArray(producto.turnos) ? producto.turnos : ["noche"]).includes(turnoMenu),
  );
  // Estados del Carrito y Cliente
  const almacenamiento = claveCarrito(turnoMenu, vistaDesayunosLocal);
  const [carrito, setCarrito] = useState(() => leerCarrito(almacenamiento));
  const [abiertoEnWhatsApp, setAbiertoEnWhatsApp] = useState(false);
  const [buscar, setBuscar] = useState("");
  useEffect(() => persistirCarrito(almacenamiento, carrito), [almacenamiento, carrito]);
  const [nombreCliente, setNombreCliente] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState("recoger"); // 'recoger' | 'domicilio' | 'sucursal'
  const [direccion, setDireccion] = useState("");
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [billete, setBillete] = useState("");
  // Lógica de Horarios
  const datosNoDisponibles = errorMenu || errorCatalogos || errorPrecios;
  const horarioAbierto = turnoDisponible(turnoMenu, reloj);
  const estaAbierto = !vistaDesayunosLocal && !datosNoDisponibles && !cargandoMenu && !cargandoPrecios && horarioAbierto;
  const razonCierre = datosNoDisponibles ? "Menú sin verificar" : "Fuera de horario";
  const canastaBloqueada = !vistaDesayunosLocal && !estaAbierto;
  const estadoLocal = horarioAbierto ? "ABIERTO" : "CERRADO";
  const colorEstado = vistaDesayunosLocal ? "bg-amber-100 text-amber-950"
    : horarioAbierto ? "bg-green-100 text-green-900" : "bg-red-100 text-red-900";
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
  function puedeCambiarPedido() {
    if (vistaDesayunosLocal) return true;
    if (!turnoDisponible(turnoMenu)) {
      mostrarAviso("Puedes consultar este menú. Los pedidos se abren en su horario.");
      return false;
    }
    if (datosNoDisponibles || cargandoMenu || cargandoPrecios) {
      mostrarAviso("No pudimos verificar el menú. Intenta de nuevo.");
      return false;
    }
    return true;
  }
  const agregarAlCarrito = (nuevoItem) => {
    if (!puedeCambiarPedido()) return;
    const linea = { ...nuevoItem, idUnico: idDeLinea() };
    setAbiertoEnWhatsApp(false);
    setCarrito((anterior) => [...anterior, linea]);
    mostrarAviso(`${nuevoItem.cantidad}x ${nuevoItem.nombreProducto} agregado`, "exito");
  };
  function editarPan(item) {
    const producto = menuData.find(({ id }) => id === item.productoId);
    if (!producto?.tipoPan || producto.agotado) return mostrarAviso("Este producto ya no se puede editar.");
    setPanEnEdicion(item);
    setProductoSeleccionado(producto);
  }
  function cerrarPan() {
    setPanEnEdicion(null);
    setProductoSeleccionado(null);
    cerrarAviso();
  }
  function guardarPan(item) {
    if (panEnEdicion && !puedeCambiarPedido()) return;
    setAbiertoEnWhatsApp(false);
    if (panEnEdicion) {
      setCarrito((anterior) => anterior.map((linea) =>
        linea.idUnico === panEnEdicion.idUnico ? { ...item, idUnico: linea.idUnico } : linea,
      ));
      cerrarPan();
      mostrarAviso("Cambios guardados", "exito");
    } else {
      cerrarPan();
      agregarAlCarrito(item);
    }
  }
  const quitarDelCarrito = (idUnico) => {
    setAbiertoEnWhatsApp(false);
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
  if ((cargandoMenu || cargandoPrecios) && !vistaDesayunosLocal) {
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
    if (vistaDesayunosLocal) return;
    if (datosNoDisponibles || cargandoMenu || cargandoPrecios) return mostrarAviso("No pude verificar los precios. Recarga e inténtalo otra vez.");
    if (!turnoDisponible(turnoMenu)) {
  return mostrarAviso(`El menú de ${TURNOS[turnoMenu].nombre} está cerrado.`);
}
    if (!carrito.length) return mostrarAviso("Agrega algún producto a tu orden.");
    if (!nombreCliente.trim()) return mostrarAviso("Por favor, ingresa tu nombre.");
    if (tipoEntrega === "domicilio" && !direccion.trim())
      return mostrarAviso("Ingresa tu dirección de entrega.");
    if (metodoPago === "efectivo" && (!Number.isFinite(pagaCon) || cambioEfectivo < 0)) {
      return mostrarAviso(`El monto en efectivo debe cubrir ${formatoPesos(totalPagar)}.`);
    }
    for (const item of carrito) {
  const producto = menuVisible.find((entrada) =>
    item.productoId
      ? entrada.id === item.productoId
      : entrada.nombre === item.nombreProducto
  );
  const error = revisarArticulo(item, producto, catalogos, tipoEntrega);
  if (error) {
    return mostrarAviso(
      `${item.nombreProducto}: ${error}. Revisa el artículo en el carrito.`
    );
  }
}
    const mensaje = armarMensajePedido({
      carrito, menuData, nombreCliente, tipoEntrega, direccion, metodoPago, billete, totalPagar,
    });
    const url = `https://wa.me/${TELEFONO_MORCHIS}?text=${encodeURIComponent(mensaje)}`;
    const ventana = window.open("about:blank", "_blank");
    if (!ventana) return mostrarAviso("El navegador bloqueó WhatsApp. Permite las ventanas emergentes y vuelve a intentarlo.");
    ventana.opener = null;
    ventana.location.replace(url);
    setAbiertoEnWhatsApp(true);
  };
  function finalizarCarrito() {
    setCarrito([]);
    setAbiertoEnWhatsApp(false);
    setMostrarCarrito(false);
    mostrarAviso("Carrito listo para un nuevo pedido.", "exito");
  }

  const normalizar = (valor) => String(valor ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const textoBuscar = normalizar(buscar).trim();
  const resultados = textoBuscar ? menuVisible.filter((producto) =>
    normalizar([producto.nombre, ...(producto.variantes ?? []).map(({ nombre }) => nombre)].join(" ")).includes(textoBuscar)
  ) : menuVisible;

  return (
    <div className="morchis-menu min-h-screen" data-turno={turnoMenu} data-tiene-pedido={carrito.length > 0}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&display=swap" precedence="morchis-fonts" />
      <header className="morchis-encabezado border-b border-black/10 px-4 py-2 sticky top-0 z-20">
        <div className="flex justify-between items-center gap-3 morchis-ancho">
          <h1 className="morchis-logo">
            <img
              key={turnoMenu}
              src={turnoMenu === "desayunos" ? "/img/logo-desayunos.png" : "/img/logoicon.webp"}
              alt="MORCHIS"
              onError={(evento) => {
                const imagen = evento.currentTarget;
                const ruta = imagen.getAttribute("src");
                if (ruta === "/img/logo-desayunos.png") imagen.src = "/img/logoicon.webp";
                else if (ruta === "/img/logoicon.webp") imagen.src = "/img/logoicon.png";
              }}
            />
          </h1>
          <div className="shrink-0 whitespace-nowrap text-right">
            <span
              className={`${colorEstado} px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider`}
            >
              {vistaDesayunosLocal ? "VISTA PREVIA" : estadoLocal}
            </span>
          </div>
        </div>
      </header>
      <main className="morchis-ancho px-4 pb-6 pt-4 sm:px-6 sm:pt-6">
        <p className="morchis-horario-turno mb-5" role="status">
          <strong>{TURNOS[turnoMenu].nombre}</strong> · {TURNOS[turnoMenu].horario}
          {!vistaDesayunosLocal && !horarioAbierto && <span> · Puedes ver el menú; aún no se reciben pedidos.</span>}
        </p>
        {datosNoDisponibles && (
          <div role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3">
            <p className="text-sm font-semibold">No pudimos verificar el menú completo. El envío de pedidos está pausado.</p>
            <button type="button" className="min-h-11 font-bold underline" onClick={() => { reintentarMenu(); reintentarPrecios(); }}>Reintentar</button>
          </div>
        )}
        <CatalogoMenu key={turnoMenu} productos={resultados} onSeleccionar={setProductoSeleccionado}
          buscando={Boolean(textoBuscar)}
          buscador={<label className="morchis-buscar">Busca en el menú
            <input type="search" value={buscar} onChange={(evento) => setBuscar(evento.target.value)} placeholder="Ej. chilaquiles, café o burger" />
          </label>} />
      </main>

      <AvisoCliente aviso={aviso} onCerrar={cerrarAviso} />
      {productoActual?.tipoPan ? (
        <ModalPan key={panEnEdicion?.idUnico ?? productoSeleccionado.id}
          producto={productoActual} item={panEnEdicion} cerrar={cerrarPan} guardar={guardarPan}
          bloqueoHorario={canastaBloqueada ? razonCierre : ""} />
      ) : productoSeleccionado && (
        <ModalPersonalizacion
          key={productoSeleccionado.id}
          producto={productoActual}
          cerrar={() => {
            setProductoSeleccionado(null);
            cerrarAviso();
          }}
          agregarAlCarrito={agregarAlCarrito}
          bloqueoHorario={canastaBloqueada ? razonCierre : ""}
          catalogos={catalogos}
          mostrarAviso={mostrarAviso}
          cerrarAviso={cerrarAviso}
        />
      )}
      {!hayDialogo && <BarraTurnos turnoMenu={turnoMenu} reloj={reloj} vistaPrevia={vistaDesayunosLocal} cambiarTurno={cambiarTurno}>
      {carrito.length > 0 && (
        <div className="morchis-dock-pedido">
          <div className="max-w-lg mx-auto flex justify-between items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                {totalArticulos} {totalArticulos === 1 ? "artículo" : "artículos"}
              </p>
              <p className="font-black text-xl text-gray-900">
                {formatoPesos(totalProductos)}{" "}
                <span className="text-sm font-medium">MXN</span>
              </p>
            </div>
            <button
              onClick={() => setMostrarCarrito(true)}
              className="morchis-accion px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm"
            >
              Ver pedido
            </button>
          </div>
        </div>
      )}
      </BarraTurnos>}
      {mostrarCarrito && !productoSeleccionado && (
        <CarritoPedido
          carrito={carrito}
          menuData={menuData}
          setMostrarCarrito={setMostrarCarrito}
          quitarDelCarrito={quitarDelCarrito}
          editarPan={editarPan}
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
          razonCierre={vistaDesayunosLocal ? "Vista previa · No envía pedidos" : razonCierre}
          abiertoEnWhatsApp={abiertoEnWhatsApp}
          finalizarCarrito={finalizarCarrito}
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
