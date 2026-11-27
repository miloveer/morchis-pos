import FotoProducto from "./FotoProducto";
import { useState } from "react";
import { gruposPorTipo } from "../config/tipoMenu";
import { descripcionDeTarjeta } from "../config/textosTarjetas";
import "../styles/tarjetasMenu.css";

function distintivo(producto) {
  if (producto.etiquetaTarjeta) return producto.etiquetaTarjeta;
  const variantes = producto.variantes?.filter((variante) => !variante.agotada && !variante.chickenBaseId) ?? [];
  if (variantes.length === 0) return "";
  const piezas = variantes.map(({ nombre }) => nombre?.match(/^(\d+)\s*(?:piezas|pzas\.?|pz\.?)$/i)?.[1]);
  if (piezas.every(Boolean)) return `${piezas.join(" / ")} pzas`;
  return variantes.length === 1 ? "1 opción" : `${variantes.length} opciones`;
}

function TarjetasMenu({ productos, onSeleccionar }) {
  return (
      <div className="morchis-tarjetas">
        {[...productos].sort((a, b) => Number(Boolean(a.agotado)) - Number(Boolean(b.agotado))).map((producto) => {
          const agotado = Boolean(producto.agotado);
          const etiqueta = agotado ? "Agotado" : distintivo(producto);
          const descripcion = descripcionDeTarjeta(producto);
          return (
            <button key={producto.id} id={producto.id} type="button" disabled={agotado}
              className="morchis-tarjeta" onClick={() => onSeleccionar(producto)}>
              <FotoProducto producto={producto} />
              {etiqueta && <span className="morchis-tarjeta-etiqueta">{etiqueta}</span>}
              <span className="morchis-tarjeta-contenido">
                <span className="morchis-tarjeta-texto">
                  <span className="morchis-tarjeta-nombre">{producto.nombre}</span>
                  {descripcion && <span className="morchis-tarjeta-descripcion">{descripcion}</span>}
                </span>
                {!agotado && <span className="morchis-tarjeta-flecha" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12h15m-6-6 6 6-6 6" />
                  </svg>
                </span>}
              </span>
            </button>
          );
        })}
      </div>
  );
}

export default function CatalogoMenu({
  productos = [],
  grupos,
  buscador,
  buscando = false,
  onSeleccionar,
  renderDetalleGrupo,
  titulo = "¿Qué se te antoja hoy?",
  subtitulo = "Toca una categoría para ver opciones",
}) {
  const [tipo, setTipo] = useState("comida");
  const secciones = grupos ?? [{ id: "catalogo", productos }];
  const visibles = buscando ? secciones.filter((grupo) => grupo.productos.length) : gruposPorTipo(secciones, tipo);
  return (
    <section className="morchis-catalogo">
      {titulo && <h2 className="morchis-catalogo-titulo">{titulo}</h2>}
      {subtitulo && <p className="morchis-catalogo-subtitulo">{subtitulo}</p>}
      {buscador}
      {!buscando && <div className="morchis-filtros" role="group" aria-label="Tipo de menú">
        {[["comida", "Comida"], ["bebidas", "Bebidas"]].map(([id, nombre]) => (
          <button key={id} type="button" className="morchis-filtro"
            aria-pressed={tipo === id} onClick={() => setTipo(id)}>
            {nombre}
          </button>
        ))}
      </div>}
      {visibles.length ? visibles.map((grupo) => (
        <div key={grupo.id} className="morchis-catalogo-grupo">
          {grupo.titulo && <h3 className="morchis-catalogo-grupo-titulo">{grupo.titulo}</h3>}
          <TarjetasMenu productos={grupo.productos} onSeleccionar={onSeleccionar} />
          {renderDetalleGrupo?.(grupo)}
        </div>
      )) : (
        <p className="morchis-catalogo-subtitulo" role="status">
          {buscando ? "No encontramos resultados. Prueba con otro nombre." : tipo === "bebidas" ? "Por ahora no hay bebidas en este menú." : "Por ahora no hay platillos en este menú."}
        </p>
      )}
    </section>
  );
}
