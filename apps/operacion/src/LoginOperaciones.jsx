import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../src/firebase";

export default function LoginOperaciones({ errorAcceso }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async (event) => {
    event.preventDefault();
    setCargando(true);
    setMensaje("");
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setMensaje("Correo o contraseña incorrectos.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <main className="ops-app ops-login">
      <section className="op-panel ops-login-card">
        <img src="/logo.png" alt="MORCHIS" className="mx-auto mb-4 h-20 w-20 object-contain" />
        <p className="op-suave text-center">Acceso del equipo</p>
        <h1 className="mt-1 text-center text-2xl font-bold">MORCHIS Operación</h1>
        <form onSubmit={iniciarSesion} className="op-pila mt-6">
          <label className="op-campo">
            Correo
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="op-campo">
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {(mensaje || errorAcceso) && <p className="op-error" role="alert">{mensaje || errorAcceso}</p>}
          <button disabled={cargando} className="op-boton op-principal">
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
