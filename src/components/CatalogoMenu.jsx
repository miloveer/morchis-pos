import { useState } from "react";

function ImageWithSkeleton({ src, alt }) {
  const [cargado, setCargado] = useState(false);
  return (
    <div className="relative w-full h-full bg-gray-200">
      {!cargado && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out group-hover:scale-105 ${cargado ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setCargado(true)}
      />
    </div>
  );
}

export default function CatalogoMenu({ productos, onSeleccionar }) {
  if (productos.length === 0) {
    return (
      <p className="mt-5 text-center text-sm text-gray-600">
        Todavía no hay productos en este menú.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {[...productos]
        .sort((a, b) => (a.agotado === b.agotado ? 0 : a.agotado ? 1 : -1))
        .map((producto) => {
          const estaAgotado = producto.agotado;
          return (
            <div
              key={producto.id}
              id={producto.id}
              onClick={() =>
                !estaAgotado && onSeleccionar(producto)
              }
              className={`bg-white rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden flex flex-col group scroll-mt-32 ${estaAgotado ? "opacity-60 grayscale cursor-not-allowed" : "cursor-pointer hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] transition-all active:scale-95"}`}
            >
              <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                <ImageWithSkeleton
                  src={producto.imagen}
                  alt={producto.nombre}
                />
                {estaAgotado && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                    <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-lg tracking-widest shadow-lg">
                      AGOTADO
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col justify-between items-center text-center">
                <h3 className="morchis-titulo-producto text-gray-900 text-lg sm:text-xl leading-tight">
                  {producto.nombre}
                </h3>
                <span
                  className={`text-[10px] sm:text-xs font-bold mt-2 px-2 py-1 rounded-md ${estaAgotado ? "text-gray-500 bg-gray-100" : "morchis-tinte morchis-dorado"}`}
                >
                  {estaAgotado ? "No disponible" : "Ver opciones"}
                </span>
              </div>
            </div>
          );
        })}
    </div>
  );
}
