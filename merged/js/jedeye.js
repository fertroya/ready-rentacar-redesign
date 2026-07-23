/**
 * Jedeye / AnyRent adapter
 * - Maps redesign IDs ↔ live Ready station/fleet slugs
 * - Optional live handoff into the public OctoberCMS booking flow
 * - Never stores admin credentials (those belong in a server-side BFF only)
 */
(function () {
  const LIVE_ORIGIN = "https://www.readyrentacar.com.ar";

  const STATION_TO_LIVE = {
    brc: "bariloche",
    cpc: "san-martin-de-los-andes",
    eqs: "esquel",
    fte: "el-calafate",
    ush: "ushuaia",
    mdz: "mendoza-aeropuerto",
  };

  const LIVE_TO_STATION = Object.fromEntries(
    Object.entries(STATION_TO_LIVE).map(([k, v]) => [v, k])
  );

  const CAR_TO_GID = {
    // October plugin gids (booking UI)
    tracker: "1__suvat",
    cross: "1__GFAM",
    spin: "1__XXAR",
    hiace: "1__van",
    hiluxm: "1__PICKUPMT",
    hilux: "1__FQBD",
    sw4: "1__OFBD",
  };

  /** Cloud API group_code values (readyrac.api.anyrent.pt) */
  const CAR_TO_API_GROUP = {
    tracker: "suvat",
    cross: "GFAM",
    spin: "XXAR",
    hiace: "van",
    hiluxm: "PICKUPMT",
    hilux: "FQBD",
    sw4: "OFBD",
  };

  const EXTRA_TO_API = {
    chains: "cadenas-de-nieve",
    infant: "silla-bebe",
    child: "silla-nino",
    afterhours: "fuera-de-horario",
  };

  function engineMode() {
    const q = new URL(location.href).searchParams.get("engine");
    if (q === "live" || q === "demo" || q === "bff") return q;
    try {
      // Default demo so public staging / accidental refreshes do not burn AnyRent quota.
      return localStorage.getItem("ready_engine") || "demo";
    } catch {
      return "demo";
    }
  }

  function setEngineMode(mode) {
    const next = mode === "live" || mode === "demo" || mode === "bff" ? mode : "demo";
    try {
      localStorage.setItem("ready_engine", next);
    } catch {
      /* ignore */
    }
  }

  /** Cycle only demo ↔ bff (read-only). October handoff stays opt-in via ?engine=live. */
  function cycleEngineMode() {
    const cur = engineMode();
    if (cur === "live") {
      setEngineMode("demo");
      return "demo";
    }
    const next = cur === "bff" ? "demo" : "bff";
    setEngineMode(next);
    return next;
  }

  /** AnyRent expects M/D/YYYY + g:i A */
  function toLiveDateParts(isoLocal) {
    const d = new Date(isoLocal);
    if (Number.isNaN(d.getTime())) return null;
    const date = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12;
    if (h === 0) h = 12;
    return { date, time: `${h}:${m} ${ampm}` };
  }

  function tripToLivePayload(trip) {
    const pickup = STATION_TO_LIVE[trip.pickup];
    const dropoff = STATION_TO_LIVE[trip.dropoff] || pickup;
    const from = toLiveDateParts(trip.from);
    const until = toLiveDateParts(trip.until);
    if (!pickup || !from || !until) {
      throw new Error("Incomplete trip for live handoff");
    }
    const age = trip.age21 === false ? "20" : String(trip.driverAge || 26);
    return {
      pickup_station: pickup,
      dropoff_station: dropoff,
      pickup_date: from.date,
      pickup_time: from.time,
      dropoff_date: until.date,
      dropoff_time: until.time,
      driver_age: age,
    };
  }

  /**
   * Path A: POST search into live site (October AJAX), then follow redirect.
   * Cross-origin: browsers block reading the JSON, so we also support a
   * same-tab form POST fallback that lands on the live domain.
   */
  function handoffToLiveBooking(trip, opts = {}) {
    const payload = tripToLivePayload(trip);
    const lang = opts.lang || "en";
    const action = `${LIVE_ORIGIN}/${lang}`;

    // Prefer a classic form POST so cookies/session stay on readyrentacar.com.ar
    const form = document.createElement("form");
    form.method = "POST";
    form.action = action;
    form.target = opts.newTab ? "_blank" : "_self";
    form.style.display = "none";

    Object.entries(payload).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = value;
      form.appendChild(input);
    });

    // Classic form POST with October handler field (works cross-origin)
    const handler = document.createElement("input");
    handler.type = "hidden";
    handler.name = "_handler";
    handler.value = "onMainFormPost";
    form.appendChild(handler);

    document.body.appendChild(form);
    form.submit();
  }

  /**
   * Build a deep-link style URL for ops / WhatsApp fallback when handoff fails.
   */
  function liveBookingHintUrl(trip, lang = "en") {
    try {
      const p = tripToLivePayload(trip);
      const u = new URL(`${LIVE_ORIGIN}/${lang}`);
      Object.entries(p).forEach(([k, v]) => u.searchParams.set(k, v));
      return u.toString();
    } catch {
      return `${LIVE_ORIGIN}/${lang}`;
    }
  }

  window.READY_JEDEYE = {
    LIVE_ORIGIN,
    STATION_TO_LIVE,
    LIVE_TO_STATION,
    CAR_TO_GID,
    CAR_TO_API_GROUP,
    EXTRA_TO_API,
    engineMode,
    setEngineMode,
    cycleEngineMode,
    toLiveDateParts,
    tripToLivePayload,
    handoffToLiveBooking,
    liveBookingHintUrl,
  };
})();
