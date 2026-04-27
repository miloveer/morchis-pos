import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function AdminPanel({ menuData, cerrarAdmin }) {
  
  const toggleCategoria = async (id, estadoActual) => {
    const itemRef = doc(db, "menu", id);
    try { await updateDoc(itemRef, { agotado: !estadoActual }); } 
    catch (error) { alert("Error: " + error.message); }
  };

  const toggleProteina = async (categoriaId, proteinaNombre, opcionesActuales) => {
    const nuevasOpciones = opcionesActuales.map(p => p.nombre === proteinaNombre ? { ...p, agotada: !p.agotada } : p);
    try { await updateDoc(doc(db, "menu", categoriaId), { opcionProteina: nuevasOpciones }); } 
    catch (error) { alert("Error: " + error.message); }
  };

  // NUEVO: Función para encender/apagar una Variante (ej. Burger Chicken)
  const toggleVariante = async (categoriaId, varianteId, variantesActuales) => {
    const nuevasVariantes = variantesActuales.map(v => v.id === varianteId ? { ...v, agotada: !v.agotada } : v);
    try { await updateDoc(doc(db, "menu", categoriaId), { variantes: nuevasVariantes }); } 
    catch (error) { alert("Error: " + error.message); }
  };

  // NUEVO: Función para encender/apagar un Extra (ej. Tocino)
  const toggleExtra = async (categoriaId, extraId, extrasActuales) => {
    const nuevosExtras = extrasActuales.map(e => e.id === extraId ? { ...e, agotada: !e.agotada } : e);
    try { await updateDoc(doc(db, "menu", categoriaId), { extras: nuevosExtras }); } 
    catch (error) { alert("Error: " + error.message); }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10 font-sans">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Panel Morchis</h1>
          <p className="text-xs text-gray-500 font-bold uppercase">Control Granular de Inventario</p>
        </div>
        <button onClick={cerrarAdmin} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-800">
          Cerrar
        </button>
      </header>

      <div className="space-y-4">
        {menuData.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            
            {/* 1. Categoría Principal */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icono}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight uppercase tracking-wider">{item.nombre}</p>
                  <p className={`text-[10px] font-black uppercase mt-0.5 ${item.agotado ? 'text-red-500' : 'text-green-500'}`}>
                    {item.agotado ? 'Categoría Apagada' : 'Categoría Activa'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => toggleCategoria(item.id, item.agotado)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${item.agotado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                {item.agotado ? 'ACTIVAR TODO' : 'APAGAR TODO'}
              </button>
            </div>

            {/* 2. Variantes Específicas (Burgers, Jochos, etc.) */}
            {item.variantes && item.variantes.length > 0 && !item.agotado && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Variantes / Platillos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.variantes.map(variante => (
                    <div key={variante.id} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className={`text-xs font-bold leading-tight ${variante.agotada ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {variante.nombre}
                      </span>
                      <button 
                        onClick={() => toggleVariante(item.id, variante.id, item.variantes)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase ml-2 ${variante.agotada ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      >
                        {variante.agotada ? 'Activar' : 'Agotar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Tipos de Carne (Opcional) */}
            {item.opcionProteina && !item.agotado && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tipos de carne</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.opcionProteina.map(prot => (
                    <div key={prot.nombre} className="flex justify-between items-center bg-orange-50 p-2.5 rounded-lg border border-orange-100">
                      <span className={`text-xs font-bold ${prot.agotada ? 'text-orange-300 line-through' : 'text-orange-900'}`}>
                        {prot.nombre}
                      </span>
                      <button 
                        onClick={() => toggleProteina(item.id, prot.nombre, item.opcionProteina)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase ml-2 ${prot.agotada ? 'bg-white text-orange-700 border border-orange-200' : 'bg-orange-200 text-orange-800'}`}
                      >
                        {prot.agotada ? 'Activar' : 'Agotar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Extras (Tocino, Piña, etc.) */}
            {item.extras && item.extras.length > 0 && !item.agotado && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Extras Adicionales</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {item.extras.map(extra => (
                    <div key={extra.id} className="flex justify-between items-center bg-blue-50 p-2.5 rounded-lg border border-blue-100">
                      <span className={`text-xs font-bold ${extra.agotada ? 'text-blue-300 line-through' : 'text-blue-900'}`}>
                        {extra.nombre}
                      </span>
                      <button 
                        onClick={() => toggleExtra(item.id, extra.id, item.extras)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase ml-2 ${extra.agotada ? 'bg-white text-blue-700 border border-blue-200' : 'bg-blue-200 text-blue-800'}`}
                      >
                        {extra.agotada ? 'Activar' : 'Agotar'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}