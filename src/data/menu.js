export const removiblesGlobales = ['Sin Jitomate', 'Sin Cebolla', 'Sin Mayonesa', 'Sin Mostaza', 'Sin Piña', 'Sin Catsup', 'Sin Picante'];
export const saboresSoda = ['Frutos Rojos', 'Black Cherry', 'Pepino Limón', 'Sandía','Mango','Menta','Manzana Verde', 'Pica Fresa', 'Mora Azul', 'Kiwi','Uva', 'ICEE Mango', 'ICEE Fresa', 'ICEE Manzana Verde', 'ICEE Uva'];
export const saboresRefresco = ['Coca Cola', 'Dr. Pepper', 'Limonada', 'Fresada', 'Naranjada'];
export const sazonadoresPapas = ['Sal', 'Lemon Pepper', 'Queso', 'Fuego', 'Incógnita', 'Habanero','Mantequilla','Crema y Especias'];
export const removiblesPapas = ['Sin Catsup', 'Sin Queso Líquido', 'Sin Salsa'];
export const listaSalsasAlitas = ['Clásicas','Clásicos', 'Mango', 'Flamin Hot', 'Tamarindo Fuego', 'Búfalo', 'Manzana Habanero', 'Maracuyá', 'Pelon Pelo Rico', 'Pica Fresa', 'Ranch', 'BBQ'];

