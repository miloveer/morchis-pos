export const VACIO = {
  ings: [], recs: [], combos: [], fixed: { days: 0, hours: 0, items: [] },
};

export const moneda = (valor) => new Intl.NumberFormat("es-MX", {
  style: "currency", currency: "MXN",
}).format(valor);

export const pendiente = (item) => Math.max(0, item.minimo - item.stock);

export function estimadoCompras(faltantes, insumos, obtenerCantidad = pendiente) {
  const porId = new Map(insumos.map((i) => [i.id, i]));
  const coincide = (a, b) => a.trim().toLocaleLowerCase("es-MX") === b.trim().toLocaleLowerCase("es-MX");
  return new Map(faltantes.map((item) => {
    const insumo = porId.get(item.id);
    const precio = insumo && coincide(insumo.u, item.presentacion)
      && coincide(insumo.n, item.nombre) && coincide(insumo.c, item.tienda) ? insumo.p : null;
    return [item.id, precio == null ? null : obtenerCantidad(item) * precio];
  }));
}

export function gastosFijos(fixed) {
  const total = fixed.items.reduce((s, i) => s + i.a, 0);
  return { total, minuto: fixed.days > 0 && fixed.hours > 0 ? total / (fixed.days * fixed.hours * 60) : 0 };
}

export function importeLinea(data, linea, ruta = []) {
  if (!(linea.q > 0)) return null;
  if (linea.k === "i") {
    const i = data.ings.find((ing) => ing.id === linea.id);
    const importe = i && i.q > 0 && i.p != null ? i.p / i.q * linea.q : null;
    return importe == null ? null : i.e ? { comida: 0, empaque: importe } : { comida: importe, empaque: 0 };
  }
  const sub = data.recs.find((r) => r.id === linea.id && r.sub);
  if (!sub || sub.yield <= 0 || ruta.includes(sub.id) || ruta.length >= 50) return null;
  const c = directos(data, sub, [...ruta, sub.id]);
  return c && { comida: c.comida / sub.yield * linea.q, empaque: c.empaque / sub.yield * linea.q };
}

function directos(data, receta, ruta) {
  const costo = { comida: 0, empaque: 0 };
  if (!receta.lines.length) return null;
  for (const l of receta.lines) {
    const importe = importeLinea(data, l, ruta);
    if (!importe) return null;
    costo.comida += importe.comida;
    costo.empaque += importe.empaque;
  }
  return costo;
}

export function resumenReceta(data, receta) {
  const c = directos(data, receta, [receta.id]);
  if (!c) return null;
  const { minuto, total } = gastosFijos(data.fixed);
  if (total > 0 && !minuto && receta.time > 0 && !receta.sub) return null;
  const operativo = receta.sub ? 0 : receta.time * minuto;
  const local = c.comida + operativo;
  const llevar = local + c.empaque;
  return { ...c, operativo, local, llevar, utilidad: receta.price - llevar,
    margen: receta.price > 0 ? 100 * (receta.price - llevar) / receta.price : null,
    sugerido: llevar / (1 - receta.margin / 100) };
}

export function resumenCombo(data, combo) {
  if (!combo.items.length) return null;
  let costo = 0, separado = 0;
  for (const item of combo.items) {
    if (!(item.q > 0)) return null;
    const r = data.recs.find((x) => x.id === item.id && !x.sub);
    const c = r && resumenReceta(data, r);
    if (!c) return null;
    costo += c.llevar * item.q;
    separado += r.price * item.q;
  }
  return { costo, separado, utilidad: combo.price - costo,
    margen: combo.price > 0 ? 100 * (combo.price - costo) / combo.price : null };
}

const obj = (x) => Boolean(x && typeof x === "object" && !Array.isArray(x));
const lista = (x) => {
  if (!Array.isArray(x)) throw new Error("El respaldo no tiene el formato de Costeo y Recetario.");
  return x.map((v) => {
    if (!obj(v)) throw new Error("El respaldo contiene registros inválidos.");
    return v;
  });
};
const txt = (v, lim = 120) => String(v ?? "").trim().slice(0, lim);
const num = (v) => Math.max(0, Math.min(Number(v) || 0, 1e9));
function id(v) {
  if (typeof v !== "string" || !/^[a-zA-Z0-9_-]{1,80}$/.test(v) || v === "__proto__") {
    throw new Error("El respaldo contiene un identificador inválido.");
  }
  return v;
}

