window.READY_DATA = {
  basePath: "", // set per deploy; "" when served from /merged/
  whatsapp: "5492944158889",
  whatsappOps: "5492944616181",
  whatsappLink: "https://wa.link/1lgscj",
  email: "reservas@readyrentacar.com.ar",
  adminPhone: "+54 9 2944 58 8329",
  facebook: "https://www.facebook.com/readyrentacarbariloche/",
  partnerStay: "https://www.orillasdelgutierrez.com.ar/",
  engine: "https://www.anyrent.pt/",
  liveSite: "https://www.readyrentacar.com.ar/en",
  stations: [
    { id: "brc", code: "BRC", city: "Bariloche", address: "Ruta Provincial 80 S/N", hours: "09:00–19:00", liveSlug: "bariloche" },
    { id: "cpc", code: "CPC", city: "San Martín de los Andes", address: "Aeropuerto Chapelco", hours: "08:00–21:00", liveSlug: "san-martin-de-los-andes" },
    { id: "eqs", code: "EQS", city: "Esquel", address: "Aeropuerto Esquel", hours: "08:00–21:00", liveSlug: "esquel" },
    { id: "fte", code: "FTE", city: "El Calafate", address: "Tonko Simunovic 2251", hours: "08:00–21:00", liveSlug: "el-calafate" },
    { id: "ush", code: "USH", city: "Ushuaia", address: "Aeropuerto Ushuaia", hours: "08:00–20:00", liveSlug: "ushuaia" },
    { id: "mdz", code: "MDZ", city: "Mendoza", address: "Aeropuerto Mendoza", hours: "By arrangement", liveSlug: "mendoza-aeropuerto" },
  ],
  // Demo one-way fee matrix (ARS thousands) — replace with live rates
  onewayFees: {
    "brc|fte": 180000,
    "brc|ush": 220000,
    "brc|cpc": 45000,
    "brc|eqs": 70000,
    "brc|mdz": 160000,
    "fte|brc": 180000,
    "fte|ush": 120000,
    "fte|cpc": 200000,
    "cpc|brc": 45000,
    "ush|fte": 120000,
    "ush|brc": 220000,
    default: 95000,
  },
  cars: [
    {
      id: "tracker",
      fit: ["suv"],
      seats: 5,
      daily: 85000,
      img: "assets/fleet/tracker.png",
      isNew: true,
      corporate: false,
      liveGid: "1__suvat",
    },
    {
      id: "cross",
      fit: ["suv"],
      seats: 5,
      daily: 110000,
      img: "assets/fleet/cross.png",
      isNew: true,
      corporate: false,
      liveGid: "1__GFAM",
    },
    {
      id: "spin",
      fit: ["family"],
      seats: 7,
      daily: 120000,
      img: "assets/fleet/spin.png",
      isNew: false,
      corporate: false,
      liveGid: "1__XXAR",
    },
    {
      id: "hiace",
      fit: ["family"],
      seats: 9,
      daily: 150000,
      img: "assets/fleet/hiace.png",
      isNew: false,
      corporate: true,
      liveGid: "1__van",
    },
    {
      id: "hiluxm",
      fit: ["pickup"],
      seats: 5,
      daily: 130000,
      img: "assets/fleet/hiluxm.png",
      isNew: false,
      corporate: true,
      liveGid: "1__PICKUPMT",
    },
    {
      id: "hilux",
      fit: ["pickup", "4x4"],
      seats: 5,
      daily: 165000,
      img: "assets/fleet/hilux.png",
      isNew: true,
      corporate: true,
      liveGid: "1__FQBD",
    },
    {
      id: "sw4",
      fit: ["4x4", "suv"],
      seats: 7,
      daily: 210000,
      img: "assets/fleet/sw4.png",
      isNew: true,
      corporate: true,
      liveGid: "1__OFBD",
    },
  ],
  winterDaily: 18000,
  premiumDaily: 25000,
  // Demo accessory rates (ARS) — wire to Jedeye extras catalog in production
  extras: [
    {
      id: "chains",
      icon: "⛓",
      pricing: "daily",
      amount: 12000,
      maxQty: 1,
      seasonal: true,
      common: true,
    },
    {
      id: "infant",
      icon: "👶",
      pricing: "daily",
      amount: 8000,
      maxQty: 3,
      common: true,
    },
    {
      id: "child",
      icon: "🧒",
      pricing: "daily",
      amount: 8000,
      maxQty: 3,
      common: true,
    },
    {
      id: "booster",
      icon: "💺",
      pricing: "daily",
      amount: 6000,
      maxQty: 3,
      common: true,
    },
    {
      id: "driver",
      icon: "🪪",
      pricing: "daily",
      amount: 15000,
      maxQty: 2,
      common: true,
    },
    {
      id: "gps",
      icon: "📍",
      pricing: "daily",
      amount: 9000,
      maxQty: 1,
      common: false,
    },
    {
      id: "ski",
      icon: "🎿",
      pricing: "daily",
      amount: 10000,
      maxQty: 1,
      seasonal: true,
      common: false,
    },
  ],
  promotions: [
    { id: "premium6", href: "https://www.readyrentacar.com.ar/en/campanhas/oferta-pago-total-anticipado" },
    { id: "van9", href: "https://www.readyrentacar.com.ar/en/campanhas/suv-nuevos-modelos-en-la-categoria" },
    { id: "tracker", href: "https://www.readyrentacar.com.ar/en/campanhas/nuevas-chevrolet-tracker-automaticas" },
  ],
  routeImages: {
    lakes: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=80",
    r40: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
    winter: "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1400&q=80",
    fin: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1400&q=80",
  },
};

window.READY_TRIP = {
  storageKey: "ready_trip_v1",
  load() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || "{}");
    } catch {
      return {};
    }
  },
  save( partial ) {
    const next = { ...this.load(), ...partial, updatedAt: Date.now() };
    localStorage.setItem(this.storageKey, JSON.stringify(next));
    return next;
  },
  clear() {
    localStorage.removeItem(this.storageKey);
  },
};
