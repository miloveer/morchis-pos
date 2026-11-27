import { useId, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { completarMenuNoche } from "../../config/menuNoche";
import { productosDesayuno } from "../../config/menuDesayunos";
import { ESTILOS_PAN, RELLENOS_PAN, PRODUCTOS_PAN, prepararMenuPanes, preciosDelPan, panDisponibleEnMenu, indiceExtrasMenu } from "../../config/panes";
import { clavePrecio, DOCUMENTO_PRECIOS } from "../../config/preciosEditables";
import { claveExtraCompartido, precioExtraCompartido } from "../../config/extrasCompartidos";
import usePreciosMenu from "../../hooks/usePreciosMenu";

function PrecioFila({ etiqueta, valor, guardar }) {
  const id = useId();
  const [estado, setEstado] = useState("");
  async function enviar(evento) {
    evento.preventDefault();
    const entrada = new FormData(evento.currentTarget).get("precio").trim();
    const numero = entrada === "" ? null : Number(entrada);
    if (numero !== null && (!Number.isFinite(numero) || numero < 0)) {
      setEstado("Ingresa un precio válido.");
      return;
    }
    setEstado("Guardando…");
    try {
      await guardar(numero);
      setEstado("Guardado");
    } catch {
      setEstado("No se pudo guardar.");
    }
  }
  return (
    <form onSubmit={enviar} className="ops-price-row">
      <label htmlFor={id} className="font-semibold">{etiqueta}</label>
      <input id={id} key={valor} name="precio" type="number" min="0" step="0.01" inputMode="decimal"
        defaultValue={valor ?? ""} placeholder="Pendiente" className="ops-field" />
      <button disabled={estado === "Guardando…"} className="ops-action">Guardar</button>
      {estado && <p role="status" className="w-full text-right text-xs text-gray-600">{estado}</p>}
    </form>
  );
}

export default function PreciosMenuPanel({ menuData }) {
  const { precios, cargando, error, reintentar } = usePreciosMenu();
  const [aviso, setAviso] = useState("");
  const guardar = (clave, valor) => setDoc(doc(db, "catalogos", DOCUMENTO_PRECIOS), {
    precios: { [clave]: valor },
  }, { merge: true });

  async function cambiarDisponibilidad(tipo, activo) {
    try {
      await guardar(clavePrecio("pan", tipo, "activo"), activo);
      setAviso(activo ? "Activado. Se mostrará cuando todos sus precios estén completos." : "Configurador desactivado.");
    } catch {
      setAviso("No se pudo guardar la disponibilidad.");
    }
  }

  const idsDeDesayuno = new Set(productosDesayuno().map(({ id }) => id));
  const nuevos = productosDesayuno().filter(({ id }) => !menuData.some((producto) => producto.id === id));
  const productos = [...completarMenuNoche(menuData), ...nuevos];
  const indiceExtras = indiceExtrasMenu(productos);
  const extrasCompartidos = [...indiceExtras.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  const catalogo = prepararMenuPanes(productos, precios)
    .filter(({ id }) => idsDeDesayuno.has(id) || id === "sincronizadas" || id.startsWith("cafe_"));

  return (
    <section className="ops-panel">
      <h2 className="font-black text-gray-950">Precios del nuevo menú</h2>
      <p className="ops-hint">Importes en MXN. Si guardas un campo vacío, queda como precio pendiente.</p>
      {cargando ? <p role="status">Cargando precios…</p> : error ? (
        <div className="ops-error" role="alert">
          <p className="font-extrabold">No se pudieron cargar los precios</p>
          <p>{error}</p>
          <button type="button" className="ops-action mt-3" onClick={reintentar}>Reintentar</button>
        </div>
      ) : (
        <div className="ops-grid">
          <details className="ops-tile">
            <summary className="cursor-pointer font-bold">Extras compartidos</summary>
            <p className="ops-hint">Captura una vez el precio de cada porción. Aplica a los platillos que ofrecen ese extra.</p>
            {extrasCompartidos.map(({ id, nombre, claves }) => (
              <PrecioFila key={id} etiqueta={nombre} valor={precioExtraCompartido(precios, id, null, claves)}
                guardar={(valor) => guardar(claveExtraCompartido(id), valor)} />
            ))}
          </details>
          {Object.entries(PRODUCTOS_PAN).map(([tipo, producto]) => {
            const tabla = preciosDelPan(tipo, precios, indiceExtras);
            return (
              <details key={tipo} className="ops-tile">
                <summary className="cursor-pointer font-bold">{producto.nombre}</summary>
                {[["base", "Relleno base", RELLENOS_PAN], ["estilo", "Recargo de estilo", ESTILOS_PAN]].map(([grupo, titulo, opciones]) => (
                  <div key={grupo} className="mt-3">
                    <h3 className="text-xs font-black uppercase text-gray-700">{titulo}</h3>
                    {opciones.filter(({ id }) => grupo !== "estilo" || id !== "sencilla").map(({ id, nombre }) => (
                      <PrecioFila key={id} etiqueta={nombre} valor={tabla[grupo][id]}
                        guardar={(valor) => guardar(clavePrecio("pan", tipo, grupo, id), valor)} />
                    ))}
                  </div>
                ))}
                <label className="mt-4 flex min-h-11 items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={tabla.publicar}
                    onChange={(evento) => cambiarDisponibilidad(tipo, evento.target.checked)} />
                  Activar configurador en el menú de clientes cuando tenga todos sus precios
                </label>
                <p className="text-xs text-gray-600">{panDisponibleEnMenu(tipo, precios, indiceExtras) ? "Configurador listo" : "Configurador en vista previa"}</p>
              </details>
            );
          })}
          {catalogo.map(({ id, nombre, variantes }) => (
            <details key={id} className="ops-tile">
              <summary className="cursor-pointer font-bold">{nombre}</summary>
              {variantes.map((variante) => (
                <PrecioFila key={variante.id} etiqueta={variante.nombre} valor={variante.precioBase}
                  guardar={(valor) => guardar(clavePrecio(id, variante.id), valor)} />
              ))}
            </details>
          ))}
          {aviso && <p role="status" className="text-sm">{aviso}</p>}
        </div>
      )}
    </section>
  );
}
