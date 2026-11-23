const ZONA_HORARIA = "America/Mexico_City";

export const DESAYUNOS_HABILITADOS = false; // Cambiar a true si se habilitan los desayunos
export const TURNOS = {
  desayunos: {
    nombre: "Desayunos",
    get horario() {
      return formatoHorario("Lunes a Viernes", this);
    },
    dias: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    apertura: 7,
    cierre: 12,
  },
  noche: {
    nombre: "Noche",
    get horario() {
      return formatoHorario("Jueves a Domingo", this);
    },
    dias: ["Thu", "Fri", "Sat", "Sun"],
    apertura: 16,
    cierre: 23,
  },
};

function formatoHorario(etiquetaDias, { apertura, cierre }) {
  const formatoHora = (hora) => `${hora % 12 || 12}:00 ${hora < 12 ? "a. m." : "p. m."}`;
  return `${etiquetaDias} · ${formatoHora(apertura)} a ${formatoHora(cierre)}`;
}

export function turnoAbierto(turno, fecha = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA_HORARIA,
    weekday: "short",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(fecha);
  const dia = partes.find((parte) => parte.type === "weekday").value;
  const hora = Number(partes.find((parte) => parte.type === "hour").value);
  const { dias, apertura, cierre } = TURNOS[turno];
  return dias.includes(dia) && hora >= apertura && hora < cierre;
}
