const variante = (id, nombre, precioBase) => ({ id, nombre, precioBase });
const producto = (id, nombre, variantes, detalles) => ({
  id, nombre, variantes, imagen: "/img/morchis-sin-foto.svg",
  turnos: ["noche"], agotado: false, ...detalles,
});

export function completarMenuNoche(menu) {
  const jarabes = menu.find(({ id }) => id === "hotcakes")?.opcionObligatoria?.opciones;
  const nuevos = [
    producto("banderillas_coreanas", "Banderillas coreanas", [variante("bco4", "4 piezas", 80)]),
    producto("oreos_fritas", "Oreos fritas", [variante("of6", "6 piezas", 75)], {
      opcionObligatoria: {
        titulo: "Jarabe",
        opciones: Array.isArray(jarabes) ? jarabes : ["Miel de Maple", "Mermelada", "Lechera", "Chocolate", "Cajeta", "Caramelo"],
      },
    }),
    producto("ensaladas", "Ensaladas", [variante("ench", "Chica", 50), variante("eng", "Grande", 85)], {
      opcionObligatoria: { titulo: "Aderezo", opciones: ["Ranch", "Mil islas", "Italiano", "Especial"] },
      extras: [{ id: "ens_pollo", nombre: "Pollo", precio: 30 }],
    }),
    producto("cafe_caliente", "Café caliente", [
      ...["Americano", "Capuchino", "Con leche", "Con crema", "Moka"].map((nombre, i) => variante(`cc${i}`, nombre, 30)),
      variante("ccs", "Americano con sabor", 40),
    ]),
    producto("cafe_frio", "Café frío", [variante("cfch", "Chico", 45), variante("cfg", "Grande", 65)]),
  ];
  const admin = new Map(menu.map((entrada) => [entrada.id, entrada]));
  return [...menu.filter(({ id }) => !nuevos.some((nuevo) => nuevo.id === id)),
    ...nuevos.map((nuevo) => ({ ...nuevo, ...admin.get(nuevo.id) }))];
}
