import { useState } from "react";
import useServicioDomicilio, { guardarServicioDomicilio } from "../../hooks/useServicioDomicilio";

export default function ServicioDomicilio() {
  const { activo, verificado, error } = useServicioDomicilio();
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");
  async function cambiar() {
    if (!verificado || guardando) return;
    const siguiente = !activo;
    setGuardando(true);
    setAviso("");
    try {
      await guardarServicioDomicilio(siguiente);
      setAviso(siguiente ? "Servicio a domicilio activado." : "Servicio a domicilio pausado.");
    } catch {
      setAviso("No se pudo guardar el cambio. Vuelve a intentar.");
    } finally {
      setGuardando(false);
    }
  }

  return <section className="adm-panel op-pila">
    <div><h3>Servicio a domicilio</h3><p className="op-suave">Aplica a Desayunos y Noche. Al pausarlo, los clientes todavía pueden recoger o pedir en mesa. Permanece pausado hasta que lo reactives.</p></div>
    <button type="button" role="switch" aria-label="Servicio a domicilio" aria-checked={activo}
      className="op-boton op-ajuste" aria-busy={guardando} disabled={!verificado || guardando} onClick={cambiar}>
      {!verificado ? "Sin confirmar" : guardando ? "Guardando…" : activo ? "Activado · Pausar" : "Pausado · Activar"}
    </button>
    <p className="op-suave" role="status">{error ? "No se pudo consultar Firebase. Recarga esta página." : aviso || (!verificado ? "Verificando el servicio…" : "")}</p>
  </section>;
}
