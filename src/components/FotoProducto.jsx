import { useState } from "react";

export default function FotoProducto({ producto, miniatura = false }) {
  const [imagenFallida, setImagenFallida] = useState(null);
  const src = producto?.imagen?.trim() || "";
  const mostrarFoto = src && !src.endsWith("/morchis-sin-foto.svg") && src !== imagenFallida;
  return (
    <span className={miniatura
      ? "relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-amber-50 sm:h-14 sm:w-14"
      : "morchis-tarjeta-foto"} aria-hidden="true">
      {mostrarFoto ? (
        <img src={src} alt="" loading="lazy" decoding="async"
          className={miniatura ? "h-full w-full object-cover" : undefined} onError={() => setImagenFallida(src)} />
      ) : (
        <span className={miniatura ? "text-xl" : "morchis-tarjeta-icono"}>{producto?.icono || "🍽️"}</span>
      )}
    </span>
  );
}
