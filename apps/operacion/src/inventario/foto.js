import { MAX_FOTO } from "./lista";

export async function prepararFoto(archivo) {
  if (archivo.size > 20 * 1024 * 1024) throw new Error("Elige una imagen de hasta 20 MB.");
  const url = URL.createObjectURL(archivo);
  try {
    const imagen = new Image();
    imagen.src = url;
    try { await imagen.decode(); }
    catch { throw new Error("No se pudo abrir la imagen. Prueba con JPG, PNG o WebP."); }
    const lienzo = document.createElement("canvas");
    const escala = Math.min(1, 640 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const ctx = lienzo.getContext("2d");
    if (!ctx) throw new Error("Este navegador no pudo preparar la imagen.");
    for (const factor of [1, .75, .5, .33]) {
      lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala * factor));
      lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala * factor));
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, lienzo.width, lienzo.height);
      ctx.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
      for (const calidad of [.8, .62, .43]) {
        const foto = lienzo.toDataURL("image/jpeg", calidad);
        if (foto.startsWith("data:image/jpeg;base64,") && foto.length <= MAX_FOTO) return foto;
      }
    }
    throw new Error("No se pudo reducir la foto. Prueba con otra imagen.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
