# MORCHIS

El repositorio contiene dos compilaciones independientes:

- `npm run dev:clientes` / `npm run build:clientes`: menú público. No incluye código del sistema interno.
- `npm run dev:operacion` / `npm run build:operacion`: POS y back office con autenticación.

## Perfiles operativos

Cada integrante inicia sesión con Firebase Authentication. Su documento `usuarios/{uid}` debe contener:

```json
{
  "nombre": "Emilio",
  "rol": "socio",
  "activo": true
}
```

Los roles válidos son `socio` para Emilio y Natasha, y `empleada` para Dulce y Valeria. Las credenciales nunca se guardan en GitHub.

## Despliegue

El menú público utiliza `dist/`. La aplicación operativa utiliza `dist-operacion/` y debe desplegarse en una dirección diferente. Antes de usarla hay que activar Email/Password en Firebase Authentication, crear las cuatro cuentas, crear sus perfiles y publicar `firestore.rules`.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
