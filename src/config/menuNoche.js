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
      variante("cc0", "Americano", 30), variante("cc2", "Con leche", 30), variante("cc3", "Con crema", 30),
      variante("ccs", "Americano con sabor", 40),
      variante("cc1", "Capuchino", 30), variante("cc4", "Moka", 30),
      variante("cclc", "Latte caramelo", null),
    ]),
    producto("cafe_frio", "Café frío de sabor", [variante("cfch", "Chico", 45), variante("cfg", "Grande", 65)]),
    producto("cafe_frio_clasico", "Café frío", ["Americano", "Con crema", "Con leche"].flatMap((opcion, i) =>
      ["Chico", "Grande"].map((tamano, j) => variante(`cfc${i}${j}`, `${opcion} · ${tamano}`, null)))),
    producto("cafe_latte_frio", "Café latte frío", [variante("clf_ch", "Chico", null), variante("clf_g", "Grande", null)]),
  ];
  const admin = new Map(menu.map((entrada) => [entrada.id, entrada]));
  return [...menu.filter(({ id }) => !nuevos.some((nuevo) => nuevo.id === id)),
    ...nuevos.map((nuevo) => {
      const guardado = admin.get(nuevo.id);
      const entrada = { ...nuevo, ...guardado };
      if (["cafe_frio", "cafe_frio_clasico", "cafe_latte_frio"].includes(nuevo.id)) {
        return { ...entrada, nombre: nuevo.nombre, elegirTamanoPrimero: true,
          variantes: nuevo.variantes.map((base) => ({
            ...base, ...guardado?.variantes?.find((v) => v.id === base.id),
            tamano: /chico/i.test(base.nombre) ? "Chico" : "Grande",
            nombreOpcion: nuevo.id === "cafe_frio_clasico" ? base.nombre.split(" · ")[0] : undefined,
          })),
        };
      }
      if (nuevo.id === "cafe_caliente") return { ...entrada,
        variantes: nuevo.variantes.map((base) => ({ ...base, ...guardado?.variantes?.find((v) => v.id === base.id) })),
      };
      return entrada;
    })];
}
