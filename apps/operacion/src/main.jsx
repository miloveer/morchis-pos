import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./operacion.css";
import "./comun/modulos.css";
import AppOperaciones from "./AppOperaciones";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppOperaciones />
  </StrictMode>,
);
