/**
 * Ready BFF client — read-only AnyRent proxy.
 * Never holds API keys; never POST /bookings.
 */
(function () {
  const DEFAULT_BASE = "https://ready-rentacar-bff.ready-rentacar-ft.workers.dev";

  function baseUrl() {
    const fromData = window.READY_DATA?.bff?.baseUrl;
    if (fromData) return String(fromData).replace(/\/$/, "");
    try {
      const override = localStorage.getItem("ready_bff_base");
      if (override) return override.replace(/\/$/, "");
    } catch {
      /* ignore */
    }
    return DEFAULT_BASE;
  }

  async function getJson(path, query = {}) {
    const url = new URL(path, baseUrl() + "/");
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body.error || `BFF ${res.status}`);
      err.status = res.status;
      err.detail = body.detail || body;
      throw err;
    }
    return body;
  }

  /** datetime-local / ISO → ISO UTC for BFF (Worker normalizes to AnyRent). */
  function toIsoUtc(localLike) {
    if (!localLike) throw new Error("missing date");
    const d = new Date(localLike);
    if (Number.isNaN(d.getTime())) throw new Error(`invalid date: ${localLike}`);
    return d.toISOString();
  }

  function stationSlug(idOrSlug) {
    const map = window.READY_JEDEYE?.STATION_TO_LIVE || {};
    return map[idOrSlug] || idOrSlug;
  }

  function optionalList(block) {
    if (!block) return [];
    if (Array.isArray(block)) return block;
    if (typeof block === "object") return Object.values(block);
    return [];
  }

  /**
   * Quote trip via BFF /api/prices.
   * @returns {{ groups: Array, query: object, raw: object }}
   */
  async function fetchPrices(trip, lang = "es") {
    const pickup = stationSlug(trip.pickup);
    const dropoff = stationSlug(trip.dropoff || trip.pickup);
    const body = await getJson("/api/prices", {
      lang,
      pickup_station: pickup,
      dropoff_station: dropoff,
      pickup_date: toIsoUtc(trip.from),
      dropoff_date: toIsoUtc(trip.until),
      rate: trip.rate || "",
      voucher_code: trip.voucher || "",
    });
    const fleets = body.data?.fleets || [];
    const groups = [];
    fleets.forEach((f) => {
      (f.groups || []).forEach((g) => groups.push(g));
    });
    return { groups, query: body.query, raw: body.data, lang };
  }

  async function fetchOptionals(lang = "es") {
    const body = await getJson("/api/optionals", { lang });
    return body.data;
  }

  async function fetchStations(lang = "es") {
    const body = await getJson("/api/stations", { lang });
    return body.data;
  }

  async function fetchFleets(lang = "es") {
    const body = await getJson("/api/fleets", { lang });
    return body.data;
  }

  function health() {
    return getJson("/health");
  }

  /** Match mock car id → API group. */
  function groupForCar(carId, groups) {
    const code = window.READY_JEDEYE?.CAR_TO_API_GROUP?.[carId];
    if (!code) return null;
    return (groups || []).find((g) => g.code === code) || null;
  }

  function pricingFromGroup(group) {
    if (!group) return null;
    const rate = group.rate || {};
    const orates = group.optionals_rates || {};
    return {
      code: group.code,
      status: group.status,
      brand: group.brand,
      model: group.model,
      name: group.name,
      imageUrl: group.image_url || "",
      totalAfterTax: Number(rate.total_after_tax) || 0,
      currency: rate.currency || "ARS",
      timeUnits: Number(rate.time_units) || 0,
      excess: Number(rate.excess_value) || 0,
      deposit: Number(rate.security_deposit_value) || 0,
      extras: optionalList(orates.extras),
      taxes: optionalList(orates.taxes),
      insurances: optionalList(orates.insurances),
    };
  }

  function extraUnitPrice(extrasList, liveCode) {
    const hit = (extrasList || []).find((e) => e.code === liveCode);
    if (!hit) return null;
    return Number(hit.price_after_tax ?? hit.total_after_tax ?? hit.price) || 0;
  }

  function insuranceDaily(insurances, liveCode) {
    const hit = (insurances || []).find((i) => i.code === liveCode);
    if (!hit) return null;
    return {
      daily: Number(hit.price_after_tax ?? 0) || 0,
      excess: Number(hit.excess_value) || 0,
      deposit: Number(hit.security_deposit_value) || 0,
      name: hit.name,
    };
  }

  /**
   * Guess one-way tax line for pickup/dropoff slugs (display only).
   * Vehicle total_after_tax from /prices already reflects the trip; we do not
   * double-add this into the grand total when using BFF totals.
   */
  function findOnewayTax(taxes, pickupSlug, dropoffSlug) {
    if (!pickupSlug || !dropoffSlug || pickupSlug === dropoffSlug) return null;
    const list = taxes || [];
    const a = pickupSlug.replace(/-aeropuerto$/, "");
    const b = dropoffSlug.replace(/-aeropuerto$/, "");
    const exact = `${a}-${b}`;
    let hit = list.find((t) => t.code === exact);
    if (hit) return hit;
    hit = list.find((t) => {
      const c = String(t.code || "");
      return c.includes(a) && c.includes(b);
    });
    return hit || null;
  }

  window.READY_BFF = {
    baseUrl,
    health,
    fetchPrices,
    fetchOptionals,
    fetchStations,
    fetchFleets,
    groupForCar,
    pricingFromGroup,
    extraUnitPrice,
    insuranceDaily,
    findOnewayTax,
    optionalList,
    toIsoUtc,
    stationSlug,
  };
})();
