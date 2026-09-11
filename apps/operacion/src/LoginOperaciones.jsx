import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../../src/firebase";

export default function LoginOperaciones() {
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
    <main className="min-h-screen bg-gray-950 px-4 flex items-center justify-center">
      <section className="w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl">
        <img src="/logo.png" alt="MORCHIS" className="mx-auto mb-4 h-20 w-20 object-contain" />
        <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-orange-600">Sistema privado</p>
        <h1 className="mt-1 text-center text-2xl font-black text-gray-950">MORCHIS Operación</h1>
        <form onSubmit={iniciarSesion} className="mt-7 space-y-4">
          <label className="block text-xs font-bold uppercase text-gray-600">
            Correo
            <input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-base normal-case outline-none focus:border-orange-500" required />
          </label>
          <label className="block text-xs font-bold uppercase text-gray-600">
            Contraseña
            <input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-base normal-case outline-none focus:border-orange-500" required />
          </label>
          {mensaje && <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600">{mensaje}</p>}
          <button disabled={cargando} className="w-full rounded-xl bg-orange-600 p-3.5 font-black text-white disabled:opacity-60">
            {cargando ? "INGRESANDO…" : "INGRESAR"}
          </button>
        </form>
      </section>
    </main>
  );
}
