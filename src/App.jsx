import { useState, useEffect } from 'react';
import { 
  menuData, removiblesGlobales, saboresSoda, 
  sazonadoresPapas, removiblesPapas, listaSalsasAlitas 
} from './data/menu';

// ==========================================
// CONFIGURACIÓN DE NEGOCIO
// ==========================================
const TELEFONO_MORCHIS = "5641375355"; 
const COSTO_ENVIO_DOMICILIO = 10;
const HORA_APERTURA = 16; // 4 PM
const HORA_CIERRE = 23; // 11 PM



function ImageWithSkeleton({ src, alt }) {
  const [cargado, setCargado] = useState(false);
  return (
    <div className="relative w-full h-full bg-gray-200">
      {!cargado && <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${cargado ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setCargado(true)}
      />
    </div>
  );
}

export default function App() {
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const [carrito, setCarrito] = useState(() => {
    const guardado = localStorage.getItem('morchis_carrito');
    return guardado ? JSON.parse(guardado) : [];
  });

  useEffect(() => {
    localStorage.setItem('morchis_carrito', JSON.stringify(carrito));
  }, [carrito]);

  // Estados del Cliente
  const [nombreCliente, setNombreCliente] = useState('');
  const [tipoEntrega, setTipoEntrega] = useState('recoger'); // 'recoger' | 'domicilio' | 'sucursal'
  const [direccion, setDireccion] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo'); 
  const [billete, setBillete] = useState('');

  const horaActual = new Date().getHours();
  let estadoLocal = "CERRADO";
  let colorEstado = "bg-red-100 text-red-700 border border-red-200";
  const estaAbierto = horaActual >= HORA_APERTURA && horaActual < HORA_CIERRE;

  if (estaAbierto) {
    if (horaActual === HORA_CIERRE - 1) {
      estadoLocal = "CERRAMOS PRONTO";
      colorEstado = "bg-orange-100 text-orange-700 border border-orange-300";
    } else {
      estadoLocal = "ABIERTO";
      colorEstado = "bg-green-100 text-green-700 border border-green-300";
    }
  }


  const mostrarToast = (mensaje) => {
    setToastMsg(mensaje);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const agregarAlCarrito = (nuevoItem) => {
    setCarrito([...carrito, { ...nuevoItem, idUnico: Date.now() }]);
    mostrarToast(`${nuevoItem.cantidad}x ${nuevoItem.nombreProducto} agregado`);
  };

  const quitarDelCarrito = (idUnico) => {
    const nuevoCarrito = carrito.filter(item => item.idUnico !== idUnico);
    setCarrito(nuevoCarrito);
    if (nuevoCarrito.length === 0) setMostrarCarrito(false);
  };

  const totalArticulos = carrito.reduce((sum, item) => sum + item.cantidad, 0);
  const totalProductos = carrito.reduce((sum, item) => sum + (item.totalItem * item.cantidad), 0);
  
  const costoEnvioReal = tipoEntrega === 'domicilio' ? COSTO_ENVIO_DOMICILIO : 0;
  const totalPagar = totalProductos + costoEnvioReal;

  const enviarAWhatsApp = () => {
    if (!nombreCliente.trim()) return alert('Por favor, ingresa tu nombre.');
    if (tipoEntrega === 'domicilio' && !direccion.trim()) return alert('Ingresa tu dirección de entrega.');

    let mensaje = "*NUEVO PEDIDO MORCHIS*\n\n";
    mensaje += `*CLIENTE:* ${nombreCliente.trim()}\n`;
    
    if (tipoEntrega === 'domicilio') {
      mensaje += `*ENTREGA:* A domicilio (+$10)\n`;
      mensaje += `*DIRECCIÓN:* ${direccion.trim()}\n`;
    } else if (tipoEntrega === 'sucursal') {
      mensaje += `*ENTREGA:* Comer en Sucursal\n`;
    } else {
      mensaje += `*ENTREGA:* Paso a recoger\n`;
    }

    mensaje += `*PAGO:* ${metodoPago === 'efectivo' ? 'Efectivo' : 'Transferencia'}\n`;
    if (metodoPago === 'efectivo') mensaje += `*BILLETE:* $${billete || 'Exacto'}\n\n`;
    
    mensaje += `*--- MI ORDEN ---*\n\n`;

    carrito.forEach(item => {
      mensaje += `* ${item.cantidad}x ${item.nombreProducto} (${item.variante})\n`;
      
      if  (item.proteina) mensaje += `  > Carne: ${item.proteina}\n`;
      if (item.removibles && item.removibles.length > 0) mensaje += `  > Sin: ${item.removibles.join(', ')}\n`;
      if (item.opcionObligatoria) mensaje += `  > Selección: ${item.opcionObligatoria}\n`;
      if (item.salsas && item.salsas.length > 0) mensaje += `  > Salsas: ${item.salsas.join(', ')}\n`;
      if (item.combo && !item.combo.includes('Solo')) {
        mensaje += `  > ${item.combo}\n`;
        if (item.saborSoda) mensaje += `    - Sabor: ${item.saborSoda}\n`;
      }
      if (item.detallesPapas) {
        mensaje += `  > Papas: ${item.detallesPapas.sazonador}\n`;
        if (item.detallesPapas.sin.length > 0) mensaje += `    - Sin papas: ${item.detallesPapas.sin.join(', ')}\n`;
      }
      if (item.extras && item.extras.length > 0) mensaje += `  > Extras: ${item.extras.map(e => e.nombre).join(', ')}\n`;
      
      if (item.notas) mensaje += `  > Notas cocina: ${item.notas}\n`;
      mensaje += `\n`;
    });

    mensaje += `*TOTAL A PAGAR: $${totalPagar}*\n\n`;
    mensaje += "¿Me confirman cuando mi pedido esté listo? Gracias.";

    localStorage.removeItem('morchis_carrito');
    setCarrito([]);
    const url = `https://wa.me/${TELEFONO_MORCHIS}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] pb-28 text-gray-900">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 p-4 sticky top-0 z-20">
        <div className="flex justify-between items-center max-w-lg mx-auto">
          <div className="h-10 flex items-center gap-2">
            <img 
              src="/img/logoicon.png" 
              alt="Logo Temporal" 
              className="h-full object-contain"
            />
            <h1 className="text-xl font-black tracking-tighter text-gray-900 uppercase">Morchis</h1>
          </div>
          <div className="text-right">
            <span className={`${colorEstado} px-3 py-1.5 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-wider`}>
              {estadoLocal}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto pt-6 px-4 pb-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {menuData.map((categoria) => (
            <div 
              key={categoria.id} 
              id={categoria.id}
              onClick={() => setProductoSeleccionado(categoria)}
              className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden cursor-pointer hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95 flex flex-col group"
            >
              <div className="h-28 sm:h-32 w-full overflow-hidden">
                <ImageWithSkeleton src={categoria.imagen} alt={categoria.nombre} />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between items-center text-center">
                <h3 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">{categoria.nombre}</h3>
                <span className="text-[10px] sm:text-xs text-orange-600 font-bold mt-2 bg-orange-50 px-2 py-1 rounded-md">Ver opciones</span>
              </div>
            </div>
          ))}
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
        />
      )}

      {carrito.length > 0 && !mostrarCarrito && !productoSeleccionado && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-lg mx-auto flex justify-between items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{totalArticulos} artículos</p>
              <p className="font-black text-xl text-gray-900">${totalProductos} <span className="text-sm font-medium">MXN</span></p>
            </div>
            <button onClick={() => setMostrarCarrito(true)} className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-sm">
              Ver Orden
            </button>
          </div>
        </div>
      )}

      {mostrarCarrito && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col overflow-hidden animate-fade-in">
          <header className="bg-white p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
            <h2 className="text-xl font-black text-gray-900 tracking-tight">Checkout</h2>
            <button onClick={() => setMostrarCarrito(false)} className="text-gray-900 font-bold text-sm bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">Volver</button>
          </header>

          <div className="flex-1 overflow-y-auto p-4 max-w-lg mx-auto w-full space-y-6">
            {carrito.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-bold text-gray-900">Tu orden está vacía</h3>
                <button onClick={() => setMostrarCarrito(false)} className="mt-6 bg-gray-900 text-white font-bold px-6 py-3 rounded-lg text-sm">Regresar al menú</button>
              </div>
            ) : (
              <>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 tracking-tight">Resumen de Orden</h3>
                  {carrito.map(item => (
                    <div key={item.idUnico} className="py-3 flex justify-between items-start border-b border-gray-50 last:border-0 last:pb-0">
                      <div className="flex-1 pr-4">
                        <p className="font-bold text-gray-900 text-sm">{item.cantidad}x {item.nombreProducto}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.variante}</p>
                        {item.proteina && <p className="text-xs text-gray-500 mt-0.5">Carne: {item.proteina}</p>}
                        <p className="text-sm font-bold text-gray-900 mt-1">${item.totalItem * item.cantidad}</p>
                      </div>
                      <button onClick={() => quitarDelCarrito(item.idUnico)} className="text-gray-400 hover:text-red-500 font-bold text-xs underline transition-colors">Quitar</button>
                    </div>
                  ))}
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                  <h3 className="font-bold text-gray-900 tracking-tight">Detalles de Entrega</h3>
                  
                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">Nombre completo *</label>
                    <input type="text" value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} placeholder="¿A nombre de quién?" className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium text-[16px]" />
                  </div>

                  <div>
                    <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">Tipo de entrega</label>
                    <div className="flex gap-2">
                      <button onClick={() => setTipoEntrega('recoger')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === 'recoger' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Recoger</button>
                      <button onClick={() => setTipoEntrega('sucursal')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === 'sucursal' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>En Mesa</button>
                      <button onClick={() => setTipoEntrega('domicilio')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${tipoEntrega === 'domicilio' ? 'bg-gray-900 border-gray-900 text-white' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Domicilio</button>
                    </div>
                  </div>

                  {tipoEntrega === 'domicilio' && (
                    <div className="animate-fade-in mt-4">
                      <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">Dirección completa *</label>
                      <textarea value={direccion} onChange={(e) => setDireccion(e.target.value)} placeholder="Calle, Número, Referencias..." className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors resize-none font-medium text-[16px]" rows="2"></textarea>
                    </div>
                  )}

                  <div className="border-t border-gray-100 pt-6">
                    <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">Método de pago</label>
                    <div className="flex gap-2">
                      <button onClick={() => setMetodoPago('efectivo')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${metodoPago === 'efectivo' ? 'bg-white border-orange-600 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Efectivo</button>
                      <button onClick={() => setMetodoPago('transferencia')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${metodoPago === 'transferencia' ? 'bg-white border-orange-600 text-orange-600' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>Transferencia</button>
                    </div>
                  </div>

                  {metodoPago === 'efectivo' && (
                    <div className="animate-fade-in">
                      <label className="font-bold text-xs uppercase tracking-wider text-gray-500 mb-2 block">Cambio (Monto del billete)</label>
                      <input type="number" placeholder="Ej. 500" value={billete} onChange={(e) => setBillete(e.target.value)} className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-900 focus:bg-white transition-colors font-medium text-[16px]" />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {carrito.length > 0 && (
            <div className="bg-white p-5 border-t border-gray-100 pb-8">
              <div className="max-w-lg mx-auto">
                <div className="flex justify-between text-gray-500 mb-2 text-sm">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">${totalProductos}</span>
                </div>
                {tipoEntrega === 'domicilio' && (
                  <div className="flex justify-between text-gray-500 mb-4 text-sm">
                    <span>Costo de envío:</span>
                    <span className="font-medium text-gray-900">${COSTO_ENVIO_DOMICILIO}</span>
                  </div>
                )}
                <div className="flex justify-between mb-5 border-t border-gray-100 pt-4">
                  <span className="font-black text-gray-900 text-lg tracking-tight">Total a pagar</span>
                  <span className="font-black text-2xl text-gray-900">${totalPagar}</span>
                </div>
                
                {estaAbierto ? (
                  <button onClick={enviarAWhatsApp} className="w-full bg-orange-600 text-white p-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition-all flex justify-center items-center gap-2">
                    Enviar Orden
                  </button>
                ) : (
                  <button disabled className="w-full bg-gray-200 text-gray-400 p-4 rounded-xl font-bold text-lg cursor-not-allowed">
                    Fuera de horario
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ModalPersonalizacion({ producto, cerrar, agregarAlCarrito }) {
  const [varianteIndex, setVarianteIndex] = useState(0);
  const [comboIndex, setComboIndex] = useState(0);
  const [opcionObligatoria, setOpcionObligatoria] = useState(producto.opcionObligatoria ? producto.opcionObligatoria.opciones[0] : '');
  
  // Estado para la proteína (res o pollo)
  const [proteina, setProteina] = useState(producto.opcionProteina ? producto.opcionProteina[0] : '');

  const [salsasSeleccionadas, setSalsasSeleccionadas] = useState([]);
  const [saborSoda, setSaborSoda] = useState(saboresSoda[0]);
  const [sazonadorPapas, setSazonadorPapas] = useState(sazonadoresPapas[0]);
  const [removiblesPapasSeleccionados, setRemoviblesPapasSeleccionados] = useState([]);
  
  const [removibles, setRemovibles] = useState([]);
  const [extrasSeleccionados, setExtrasSeleccionados] = useState([]);
  const [notas, setNotas] = useState('');
  const [cantidadItem, setCantidadItem] = useState(1);

  const [quesoVariante, setQuesoVariante] =useState('');

  const varianteActual = producto.variantes[varianteIndex];
  const comboActual = producto.combos ? producto.combos[comboIndex] : null;
  const totalExtras = extrasSeleccionados.reduce((sum, extra) => sum + extra.precio, 0);
  
  const precioUnitario = varianteActual.precioBase + (comboActual ? comboActual.precioExtra : 0) + totalExtras;
  const totalFinal = precioUnitario * cantidadItem;

  const handleAgregar = () => {
    if (producto.maxSalsas && salsasSeleccionadas.length === 0) return alert('Selecciona al menos una salsa.');
    if (varianteActual.opcionesQueso && !quesoVariante) return alert('Selecciona una opción de queso.');
    const requiereProteina = producto.opcionProteina && !varianteActual.nombre.toLowerCase().includes('chicken');

    const itemParaCarrito = {
      nombreProducto: producto.nombre,
      variante: varianteActual.opcionesQueso ? `${varianteActual.nombre} (${quesoVariante})` : varianteActual.nombre,
      proteina: requiereProteina ? proteina : null,
      combo: comboActual ? comboActual.nombre : null,
      opcionObligatoria: producto.opcionObligatoria ? opcionObligatoria : null,
      salsas: salsasSeleccionadas,
      saborSoda: (comboActual && comboActual.incluyeSoda) ? saborSoda : null,
      detallesPapas: ((comboActual && comboActual.incluyePapas) || producto.esProductoPapas) ? { sazonador: sazonadorPapas, sin: removiblesPapasSeleccionados } : null,
      extras: extrasSeleccionados,
      removibles: removibles,
      notas: notas,
      totalItem: precioUnitario,
      cantidad: cantidadItem
    };
    agregarAlCarrito(itemParaCarrito);
    cerrar(); 
  };

  const toggleSalsa = (salsa) => setSalsasSeleccionadas(prev => { if (prev.includes(salsa)) return prev.filter(s => s !== salsa); if (prev.length >= producto.maxSalsas) return prev; return [...prev, salsa]; });
  const toggleArray = (item, setter) => setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  const mostrarProteina = producto.opcionProteina && !varianteActual.nombre.toLowerCase().includes('chicken');

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-0 sm:p-4 sm:items-center animate-fade-in">
      <div className="bg-white w-full max-w-md h-[92vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl flex flex-col overflow-hidden">
        
        <div className="relative h-48 sm:h-56 bg-gray-900 shrink-0">
          <img src={producto.imagen} alt={producto.nombre} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-linear-to-t from-black/95 via-black/40 to-transparent z-0"></div>
          <button onClick={cerrar} className="absolute top-4 right-4 bg-white/20 backdrop-blur-md text-white hover:bg-white/40 w-10 h-10 rounded-full font-bold shadow-sm transition-colors flex items-center justify-center text-sm z-10">✕</button>
          <h2 className="absolute bottom-5 left-5 text-5xl sm:text-6xl font-black text-white drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] tracking-tighter z-10 leading-none uppercase">
            {producto.nombre}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-7 bg-white">
          
          <section>
            <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">Elige tu opción <span className="text-orange-500">*</span></h3>
            {/* AQUI ESTÁ EL CAMBIO: Regresamos a grid-cols-2 */}
            <div className="grid grid-cols-2 gap-2">
              {producto.variantes.map((variante, index) => (
                <label key={variante.id} className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all w-full text-left ${varianteIndex === index ? 'border-gray-900 bg-gray-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                  <div className="flex items-start gap-2 w-full">
                    <input type="radio" checked={varianteIndex === index} onChange={() => setVarianteIndex(index)} className="w-4 h-4 mt-0.5 text-gray-900 accent-gray-900 shrink-0" />
                    <div className="flex-1">
                      <span className="font-black text-gray-900 text-sm block leading-tight">{variante.nombre}</span>
                      
                      {/* La descripción se hace más pequeña para que quepa bien en 2 columnas */}
                      {variante.descripcion && (
                        <span className="text-gray-500 text-[10px] mt-1 mb-1 block leading-tight">{variante.descripcion}</span>
                      )}
                      
                      <span className="text-orange-600 font-bold text-xs mt-1 block">${variante.precioBase}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {mostrarProteina && (
            <section className="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-fade-in">
              <h3 className="font-bold text-orange-900 mb-3 text-xs tracking-wider uppercase">Tipo de Carne <span className="text-orange-500">*</span></h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.opcionProteina.map(prot => (
                  <button 
                    key={prot} 
                    onClick={() => setProteina(prot)}
                    className={`p-3 rounded-xl text-sm font-bold border transition-all text-left leading-tight ${proteina === prot ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {prot}
                  </button>
                ))}
              </div>
            </section>
          )}
          {/* NUEVA SECCIÓN CONDICIONAL: TIPO DE QUESO */}
          {varianteActual.opcionesQueso && (
            <section className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 animate-fade-in">
              <h3 className="font-bold text-yellow-900 mb-3 text-xs tracking-wider uppercase">Elige tu Queso <span className="text-orange-500">*</span></h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {varianteActual.opcionesQueso.map(queso => (
                  <button 
                    key={queso} 
                    onClick={() => setQuesoVariante(queso)}
                    className={`p-3 rounded-xl text-sm font-bold border transition-all text-left leading-tight ${quesoVariante === queso ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}
                  >
                    {queso}
                  </button>
                ))}
              </div>
            </section>
          )}

          {producto.opcionObligatoria && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">{producto.opcionObligatoria.titulo} <span className="text-orange-500">*</span></h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.opcionObligatoria.opciones.map(opt => (
                  <button key={opt} onClick={() => setOpcionObligatoria(opt)} className={`p-3 rounded-xl text-sm font-bold border transition-all text-left ${opcionObligatoria === opt ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                    {opt}
                  </button>
                ))}
              </div>
            </section>
          )}

          {(producto.usaRemoviblesGlobales || producto.removiblesEspecificos) && (
            <section className="border-t border-gray-100 pt-6">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">¿Deseas quitar algo?</h3>
              <div className="grid grid-cols-2 gap-2">
                {(producto.removiblesEspecificos || removiblesGlobales).map(item => {
                  const isChecked = removibles.includes(item);
                  return (
                    <label key={item} className={`flex items-center gap-2 p-2.5 border rounded-lg cursor-pointer transition-colors text-left ${isChecked ? 'border-gray-400 bg-gray-100' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleArray(item, setRemovibles)} className="w-4 h-4 shrink-0 rounded text-gray-600 accent-gray-600" />
                      <span className={`text-xs font-bold leading-tight ${isChecked ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{item}</span>
                    </label>
                  )
                })}
              </div>
            </section>
          )}

          {producto.maxSalsas && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1 text-xs tracking-wider uppercase">Tus Salsas <span className="text-orange-500">*</span></h3>
              <p className="text-xs text-gray-500 mb-4">Máximo {producto.maxSalsas} opciones</p>
              <div className="grid grid-cols-2 gap-2">
                {listaSalsasAlitas.map(salsa => {
                  const isChecked = salsasSeleccionadas.includes(salsa);
                  const isDisabled = !isChecked && salsasSeleccionadas.length >= producto.maxSalsas;
                  return (
                    <label key={salsa} className={`flex items-center gap-2 p-3 bg-white rounded-lg border transition-all text-left ${isDisabled ? 'opacity-50' : 'cursor-pointer'} ${isChecked ? 'border-gray-900' : 'border-gray-200'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleSalsa(salsa)} disabled={isDisabled} className="w-4 h-4 shrink-0 rounded text-gray-900 accent-gray-900" />
                      <span className="text-xs font-bold text-gray-800 leading-tight">{salsa}</span>
                    </label>
                  );
                })}
              </div>
            </section>
          )}

          {producto.extras && producto.extras.length > 0 && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">Extras</h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.extras.map(extra => {
                  const isChecked = extrasSeleccionados.some(e => e.id === extra.id);
                  return (
                    <label key={extra.id} className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all text-left ${isChecked ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-start gap-2 w-full">
                        <input type="checkbox" checked={isChecked} onChange={() => toggleArray(extra, setExtrasSeleccionados)} className="w-4 h-4 mt-0.5 shrink-0 rounded text-gray-900 accent-gray-900" />
                        <div className="flex-1">
                          <span className="font-bold text-gray-900 text-sm block leading-tight">{extra.nombre}</span>
                          <span className="text-gray-500 font-medium text-xs mt-1 block">+${extra.precio}</span>
                        </div>
                      </div>
                    </label>
                  )
                })}
              </div>
            </section>
          )}

          {producto.combos && producto.combos.length > 1 && (
            <section>
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">Hazlo Combo</h3>
              <div className="grid grid-cols-2 gap-2">
                {producto.combos.map((combo, index) => (
                  <label key={combo.id} className={`flex flex-col p-3 border rounded-xl cursor-pointer transition-all text-left ${comboIndex === index ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="flex items-start gap-2 w-full">
                      <input type="radio" checked={comboIndex === index} onChange={() => setComboIndex(index)} className="w-4 h-4 mt-0.5 shrink-0 text-gray-900 accent-gray-900" />
                      <div className="flex-1">
                        <span className="font-bold text-gray-900 text-sm block leading-tight">{combo.nombre}</span>
                        {combo.precioExtra > 0 ? (
                          <span className="text-gray-500 font-medium text-xs mt-1 block">+${combo.precioExtra}</span>
                        ) : (
                          <span className="text-gray-500 font-medium text-xs mt-1 block">Incluido</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          )}

          {comboActual && comboActual.incluyeSoda && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">Sabor de Soda</h3>
              <div className="grid grid-cols-2 gap-2">
                {saboresSoda.map(sabor => (
                  <button key={sabor} onClick={() => setSaborSoda(sabor)} className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left leading-tight ${saborSoda === sabor ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                    {sabor}
                  </button>
                ))}
              </div>
            </section>
          )}

          {((comboActual && comboActual.incluyePapas) || producto.esProductoPapas) && (
            <section className="bg-gray-50 p-4 rounded-xl border border-gray-100 animate-fade-in">
              <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">Preparación Papas</h3>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {sazonadoresPapas.map(saz => (
                  <button key={saz} onClick={() => setSazonadorPapas(saz)} className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-left leading-tight ${sazonadorPapas === saz ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                    {saz}
                  </button>
                ))}
              </div>
              <h4 className="font-bold text-gray-900 mb-2 text-[10px] tracking-wider uppercase">¿Quitar Ingredientes?</h4>
              <div className="grid grid-cols-2 gap-2">
                {removiblesPapas.map(item => (
                  <label key={item} className="flex items-center gap-2 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer text-left">
                    <input type="checkbox" checked={removiblesPapasSeleccionados.includes(item)} onChange={() => toggleArray(item, setRemoviblesPapasSeleccionados)} className="w-4 h-4 shrink-0 rounded text-gray-900 accent-gray-900" />
                    <span className="text-xs font-medium text-gray-700 leading-tight">{item}</span>
                  </label>
                ))}
              </div>
            </section>
          )}

          <section className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-900 mb-3 text-xs tracking-wider uppercase">Notas adicionales</h3>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Ej. Bien doradas, mucha servilleta..." className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl resize-none outline-none focus:border-gray-900 focus:bg-white font-medium text-[16px] text-gray-900 transition-colors" rows="2"></textarea>
          </section>

        </div>

        <div className="p-4 bg-white border-t border-gray-100 shrink-0 pb-6 sm:pb-4 flex gap-3 items-center">
          <div className="flex items-center justify-between bg-gray-100 border border-gray-200 rounded-xl p-1 w-28 sm:w-32 shrink-0 h-14">
            <button onClick={() => setCantidadItem(Math.max(1, cantidadItem - 1))} className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95">-</button>
            <span className="font-black text-gray-900 text-lg">{cantidadItem}</span>
            <button onClick={() => setCantidadItem(cantidadItem + 1)} className="w-10 h-full flex items-center justify-center rounded-lg bg-white text-gray-900 font-black shadow-sm hover:bg-gray-50 transition-colors active:scale-95">+</button>
          </div>
          <button onClick={handleAgregar} className="flex-1 h-14 bg-gray-900 text-white px-5 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex justify-between items-center shadow-sm active:scale-95">
            <span>Agregar</span>
            <span>${totalFinal}</span>
          </button>
        </div>

      </div>
    </div>
  );
}