import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function AdminPanel({ menuData, cerrarAdmin }) {
  
  const toggleEstado = async (categoriaId, campo, valorActual) => {
    try {
      await updateDoc(doc(db, "menu", categoriaId), { [campo]: !valorActual });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const actualizarSubItem = async (categoriaId, arrayNombre, itemId, subCampo, nuevoValor) => {
    const categoria = menuData.find(m => m.id === categoriaId);
    const nuevoArray = categoria[arrayNombre].map(item => 
      (item.id === itemId || item.nombre === itemId) ? { ...item, [subCampo]: nuevoValor } : item
    );
    try {
      await updateDoc(doc(db, "menu", categoriaId), { [arrayNombre]: nuevoArray });
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-12 font-sans">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Consola Morchis</h1>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Gestión de Precios e Inventario</p>
        </div>
        <button onClick={cerrarAdmin} className="bg-gray-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md hover:bg-gray-800 transition-all">
          Salir
        </button>
      </header>

      <div className="space-y-6">
        {menuData.map(item => (
          <div key={item.id} className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            {/* CABECERA DE CATEGORÍA */}
            <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icono}</span>
                <h2 className="font-black text-gray-900 uppercase text-sm tracking-tighter">{item.nombre}</h2>
              </div>
              <button 
                onClick={() => toggleEstado(item.id, 'agotado', item.agotado)}
                className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider transition-all ${item.agotado ? 'bg-red-500 text-white shadow-red-200 shadow-lg' : 'bg-green-500 text-white shadow-green-200 shadow-lg'}`}
              >
                {item.agotado ? 'Categoría Agotada' : 'Categoría Activa'}
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* VARIANTES Y PRECIOS */}
              {item.variantes && (
                <section>
                  <p className="text-[10px] font-black text-gray-400 uppercase mb-3 tracking-widest">Variantes y Precios</p>
                  <div className="space-y-2">
                    {item.variantes.map(v => (
                      <div key={v.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-100 shadow-xs">
                        <button 
                          onClick={() => actualizarSubItem(item.id, 'variantes', v.id, 'agotada', v.agotada)}
                          className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs ${v.agotada ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                        >
                          {v.agotada ? '✕' : '✓'}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${v.agotada ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{v.nombre}</p>
                        </div>
                        <div className="flex items-center bg-gray-100 rounded-lg px-2">
                          <span className="text-xs font-bold text-gray-500">$</span>
                          <input 
                            type="number"
                            defaultValue={v.precioBase}
                            onBlur={(e) => actualizarSubItem(item.id, 'variantes', v.id, 'precioBase', Number(e.target.value))}
                            className="w-14 p-1.5 bg-transparent text-xs font-black text-gray-900 outline-none text-right"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* EXTRAS */}
              {item.extras && (
                <section>
                  <p className="text-[10px] font-black text-blue-400 uppercase mb-3 tracking-widest">Extras</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.extras.map(e => (
                      <div key={e.id} className="flex items-center gap-2 bg-blue-50/30 p-2 rounded-xl border border-blue-100">
                        <button 
                          onClick={() => actualizarSubItem(item.id, 'extras', e.id, 'agotada', e.agotada)}
                          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-[10px] ${e.agotada ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}
                        >
                          {e.agotada ? '✕' : '✓'}
                        </button>
                        <p className="flex-1 text-[11px] font-bold text-blue-900">{e.nombre}</p>
                        <input 
                          type="number"
                          defaultValue={e.precio}
                          onBlur={(eVal) => actualizarSubItem(item.id, 'extras', e.id, 'precio', Number(eVal.target.value))}
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
    </div>
  );
}