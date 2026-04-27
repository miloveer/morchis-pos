import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export default function AdminPanel({ menuData, cerrarAdmin }) {
  
  // Función para apagar/encender todo un producto (ej. Jochos)
  const toggleCategoria = async (id, estadoActual) => {
    const itemRef = doc(db, "menu", id);
    try {
      await updateDoc(itemRef, { agotado: !estadoActual });
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  };

  // Función para apagar/encender solo una carne (ej. Res)
  const toggleProteina = async (categoriaId, proteinaNombre, opcionesActuales) => {
    // Creamos una nueva lista de proteínas cambiando solo la que tocaste
    const nuevasOpciones = opcionesActuales.map(p => 
      p.nombre === proteinaNombre ? { ...p, agotada: !p.agotada } : p
    );
    
    const itemRef = doc(db, "menu", categoriaId);
    try {
      await updateDoc(itemRef, { opcionProteina: nuevasOpciones });
    } catch (error) {
      alert("Error al actualizar la carne: " + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 pb-10 font-sans">
      <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">Panel Morchis</h1>
          <p className="text-xs text-gray-500 font-bold uppercase">Control de Inventario</p>
        </div>
        <button 
          onClick={cerrarAdmin} 
          className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-800"
        >
          Cerrar
        </button>
      </header>

      <div className="space-y-3">
        {menuData.map(item => (
          <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            
            {/* CATEGORÍA PRINCIPAL */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{item.icono}</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm leading-tight">{item.nombre}</p>
                  <p className={`text-[10px] font-black uppercase mt-0.5 ${item.agotado ? 'text-red-500' : 'text-green-500'}`}>
                    {item.agotado ? 'Agotado' : 'Disponible'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => toggleCategoria(item.id, item.agotado)}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-colors ${item.agotado ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
              >
                {item.agotado ? 'ACTIVAR' : 'APAGAR'}
              </button>
            </div>

            {/* SUB-SECCIÓN DE PROTEÍNAS (Si tiene carnes, mostramos botones extra) */}
            {item.opcionProteina && (
              <div className="mt-4 pt-3 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Tipos de carne</p>
                <div className="space-y-2">
                  {item.opcionProteina.map(prot => (
                    <div key={prot.nombre} className="flex justify-between items-center bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                      <span className={`text-xs font-bold ${prot.agotada ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {prot.nombre}
                      </span>
                      <button 
                        onClick={() => toggleProteina(item.id, prot.nombre, item.opcionProteina)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase ${prot.agotada ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-700'}`}
                      >
                        {prot.agotada ? 'Activar' : 'Agotar'}
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