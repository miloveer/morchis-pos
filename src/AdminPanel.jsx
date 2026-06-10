import { useEffect, useMemo, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import {
  actualizarEstadoPedido,
  escucharPedidos,
} from "./services/ordersService";

const ESTADOS_PEDIDO = {
  nuevo: {
    texto: "Nuevo",
    siguiente: "preparando",
    accion: "Aceptar pedido",
    clases: "bg-blue-100 text-blue-700 border-blue-200",
  },
  preparando: {
    texto: "Preparando",
    siguiente: "listo",
    accion: "Marcar listo",
    clases: "bg-orange-100 text-orange-700 border-orange-200",
  },
  listo: {
    texto: "Listo",
    siguiente: "entregado",
    accion: "Entregar",
    clases: "bg-purple-100 text-purple-700 border-purple-200",
  },
  entregado: {
    texto: "Entregado",
    siguiente: null,
    accion: "",
    clases: "bg-green-100 text-green-700 border-green-200",
  },
  cancelado: {
    texto: "Cancelado",
    siguiente: null,
    accion: "",
    clases: "bg-red-100 text-red-700 border-red-200",
  },
};

function formatearFecha(fechaFirebase) {
  if (!fechaFirebase?.toDate) return "Sin fecha";

  return fechaFirebase.toDate().toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function obtenerFolio(pedidoId) {
  return pedidoId.slice(-6).toUpperCase();
}

export default function AdminPanel({ menuData, cerrarAdmin }) {
  const [seccionActiva, setSeccionActiva] = useState("pedidos");
  const [pedidos, setPedidos] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState("");
  const [actualizandoPedidoId, setActualizandoPedidoId] = useState("");

  useEffect(() => {
    const cancelarEscucha = escucharPedidos(
      (pedidosFirebase) => {
        setPedidos(pedidosFirebase);
        setCargandoPedidos(false);
      },
      (error) => {
        setErrorPedidos(error.message);
        setCargandoPedidos(false);
      }
    );

    return () => cancelarEscucha();
  }, []);

  const resumenPedidos = useMemo(() => {
    const pedidosActivos = pedidos.filter(
      (pedido) => pedido.estado !== "cancelado"
    );

    return {
      totalPedidos: pedidos.length,
      nuevos: pedidos.filter((pedido) => pedido.estado === "nuevo").length,
      preparando: pedidos.filter((pedido) => pedido.estado === "preparando")
        .length,
      listos: pedidos.filter((pedido) => pedido.estado === "listo").length,
      ventaTotal: pedidosActivos.reduce(
        (total, pedido) => total + Number(pedido.totales?.total || 0),
        0
      ),
    };
  }, [pedidos]);

  const toggleEstado = async (categoriaId, campo, valorActual) => {
    try {
      await updateDoc(doc(db, "menu", categoriaId), { [campo]: !valorActual });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const actualizarSubItem = async (
    categoriaId,
    arrayNombre,
    itemId,
    subCampo,
    nuevoValor
  ) => {
    const categoria = menuData.find((m) => m.id === categoriaId);

    const nuevoArray = categoria[arrayNombre].map((item) =>
      item.id === itemId || item.nombre === itemId
        ? { ...item, [subCampo]: nuevoValor }
        : item
    );

    try {
      await updateDoc(doc(db, "menu", categoriaId), {
        [arrayNombre]: nuevoArray,
      });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const cambiarEstadoPedido = async (pedidoId, nuevoEstado) => {
    try {
      setActualizandoPedidoId(pedidoId);
      await actualizarEstadoPedido(pedidoId, nuevoEstado);
    } catch (error) {
      alert("No se pudo actualizar el pedido: " + error.message);
    } finally {
      setActualizandoPedidoId("");
    }
  };

  const renderPedidos = () => (
    <div className="space-y-5">
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Pedidos
          </p>
          <p className="text-2xl font-black text-gray-900">
            {resumenPedidos.totalPedidos}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-blue-100 shadow-sm">
          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Nuevos
          </p>
          <p className="text-2xl font-black text-blue-700">
            {resumenPedidos.nuevos}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">
            Preparando
          </p>
          <p className="text-2xl font-black text-orange-700">
            {resumenPedidos.preparando}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm">
          <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">
            Listos
          </p>
          <p className="text-2xl font-black text-purple-700">
            {resumenPedidos.listos}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-green-100 shadow-sm col-span-2 lg:col-span-1">
          <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">
            Venta registrada
          </p>
          <p className="text-2xl font-black text-green-700">
            ${resumenPedidos.ventaTotal}
          </p>
        </div>
      </section>

      {cargandoPedidos && (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
          <p className="font-black text-gray-700">Cargando pedidos...</p>
        </div>
      )}

      {errorPedidos && (
        <div className="bg-red-50 rounded-3xl p-5 border border-red-200">
          <p className="font-black text-red-700">Error al cargar pedidos</p>
          <p className="text-sm text-red-600 mt-1">{errorPedidos}</p>
        </div>
      )}

      {!cargandoPedidos && pedidos.length === 0 && (
        <div className="bg-white rounded-3xl p-8 text-center border border-gray-200">
          <p className="text-4xl mb-2">🍔</p>
          <p className="font-black text-gray-800">Todavía no hay pedidos</p>
          <p className="text-sm text-gray-500 mt-1">
            Cuando alguien haga un pedido desde el menú, aparecerá aquí.
          </p>
        </div>
      )}

      <section className="space-y-4">
        {pedidos.map((pedido) => {
          const estado = ESTADOS_PEDIDO[pedido.estado] || ESTADOS_PEDIDO.nuevo;
          const estaActualizando = actualizandoPedidoId === pedido.id;

          return (
            <article
              key={pedido.id}
              className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-black text-gray-900">
                      Pedido #{obtenerFolio(pedido.id)}
                    </h2>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${estado.clases}`}
                    >
                      {estado.texto}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 font-bold mt-1">
                    {formatearFecha(pedido.creadoEn)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {estado.siguiente && (
                    <button
                      onClick={() =>
                        cambiarEstadoPedido(pedido.id, estado.siguiente)
                      }
                      disabled={estaActualizando}
                      className="bg-gray-900 disabled:bg-gray-400 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide"
                    >
                      {estaActualizando ? "Actualizando..." : estado.accion}
                    </button>
                  )}

                  {pedido.estado !== "cancelado" &&
                    pedido.estado !== "entregado" && (
                      <button
                        onClick={() =>
                          cambiarEstadoPedido(pedido.id, "cancelado")
                        }
                        disabled={estaActualizando}
                        className="bg-red-50 disabled:bg-gray-100 text-red-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide border border-red-100"
                      >
                        Cancelar
                      </button>
                    )}
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Cliente
                      </p>
                      <p className="font-black text-gray-900">
                        {pedido.cliente?.nombre || "Sin nombre"}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Entrega
                      </p>
                      <p className="font-black text-gray-900 capitalize">
                        {pedido.entrega?.tipo || "No definido"}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-2xl">
                      <p className="text-[10px] font-black text-gray-400 uppercase">
                        Pago
                      </p>
                      <p className="font-black text-gray-900 capitalize">
                        {pedido.pago?.metodo || "No definido"}
                      </p>
                    </div>
                  </div>

                  {pedido.cliente?.direccion && (
                    <div className="bg-yellow-50 p-3 rounded-2xl border border-yellow-100">
                      <p className="text-[10px] font-black text-yellow-600 uppercase">
                        Dirección
                      </p>
                      <p className="text-sm font-bold text-yellow-900">
                        {pedido.cliente.direccion}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Productos
                    </p>

                    <div className="space-y-2">
                      {pedido.productos?.map((producto, index) => (
                        <div
                          key={`${producto.idUnico}-${index}`}
                          className="bg-gray-50 rounded-2xl p-3 border border-gray-100"
                        >
                          <div className="flex justify-between gap-3">
                            <div>
                              <p className="font-black text-gray-900">
                                {producto.cantidad}x {producto.nombreProducto}
                              </p>
                              <p className="text-xs font-bold text-gray-500">
                                {producto.variante}
                              </p>
                            </div>

                            <p className="font-black text-gray-900">
                              ${producto.total}
                            </p>
                          </div>

                          <div className="mt-2 space-y-1 text-xs text-gray-600 font-semibold">
                            {producto.proteina && (
                              <p>Carne: {producto.proteina}</p>
                            )}

                            {producto.salsas?.length > 0 && (
                              <p>Salsas: {producto.salsas.join(", ")}</p>
                            )}

                            {producto.combo && !producto.combo.includes("Solo") && (
                              <p>Combo: {producto.combo}</p>
                            )}

                            {producto.extras?.length > 0 && (
                              <p>
                                Extras:{" "}
                                {producto.extras
                                  .map((extra) => extra.nombre)
                                  .join(", ")}
                              </p>
                            )}

                            {producto.removibles?.length > 0 && (
                              <p>Sin: {producto.removibles.join(", ")}</p>
                            )}

                            {producto.notas && (
                              <p className="text-orange-700">
                                Nota: {producto.notas}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="bg-gray-900 text-white rounded-3xl p-5 h-fit">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Total del pedido
                  </p>

                  <p className="text-4xl font-black mt-1">
                    ${pedido.totales?.total || 0}
                  </p>

                  <div className="mt-4 space-y-2 text-sm font-bold">
                    <div className="flex justify-between text-gray-300">
                      <span>Subtotal</span>
                      <span>${pedido.totales?.subtotal || 0}</span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>Envío</span>
                      <span>${pedido.totales?.envio || 0}</span>
                    </div>

                    <div className="flex justify-between text-gray-300">
                      <span>Artículos</span>
                      <span>{pedido.totales?.articulos || 0}</span>
                    </div>

                    {pedido.pago?.metodo === "efectivo" && (
                      <div className="flex justify-between text-orange-300 pt-2 border-t border-gray-700">
                        <span>Billete</span>
                        <span>${pedido.pago?.billete || "Exacto"}</span>
                      </div>
                    )}
                  </div>
                </aside>
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );

  const renderMenu = () => (
    <div className="space-y-6">
      {menuData.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icono}</span>
              <h2 className="font-black text-gray-900 uppercase text-sm tracking-tighter">
                {item.nombre}
              </h2>
            </div>

            <button
              onClick={() => toggleEstado(item.id, "agotado", item.agotado)}
              className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all ${
                item.agotado
                  ? "bg-red-500 text-white shadow-red-200 shadow-lg"
                  : "bg-green-500 text-white shadow-green-200 shadow-lg"
              }`}
            >
              {item.agotado ? "Categoría Agotada" : "Categoría Activa"}
            </button>
          </div>

          <div className="p-4 space-y-6">
            {item.variantes && (
              <section>
                <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">
                  Variantes y Precios
                </p>

                <div className="space-y-2">
                  {item.variantes.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-xs"
                    >
                      <button
                        onClick={() =>
                          actualizarSubItem(
                            item.id,
                            "variantes",
                            v.id,
                            "agotada",
                            !v.agotada
                          )
                        }
                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                          v.agotada
                            ? "bg-red-100 text-red-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {v.agotada ? "✕" : "✓"}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs font-bold truncate ${
                            v.agotada
                              ? "text-gray-400 line-through"
                              : "text-gray-900"
                          }`}
                        >
                          {v.nombre}
                        </p>
                      </div>

                      <div className="flex items-center bg-gray-100 rounded-lg px-2">
                        <span className="text-xs font-bold text-gray-500">
                          $
                        </span>
                        <input
                          type="number"
                          defaultValue={v.precioBase}
                          onBlur={(e) =>
                            actualizarSubItem(
                              item.id,
                              "variantes",
                              v.id,
                              "precioBase",
                              Number(e.target.value)
                            )
                          }
                          className="w-14 p-1.5 bg-transparent text-xs font-black text-gray-900 outline-none text-right"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {item.opcionProteina && (
              <section>
                <p className="text-[10px] font-black text-orange-400 uppercase mb-3 tracking-widest">
                  Tipos de Carne
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.opcionProteina.map((prot) => (
                    <div
                      key={prot.nombre}
                      className="flex items-center gap-2 bg-orange-50/30 p-2 rounded-xl border border-orange-100"
                    >
                      <button
                        onClick={() =>
                          actualizarSubItem(
                            item.id,
                            "opcionProteina",
                            prot.nombre,
                            "agotada",
                            !prot.agotada
                          )
                        }
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${
                          prot.agotada
                            ? "bg-red-100 text-red-600"
                            : "bg-orange-100 text-orange-600"
                        }`}
                      >
                        {prot.agotada ? "✕" : "✓"}
                      </button>

                      <p
                        className={`flex-1 text-[11px] font-bold ${
                          prot.agotada
                            ? "text-gray-400 line-through"
                            : "text-orange-900"
                        }`}
                      >
                        {prot.nombre}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {item.extras && (
              <section>
                <p className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">
                  Extras
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.extras.map((extra) => (
                    <div
                      key={extra.id}
                      className="flex items-center gap-2 bg-blue-50/30 p-2 rounded-xl border border-blue-100"
                    >
                      <button
                        onClick={() =>
                          actualizarSubItem(
                            item.id,
                            "extras",
                            extra.id,
                            "agotada",
                            !extra.agotada
                          )
                        }
                        className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${
                          extra.agotada
                            ? "bg-red-100 text-red-600"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {extra.agotada ? "✕" : "✓"}
                      </button>

                      <p
                        className={`flex-1 text-[11px] font-bold ${
                          extra.agotada
                            ? "text-gray-400 line-through"
                            : "text-blue-900"
                        }`}
                      >
                        {extra.nombre}
                      </p>

                      <input
                        type="number"
                        defaultValue={extra.precio}
                        onBlur={(eVal) =>
                          actualizarSubItem(
                            item.id,
                            "extras",
                            extra.id,
                            "precio",
                            Number(eVal.target.value)
                          )
                        }
                        className="w-12 bg-white border border-blue-100 p-1 rounded text-[11px] font-black text-blue-900 text-center"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-12 font-sans">
      <header className="mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Consola Morchis
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Gestión de pedidos, precios e inventario
            </p>
          </div>

          <button
            onClick={cerrarAdmin}
            className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-gray-800 transition-all"
          >
            Salir
          </button>
        </div>

        <nav className="grid grid-cols-2 gap-2 mt-5 bg-gray-100 p-1 rounded-2xl">
          <button
            onClick={() => setSeccionActiva("pedidos")}
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              seccionActiva === "pedidos"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Pedidos
          </button>

          <button
            onClick={() => setSeccionActiva("menu")}
            className={`py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              seccionActiva === "menu"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            }`}
          >
            Menú
          </button>
        </nav>
      </header>

      {seccionActiva === "pedidos" ? renderPedidos() : renderMenu()}
    </div>
  );
}