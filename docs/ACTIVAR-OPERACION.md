# MORCHIS: activar Costeo e Inventario

## 1. Copia los archivos
Descomprime el ZIP en la raíz de `morchis-pos` y acepta reemplazar los archivos de `apps/operacion/src/` que coincidan. Se conserva tu menú de clientes y el código del panel de precios.

## 2. Publica los permisos
En **Firebase Console → morchis-menu → Firestore Database → Reglas**, conserva las reglas que ya tienes para menú, catálogos, usuarios, pedidos y caja:

- Reemplaza el bloque anterior **completo** de `match /inventario/{document=**}` o cualquier bloque anterior que dé acceso a `inventario` con el de `docs/inventario-firestore.rules.txt`. Debe quedar dentro de `match /databases/{database}/documents`, al mismo nivel que `menu` y `usuarios`. No dejes las dos versiones: un permiso que conceda acceso en un bloque no se revoca con otro bloque que lo deniegue.
- Comprueba que siga existiendo `match /costos/{document=**} { allow read, write: if partner(); }`. Si no existe, agrégalo una vez. `partner()` debe comprobar que la cuenta esté activa y tenga el rol `socio`. `staff()` debe aceptar solo cuentas activas con rol `socio` o `empleada`, y `profile()` debe leer `usuarios/{UID}`.
- Añade el mismo cambio a tu archivo local `firestore.rules` para conservarlo en Git. No reemplaces otras reglas publicadas con una copia antigua.
- Publica en Firebase. Los perfiles de personal nunca necesitan leer `costos` para ver o actualizar inventario.

## 3. Asigna los colores
En **Firestore Database → Datos → usuarios**, agrega a cada documento de perfil un campo de tipo **string** llamado `colorInventario`. Usa como ID el UID creado en Firebase Authentication. Conserva `nombre`, `activo: true` (booleano) y `rol`:

| Persona | rol | colorInventario |
|---|---|---|
| Milo | socio | rojo |
| Nat | socio | morado |
| Vale | empleada | rosa |
| Dulce | empleada | amarillo |

Si aún falta una cuenta, puedes asignarle el color al crear su perfil. Si un perfil no tiene color, el borde sale gris. Cada ficha muestra el nombre y color de quien guardó por última vez las existencias. Marcar «Comprado» no cambia esa firma. Actualizar el conteo reinicia esa casilla para el nuevo registro.

## 4. Abre Operación
En la raíz del proyecto ejecuta `npm run dev:operacion` y abre la URL que indique la terminal. Confirma con una cuenta de socio que se vean **Costeo y recetario** e **Inventario y compras**. Luego con una cuenta de personal verifica que pueda registrar existencias y marcar compras, y que no aparezcan el recetario ni el estimado. Para preparar la versión de producción, usa `npm run build:operacion`; la salida es `dist-operacion`.

## 5. Si ya capturaste datos en la app vieja
El ZIP original trae el código y datos de ejemplo; tus capturas reales se guardaban por navegador. Para recuperarlas, abre la versión vieja en el mismo navegador, perfil y dirección o ruta donde hiciste las capturas. Confirma que aparecen tus registros. Abre **F12 → Consola** y ejecuta:

```js
(() => {
  const json = localStorage.getItem("costeo.v1");
  if (!json) {
    console.log("No hay datos en este navegador y ruta.");
    return;
  }
  const archivo = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const enlace = document.createElement("a");
  enlace.href = archivo;
  enlace.download = "morchis-respaldo-costeo.json";
  enlace.click();
  setTimeout(() => URL.revokeObjectURL(archivo), 1000);
})();
```

Entra como socio a **Costeo y recetario → Resumen → Cargar respaldo JSON**, revisa los conteos y confirma. Puedes cargar el JSON exportado directamente de `costeo.v1` o un respaldo que incluya esa clave junto con otras versiones. Si ya existe un recetario, descarga primero el respaldo actual: el importador añade registros por identificador y conserva los registros guardados que coincidan, junto con el horario ya configurado. Espera el mensaje de confirmación de Firebase antes de salir. Si nunca capturaste datos, puedes empezar directamente sin importar.

En **Costeo → Insumos** puedes publicar las fichas de existencias, juntas o por separado. Se envían nombre, proveedor, presentación y cantidades; el precio queda en Costeo. Al publicar no se sobreescriben fichas existentes con el mismo ID. Si un insumo ya lo registró el equipo, puedes crear su costo con **Asignar costo a un insumo del inventario**. Evita crear dos fichas para el mismo insumo. Si cambias el nombre, proveedor o presentación de uno que ya estaba vinculado, alinea esos datos en ambas secciones para recuperar la estimación.

El estimado suma los faltantes no marcados como comprados que tienen precio vinculado. La lista compartida por WhatsApp incluye cantidades y proveedores.

## Checklist de compras por tienda

En **Operación → Inventario y compras** abre el checklist. Los faltantes aparecen con la cantidad sugerida; puedes cambiarla y guardar. Con **Existencias** puedes agregar un insumo aunque tenga stock suficiente. Guarda **0** o pulsa **Quitar de la lista** para excluirlo. Marcar como comprado lo tacha y lo descuenta del monto pendiente; el stock se actualiza por separado.

Los socios ven el subtotal del plan por tienda y el total general. Si falta un precio vinculado en Costeo, el total se indica como parcial o sin precios. Compartir por WhatsApp incluye los pendientes y las cantidades, sin precios.

Pulsa **Editar insumo y foto** y elige una foto; luego guarda. Se comparte una foto por insumo con el equipo. Toca la miniatura para ampliarla. No necesitas activar Firebase Storage.

Para que se puedan guardar la cantidad y la foto, actualiza el bloque de inventario de Firestore con `docs/inventario-firestore.rules.txt` como se explica en el paso 2. Los registros anteriores son compatibles; sus faltantes aparecen automáticamente.

## Pausar el servicio a domicilio

En **Operación → Menú → Servicio a domicilio**, pulsa **Activado · Pausar** o **Pausado · Activar**. Afecta a Desayunos y Noche. El cambio queda guardado hasta que alguien lo reactive. Recoger y En Mesa siguen disponibles dentro de su horario.

Si todavía no se guardó una configuración, Domicilio aparece activo al recibir la primera confirmación de Firebase. Los pedidos a domicilio verifican el estado antes de abrir WhatsApp.
