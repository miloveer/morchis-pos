import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../../src/index.css";
import AppOperaciones from "./AppOperaciones";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppOperaciones />
  </StrictMode>,
);
