import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { NOMBRES_CATALOGOS } from "../../config/catalogos";

export default function CatalogosPanel({ catalogos }) {
  const guardar = async (id, opciones) => {
    await setDoc(doc(db, "catalogos", id), { opciones }, { merge: true });
  };

  const agregar = async (id) => {
    const nombre = window.prompt("Nombre del nuevo sabor u opción:")?.trim();
    if (!nombre) return;
    const actuales = catalogos[id] || [];
    if (actuales.some((item) => item.toLowerCase() === nombre.toLowerCase())) {
      return alert("Esa opción ya existe.");
    }
    try {
      await guardar(id, [...actuales, nombre]);
    } catch (error) {
      alert(`No se pudo agregar: ${error.message}`);
    }
  };

  const eliminar = async (id, nombre) => {
    if (!window.confirm(`¿Eliminar "${nombre}"?`)) return;
    try {
      await guardar(id, catalogos[id].filter((item) => item !== nombre));
    } catch (error) {
      alert(`No se pudo eliminar: ${error.message}`);
    }
  };

  return (
    <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-black text-gray-950">Catálogos de sabores</h2>
        <p className="text-xs text-gray-500">Los cambios aparecen de inmediato en el menú público.</p>
      </div>
      <div className="space-y-5">
        {Object.entries(NOMBRES_CATALOGOS).map(([id, titulo]) => (
          <div key={id} className="rounded-2xl bg-gray-50 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-xs font-black uppercase text-gray-700">{titulo}</h3>
              <button onClick={() => agregar(id)} className="shrink-0 rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-black text-white">+ AGREGAR</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(catalogos[id] || []).map((opcion) => (
                <span key={opcion} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-1 text-xs font-bold text-gray-700">
                  {opcion}
                  <button onClick={() => eliminar(id, opcion)} aria-label={`Eliminar ${opcion}`} className="grid h-6 w-6 place-items-center rounded-full bg-red-50 text-red-600">×</button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
