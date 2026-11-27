import { DESAYUNOS_HABILITADOS, TURNOS, turnoDisponible } from "../config/turnos";

function Icono({ turno }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor"
    strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    {turno === "desayunos"
      ? <path d="M3 18h18M5 14h14M7.5 14a4.5 4.5 0 0 1 9 0M12 3v2M4.5 7.5l1.5 1.5M19.5 7.5 18 9" />
      : <path d="M20.8 15.8A9 9 0 0 1 8.2 3.2a9 9 0 1 0 12.6 12.6Z" />}
  </svg>;
}

export default function BarraTurnos({ turnoMenu, reloj, vistaPrevia, cambiarTurno, children }) {
  return <div className="morchis-dock">
    {children}
    <nav className="morchis-barra-turnos morchis-ancho" aria-label="Menús por horario">
      {Object.entries(TURNOS).map(([id, turno]) => {
        const proximo = id === "desayunos" && !DESAYUNOS_HABILITADOS && !vistaPrevia;
        const abierto = !vistaPrevia && turnoDisponible(id, reloj);
        const previa = vistaPrevia;
        const estado = previa ? "Vista previa" : proximo ? "Próximamente" : abierto ? "Abierto" : "Cerrado";
        return <button className="morchis-turno" type="button" key={id} data-horario={abierto ? "abierto" : "cerrado"}
          aria-pressed={id === turnoMenu} title={turno.horario} onClick={() => cambiarTurno(id)}>
          <Icono turno={id} />
          <span>{turno.nombre}</span>
          <small>{estado}</small>
        </button>;
      })}
    </nav>
  </div>;
}