export const menuData = [
  {
    id: 'burgers',
    nombre: 'Burgers',
    icono: '🍔',
    imagen: '/img/burger.png',
    usaRemoviblesGlobales: true,
    variantes: [
      { id: 'b1', nombre: 'Sencilla', precioBase: 60 }, { id: 'b2', nombre: 'Honolulu', precioBase: 70 },
      { id: 'b3', nombre: 'Cheese (Manchego)', precioBase: 65 }, { id: 'b4', nombre: 'Cheese (Americano)', precioBase: 65 },
      { id: 'b5', nombre: 'Cheese (Quesillo)', precioBase: 65 }, { id: 'b6', nombre: '3 Quesos', precioBase: 85 },
      { id: 'b7', nombre: 'Chicken', precioBase: 90 }, { id: 'b8', nombre: 'Morchis', precioBase: 90 },
      { id: 'b9', nombre: 'Chori-Burger', precioBase: 95 }, { id: 'b10', nombre: 'Porky', precioBase: 95 }
    ],
    extras: [ { id: 'ext1', nombre: 'Doble Carne', precio: 30 }, { id: 'ext2', nombre: 'Tocino', precio: 15 },
              { id: 'ext3', nombre: 'Queso Manchego', precio: 10 }, { id: 'ext4', nombre: 'Queso Americano', precio: 10 },
              { id: 'ext5', nombre: 'Queso Oaxaca', precio: 10 }, { id: 'ext6', nombre: 'Salchicha', precio: 10 },
              { id: 'ext7', nombre: 'Piña', precio: 10 }, { id: 'ext8', nombre: 'Jamón', precio: 10 }],
    combos: [{ id: 'c1', nombre: 'Solo la Burger', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]
  },
  {
    id: 'jochos',
    nombre: 'Jochos',
    icono: '🌭',
    imagen: '/img/jocho.png',
    usaRemoviblesGlobales: true,
    variantes: [
      { id: 'j1', nombre: 'Sencillo', precioBase: 40 }, { id: 'j2', nombre: 'Hawaiano', precioBase: 50 },
      { id: 'j3', nombre: 'Cheese (Manchego)', precioBase: 45 }, { id: 'j4', nombre: 'Cheese (Americano)', precioBase: 45 },
      { id: 'j5', nombre: 'Cheese (Quesillo)', precioBase: 45 }, { id: 'j6', nombre: '3 Quesos', precioBase: 55 },
      { id: 'j7', nombre: 'Chicken', precioBase: 65 },{ id: 'j8', nombre: 'ChoriJocho', precioBase: 65 }, 
      { id: 'j9', nombre: 'Porky', precioBase: 65 }],
    extras: [
      { id: 'ext2', nombre: 'Tocino', precio: 10 },
      { id: 'ext3', nombre: 'Queso Manchego', precio: 10 }, { id: 'ext4', nombre: 'Queso Americano', precio: 10 },
      { id: 'ext5', nombre: 'Queso Oaxaca', precio: 10 },{ id: 'ext7', nombre: 'Piña', precio: 10},
      { id: 'ext8', nombre: 'Jamón', precio: 10 }],
    combos: [{ id: 'c1', nombre: 'Solo el Jocho', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]
  },
  {
    id: 'alitas',
    nombre: 'Alitas',
    icono: '🍗',
    imagen: '/img/alitas.png',
    usaRemoviblesGlobales: false,
    maxSalsas: 3,
    variantes: [{ id: 'a1', nombre: '6 Piezas', precioBase: 75 }, { id: 'a2', nombre: '10 Piezas', precioBase: 110 }],
    combos: [{ id: 'c1', nombre: 'Solo Alitas', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]
  },
  {
    id: 'boneless',
    nombre: 'Boneless',
    icono: '🔥',
    imagen: '/img/boneless.png',
    usaRemoviblesGlobales: false,
    maxSalsas: 3,
    variantes: [{ id: 'bn1', nombre: '6 Piezas', precioBase: 75 }, { id: 'bn2', nombre: '10 Piezas', precioBase: 110 }],
    combos: [{ id: 'c1', nombre: 'Solo Boneless', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]
  },
  {
    id: 'papas_francesa',
    nombre: 'Papas Francesa',
    icono: '🍟',
    imagen: '/img/papasfrancesa.png',
    usaRemoviblesGlobales: false,
    esProductoPapas: true,
    variantes: [{ id: 'p1', nombre: 'Clásicas', precioBase: 40 }, { id: 'p2', nombre: 'Jumbo', precioBase: 70 }, { id: 'p3', nombre: 'Puerkas', precioBase: 50 }, { id: 'p4', nombre: 'Puerkas Jumbo', precioBase: 95 }],
    extras: [{ id: 'ext6', nombre: 'Salsa Extra', precio: 10 }],
    combos: [{ id: 'c1', nombre: 'Solo Papas', precioExtra: 0 }]
  },
  {
    id: 'papas_lokas',
    nombre: 'Papas Lokas',
    icono: '🌪️',
    imagen: '/img/papaslokas.png',
    usaRemoviblesGlobales: false,
    removiblesEspecificos: ['Sin Cacahuates', 'Sin Gomitas', 'Sin Salsa', 'Sin Salsas Negras', 'Sin Chamoy', 'Sin Miguelito'],
    variantes: [{ id: 'pl1', nombre: 'Papas Lokas', precioBase: 40 }],
    extras: [],
    combos: [{ id: 'c1', nombre: 'Solo Papas Lokas', precioExtra: 0 }]
  },
  {
    id: 'burritos',
    nombre: 'Burritos',
    icono: '🌯',
    imagen: '/img/burrito.png ',
    usaRemoviblesGlobales: true,
    variantes: [{ id: 'bu1', nombre: 'Pollo', precioBase: 60 }, { id: 'bu2', nombre: 'Bistec', precioBase: 60 }, { id: 'bu3', nombre: 'Longaniza', precioBase: 60 }, { id: 'bu4', nombre: 'Campechano', precioBase: 60 }],
    extras: [{ id: 'ext7', nombre: 'Queso Extra', precio: 15 }],
    combos: [{ id: 'c1', nombre: 'Solo el Burrito', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]
  },
  {
    id: 'alambres',
    nombre: 'Alambres',
    icono: '🍳',
    imagen: '/img/alambre.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'al1', nombre: 'Pollo', precioBase: 100 }, { id: 'al2', nombre: 'Bistec', precioBase: 100 }, { id: 'al3', nombre: 'Longaniza', precioBase: 100 }, { id: 'al4', nombre: 'Campechano', precioBase: 100 }],
    extras: [{ id: 'ext8', nombre: 'Queso Extra', precio: 15 }, { id: 'ext9', nombre: 'Tortillas Extra', precio: 10 }],
    combos: false,
  },
  {
    id: 'hotcakes',
    nombre: 'Hot Cakes',
    icono: '🥞',
    imagen: '/img/hotcakes.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'hc1', nombre: 'Orden Clásica', precioBase: 60 }],
    opcionObligatoria: { titulo: 'Elige tu jarabe', opciones: ['Miel de Maple', 'Mermelada', 'Lechera', 'Chocolate', 'Cajeta', 'Caramelo'] },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Hot Cakes', precioExtra: 0 }]
  },
  {
    id: 'soda italiana',
    nombre: 'Soda Italiana',
    imagen: '/img/sodaitaliana.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'ch1', nombre: 'Chica', precioBase: 40 }, { id: 'ch2', nombre: 'Grande', precioBase: 50 }],
    opcionObligatoria: { titulo: 'Sabor', opciones: saboresSoda },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'frappes',
    nombre: 'Frappes',
    icono: '☕',
    imagen: '/img/frappe.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'fr1', nombre: 'Chico', precioBase: 50 }, { id: 'fr2', nombre: 'Grande', precioBase: 85 }],
    opcionObligatoria: { titulo: 'Sabor del Frappe', opciones: ['Oreo', 'Moka', 'Cajeta', 'Mazapán', 'Vainilla'] },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'chamoyadas',
    nombre: 'Chamoyadas',
    icono: '🥭',
    imagen: '/img/chamoyada.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'ch1', nombre: 'Chica', precioBase: 55 }, { id: 'ch2', nombre: 'Grande', precioBase: 65 }],
    opcionObligatoria: { titulo: 'Sabor', opciones: saboresSoda },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'smoothies',
    nombre: 'Smoothies',
    icono: '🥤',
    imagen: '/img/smoothies.png ',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'sm1', nombre: 'Chico', precioBase: 45 }, { id: 'sm2', nombre: 'Grande', precioBase: 60 }],
    opcionObligatoria: { titulo: 'Sabor', opciones: saboresSoda },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'refresco_solo',
    nombre: 'Refrescos',
    icono: '🥫',
    imagen: '/img/refrescos.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'rs1', nombre: 'Lata 355ml', precioBase: 30 }],
    opcionObligatoria: { titulo: 'Elige tu Refresco', opciones: saboresRefresco },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'refresco_preparado',
    nombre: 'Refresco Preparado',
    icono: '🍋',
    imagen: '/img/refrescopreparado.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'rp1', nombre: 'Chico', precioBase: 40 }, { id: 'rp2', nombre: 'Grande', precioBase: 50 }],
    opcionObligatoria: { titulo: 'Preparación', opciones: ['Sangría (Limon y Sal)','Sangria (Limon, Sal y tajin)', 'Mineral (Limón y Sal)', 'Mineral (Limón, Sal y Tajín)'] },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  }
];