export function normalizarRespaldo(d) {
  if (!obj(d) || !obj(d.fixed)) throw new Error("No se encontró un respaldo de costeo válido.");
  const ings = lista(d.ings).map((i) => ({
    id: id(i.id), n: txt(i.n) || "Insumo sin nombre", c: txt(i.c) || "Sin tienda",
    e: Boolean(i.e ?? i.c === "Empaques"), u: txt(i.u, 80) || "Presentación",
    p: i.p == null || i.p === "" ? null : num(i.p), q: num(i.q),
    b: ["g", "ml", "pza"].includes(i.b) ? i.b : "pza", s: Math.min(num(i.s), 1e6), m: Math.min(num(i.m), 1e6), got: Boolean(i.got),
  }));
  const recs = lista(d.recs).map((r) => ({
    id: id(r.id), n: txt(r.n) || "Receta sin nombre", sub: Boolean(r.sub), sh: r.sh === "am" ? "am" : "all",
    yield: num(r.yield), time: num(r.time), margin: Math.min(num(r.margin), 90), price: num(r.price),
    lines: lista(r.lines).map((l) => ({ k: l.k === "r" ? "r" : "i", id: id(l.id), q: num(l.q) })),
    extras: lista(r.extras ?? []).map((e) => ({ id: id(e.id), n: txt(e.n), c: num(e.c), p: num(e.p) })),
  }));
  const combos = lista(d.combos).map((c) => ({
    id: id(c.id), n: txt(c.n) || "Combo sin nombre", price: num(c.price),
    items: lista(c.items).map((l) => ({ id: id(l.id), q: num(l.q) })),
  }));
  const items = lista(d.fixed.items).map((i) => ({ id: id(i.id), n: txt(i.n), a: num(i.a) }));
  for (const grupo of [ings, recs, combos, items]) {
    if (new Set(grupo.map((x) => x.id)).size !== grupo.length) throw new Error("Hay identificadores duplicados en el respaldo.");
  }
  return { ings, recs, combos, fixed: { days: Math.min(31, num(d.fixed.days)), hours: Math.min(24, num(d.fixed.hours)), items } };
}

export function leerArchivoCosteo(texto) {
  const entrada = JSON.parse(texto.replace(/^\uFEFF/, ""));
  const valor = obj(entrada) && Object.hasOwn(entrada, "costeo.v1") ? entrada["costeo.v1"] : entrada;
  const datos = normalizarRespaldo(typeof valor === "string" ? JSON.parse(valor) : valor);
  if (!datos.ings.length && !datos.recs.length && !datos.combos.length && !datos.fixed.items.length
    && !datos.fixed.days && !datos.fixed.hours) throw new Error("Este respaldo no contiene registros ni configuración para recuperar.");
  return datos;
}

export function fusionarRespaldo(actual, respaldo) {
  let agregados = 0;
  let conservados = 0;
  function unir(existentes, entrantes) {
    const ids = new Set(existentes.map((item) => item.id));
    const nuevos = entrantes.filter((item) => !ids.has(item.id));
    agregados += nuevos.length;
    conservados += entrantes.length - nuevos.length;
    return [...existentes, ...nuevos];
  }

  const datos = {
    ings: unir(actual.ings, respaldo.ings),
    recs: unir(actual.recs, respaldo.recs),
    combos: unir(actual.combos, respaldo.combos),
    fixed: {
      days: actual.fixed.days || respaldo.fixed.days,
      hours: actual.fixed.hours || respaldo.fixed.hours,
      items: unir(actual.fixed.items, respaldo.fixed.items),
    },
  };
  const horario = actual.fixed.days !== datos.fixed.days || actual.fixed.hours !== datos.fixed.hours;
  return { datos, agregados, conservados, horario };
}
