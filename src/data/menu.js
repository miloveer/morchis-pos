export const removiblesGlobales = ['Con todo','Solo Aderezos','Solo Verdura','Sin Jitomate', 'Sin Cebolla', 'Sin Mayonesa', 'Sin Mostaza', 'Sin Piña', 'Sin Catsup', 'Sin Picante'];
export const saboresSoda = ['Frutos Rojos', 'Black Cherry', 'Pepino Limón', 'Sandía','Mango','Menta','Manzana Verde', 'Pica Fresa', 'Mora Azul', 'Kiwi','Uva', 'ICEE Mango', 'ICEE Fresa', 'ICEE Manzana Verde', 'ICEE Uva'];
export const saboresRefresco = ['Coca Cola', 'Dr. Pepper', 'Limonada', 'Fresada', 'Naranjada'];
export const sazonadoresPapas = ['Sal', 'Lemon Pepper', 'Queso', 'Fuego', 'Incógnita', 'Habanero','Mantequilla','Crema y Especias'];
export const removiblesPapas = ['Con Todo','Todo Aparte','Sin Catsup', 'Sin Queso Líquido', 'Sin Salsa'];
export const listaSalsasAlitas = ['Clásicas','Clásicos', 'Mango', 'Flamin Hot', 'Tamarindo Fuego', 'Búfalo', 'Manzana Habanero', 'Maracuyá', 'Pelon Pelo Rico', 'Pica Fresa', 'Ranch', 'BBQ'];
export const saboresCafe =['Kinder Delice','Cajeta','Mazapan','Taro', 'Crema Irlandesa','Nuez']
export const menuData = [
  {
    id: 'burgers',
    nombre: 'Burgers',
    agotado: false,
    icono: '🍔',
    imagen: '/img/burger.png',
    usaRemoviblesGlobales: true,
    opcionProteina: [
      { nombre: 'Carne de Res', agotada: true },
      { nombre: 'Pollo', agotada: false },
    ],
    variantes: [
      { id: 'b1', nombre: 'Sencilla', precioBase: 60 },
      { id: 'b2', nombre: 'Honolulu', precioBase: 70, descripcion: '+ Piña y Jamón' },
      { id: 'b3', nombre: 'Cheese', precioBase: 65, opcionesQueso: ['Manchego', 'Americano', 'Quesillo'], descripcion: 'Queso Americano, Quesillo o Manchego' },
      { id: 'b6', nombre: '3 Quesos', precioBase: 85, descripcion: '+ Manchego, Quesillo y Americano' },
      { id: 'b7', nombre: 'Chicken', precioBase: 90, descripcion: 'Cambiamos la carne por Boneless' },
      { id: 'b8', nombre: 'Morchis', precioBase: 90, descripcion: '+ Salchicha, Jamón y Queso' },
      { id: 'b9', nombre: 'Chori-Burger', precioBase: 95, descripcion: '+ Chorizo y Manchego' },
      { id: 'b10', nombre: 'Porky', precioBase: 95, descripcion: '+ Jamón, Tocino, Salchicha y BBQ' }
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
    agotado: false,
    icono: '🌭',
    imagen: '/img/jocho.png',
    usaRemoviblesGlobales: true,
    variantes: [
      { id: 'j1', nombre: 'Sencillo', precioBase: 40 },
      { id: 'j2', nombre: 'Hawaiano', precioBase: 50, descripcion: '+ Piña y Jamón' },
      { id: 'j3', nombre: 'Cheese', precioBase: 45, opcionesQueso: ['Manchego', 'Americano', 'Quesillo'], descripcion: 'Queso Americano, Quesillo o Manchego' },
      { id: 'j6', nombre: '3 Quesos', precioBase: 55, descripcion: '+ Manchego, Quesillo y Americano' },
      { id: 'j7', nombre: 'Chicken', precioBase: 65 , descripcion: 'Cambiamos la salchicha por Boneless' },
      { id: 'j8', nombre: 'ChoriJocho', precioBase: 65, descripcion: '+ Chorizo y Manchego' }, 
      { id: 'j9', nombre: 'Porky', precioBase: 65, descripcion: '+ Jamón, Tocino y BBQ' }],
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
    agotado: false,

    icono: '🍗',
    imagen: '/img/alitas.png',
    usaRemoviblesGlobales: false,
    maxSalsas: 3,
    variantes: [{ id: 'a1', nombre: '6 Piezas', precioBase: 75 }, { id: 'a2', nombre: '10 Piezas', precioBase: 110 }],
    combos: [ { id: 'c1', nombre: 'Solo Alitas', precioExtra: 0 },
              { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true },
              { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]
  },
  {
    id: 'boneless',
    nombre: 'Boneless',
    agotado: false,

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
    agotado: false,
    icono: '🍟',
    imagen: '/img/papasfrancesa.png',
    usaRemoviblesGlobales: false,
    esProductoPapas: true,
    variantes: [{ id: 'p1', nombre: 'Clásicas', precioBase: 40 },
                { id: 'p2', nombre: 'Jumbo', precioBase: 70 },
                { id: 'p3', nombre: 'Puerkas', precioBase: 50, descripcion: '+ Tocino y BBQ' },
                { id: 'p4', nombre: 'Puerkas Jumbo', precioBase: 95, descripcion: '+ Tocino y BBQ' },],
    extras: [{ id: 'ext6', nombre: 'Salsa Extra', precio: 10 }],
    combos: [{ id: 'c1', nombre: 'Solo Papas', precioExtra: 0 }]
  },
  {
    id: 'papas_lokas',
    nombre: 'Papas Lokas',
    agotado: false,

    icono: '🌪️',
    imagen: '/img/papaslokas.png',
    usaRemoviblesGlobales: false,
    removiblesEspecificos: ['Con Todo','Sin Cacahuates', 'Sin Gomitas', 'Sin Salsa', 'Sin Salsas Negras', 'Sin Chamoy', 'Sin Miguelito'],
    variantes: [{ id: 'pl1', nombre: 'Papas Lokas', precioBase: 40 }],
    extras: [],
    combos: [{ id: 'c1', nombre: 'Solo Papas Lokas', precioExtra: 0 }]
  },
  {
    id: 'burritos',
    nombre: 'Burritos',
    agotado: true,
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
    agotado: true,
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
    agotado: false,

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
    agotado: false,

    imagen: '/img/sodaitaliana.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'ch1', nombre: 'Chica', precioBase: 40 }, { id: 'ch2', nombre: 'Grande', precioBase: 50 }],
    opcionObligatoria: { titulo: 'Sabor', opciones: saboresSoda },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'frappes',
    nombre: 'Frappes',
    agotado: false,

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
    agotado: false,

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
    agotado: false,

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
    agotado: false,

    icono: '🥫',
    imagen: '/img/refresco.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'rs1', nombre: 'Lata 355ml', precioBase: 30 }],
    opcionObligatoria: { titulo: 'Elige tu Refresco', opciones: saboresRefresco },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },
  {
    id: 'refresco_preparado',
    nombre: 'Refresco Preparado',
    agotado: false,

    icono: '🍋',
    imagen: '/img/refrescopreparado.png',
    usaRemoviblesGlobales: false,
    variantes: [{ id: 'rp1', nombre: 'Chico', precioBase: 40 }, { id: 'rp2', nombre: 'Grande', precioBase: 50 }],
    opcionObligatoria: { titulo: 'Preparación', opciones: ['Sangría (Limon y Sal)','Sangria (Limon, Sal y tajin)', 'Mineral (Limón y Sal)', 'Mineral (Limón, Sal y Tajín)'] },
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Bebida', precioExtra: 0 }]
  },

  {
    id: 'sandwiches',
    nombre: 'Sandwiches',
    agotado: true,
    icono: '🥪',
    imagen: '/img/sandwich.png',
    usaRemoviblesGlobales: true,
    variantes: [{ id: 'sw1', nombre: 'Jamón', precioBase: 55 }, { id: 'sw2', nombre: 'Jamón con Tocino', precioBase: 70 },
                { id: 'sw3', nombre: 'Jamón con Queso Manchego', precioBase: 65 }, { id: 'sw4', nombre: 'Jamón con Piña', precioBase: 60 },
                { id: 'sw5', nombre: 'Supremo (Jamón, Queso, Tocino y Piña)', precioBase: 75 }, { id: 'sw6', nombre: 'Queso Americano', precioBase: 65 },
                { id: 'sw7', nombre: 'Jamón con Queso Oaxaca', precioBase: 65 }],
    extras: [], combos: [{ id: 'c1', nombre: 'Solo Sandwich', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]

  },
  {
    id: 'sincronizadas',
    nombre: 'Sincronizadas',
    agotado: true,
    icono: '🫓',
    imagen: '/img/sincronizada.png',
    usaRemoviblesGlobales: true,
    variantes: [{ id: 'sync1', nombre: 'Clásica (Jamón y Queso Manchego)', precioBase: 45 }, { id: 'sync2', nombre: 'Clásica (Jamon y Queso Oaxaca)', precioBase: 45 },
       { id: 'sync3', nombre: 'Con tocino', precioBase: 55 }, { id: 'sync4', nombre: 'Con piña', precioBase: 50 }, { id: 'sync5', nombre: 'Jamón, Queso Manchego, Tocino y Piña', precioBase: 65 }
       , { id: 'sync6', nombre: 'Jamón, Queso Oaxaca, Tocino y Piña', precioBase: 65 }],
    extras: [{ id: 'ext7', nombre: 'Queso Extra', precio: 15 }],
    combos: [{ id: 'c1', nombre: 'Solo Sincronizada', precioExtra: 0 }, { id: 'c2', nombre: 'Combo con Papas', precioExtra: 30, incluyePapas: true }, { id: 'c3', nombre: 'Combo Soda Italiana', precioExtra: 30, incluyeSoda: true }]

  },
];