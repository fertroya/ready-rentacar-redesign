(function () {
  const DATA = window.READY_DATA;
  const I18N = window.READY_I18N;
  const TRIP = window.READY_TRIP;

  function detectBase() {
    const scripts = document.querySelectorAll("script[src]");
    for (const s of scripts) {
      const src = s.getAttribute("src") || "";
      if (src.includes("js/app.js")) {
        return src.replace(/js\/app\.js.*$/, "");
      }
    }
    return "./";
  }

  const BASE = detectBase();
  DATA.basePath = BASE;

  // Clear any leftover theme experiments from localStorage
  try {
    localStorage.removeItem("ready_theme");
    document.documentElement.removeAttribute("data-theme");
  } catch (_) {}

  function getLang() {
    const url = new URL(location.href);
    const q = url.searchParams.get("lang");
    if (q && I18N[q]) {
      localStorage.setItem("ready_lang", q);
      return q;
    }
    return localStorage.getItem("ready_lang") || "en";
  }

  function setLang(lang) {
    localStorage.setItem("ready_lang", lang);
    const url = new URL(location.href);
    url.searchParams.set("lang", lang);
    url.searchParams.delete("theme");
    history.replaceState({}, "", url);
    applyI18n();
  }

  function t() {
    return I18N[getLang()] || I18N.en;
  }

  function pageName() {
    return document.body.dataset.page || "home";
  }

  function href(page) {
    const lang = getLang();
    const map = {
      home: "index.html",
      fleet: "fleet.html",
      stations: "stations.html",
      routes: "routes.html",
      extras: "extras.html",
      promos: "promos.html",
      services: "services.html",
      corporate: "corporate.html",
      quote: "quote.html",
      faqs: "faqs.html",
      contact: "contact.html",
    };
    return `${BASE}${map[page] || "index.html"}?lang=${lang}`;
  }

  function extraCopy(id) {
    return t().extras?.[id] || { name: id, desc: "" };
  }

  function extraIconHtml(ex) {
    if (ex.img) {
      return `<img class="extra-photo" src="${BASE}${ex.img}" alt="" width="64" height="64" loading="lazy" />`;
    }
    return `<span class="extra-emoji" aria-hidden="true">${ex.icon || ""}</span>`;
  }

  function normalizeExtras(raw) {
    const map = raw && typeof raw === "object" ? raw : {};
    const out = {};
    DATA.extras.forEach((ex) => {
      const n = Math.max(0, Math.min(ex.maxQty, Number(map[ex.id]) || 0));
      if (n > 0) out[ex.id] = n;
    });
    return out;
  }

  function extrasCost(extrasMap, days) {
    let total = 0;
    const lines = [];
    const map = normalizeExtras(extrasMap);
    DATA.extras.forEach((ex) => {
      const qty = map[ex.id] || 0;
      if (!qty) return;
      const amount = ex.pricing === "once" ? ex.amount * qty : ex.amount * qty * days;
      total += amount;
      lines.push({ id: ex.id, qty, amount, name: extraCopy(ex.id).name });
    });
    return { total, lines };
  }

  function seedExtrasFromFlags(trip) {
    const extras = normalizeExtras(trip.extras);
    if (trip.winter && !extras.chains) extras.chains = 1;
    if (trip.wantChild && !extras.child && !extras.infant) extras.child = 1;
    return extras;
  }

  function money(n) {
    return new Intl.NumberFormat(getLang() === "en" ? "en-US" : getLang() === "pt" ? "pt-BR" : "es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(n || 0);
  }

  function daysBetween(from, to) {
    const a = new Date(from);
    const b = new Date(to);
    const ms = b - a;
    if (Number.isNaN(ms) || ms <= 0) return 1;
    return Math.max(1, Math.ceil(ms / 86400000));
  }

  function onewayFee(pickup, dropoff) {
    if (!pickup || !dropoff || pickup === dropoff) return 0;
    const key = `${pickup}|${dropoff}`;
    const rev = `${dropoff}|${pickup}`;
    return DATA.onewayFees[key] || DATA.onewayFees[rev] || DATA.onewayFees.default;
  }

  function isWinterSeason(dateStr) {
    const d = new Date(dateStr || Date.now());
    const m = d.getMonth() + 1;
    return m >= 6 && m <= 9;
  }

  function stationOptions(selected, includeOther) {
    const dict = t().stations;
    const ids = ["brc", "cpc", "eqs", "fte", "ush", "mdz"];
    let html = ids
      .map((id) => `<option value="${id}" ${selected === id ? "selected" : ""}>${dict[id]}</option>`)
      .join("");
    if (includeOther) {
      html += `<option value="other" ${selected === "other" ? "selected" : ""}>${dict.other}</option>`;
    }
    return html;
  }

  function renderHeader() {
    const el = document.getElementById("site-header");
    if (!el) return;
    const dict = t();
    const page = pageName();
    const links = [
      ["fleet", dict.nav.fleet],
      ["stations", dict.nav.stations],
      ["routes", dict.nav.routes],
      ["extras", dict.nav.extras],
      ["promos", dict.nav.promos],
      ["services", dict.nav.services],
      ["corporate", dict.nav.corporate],
      ["faqs", dict.nav.faqs],
      ["contact", dict.nav.contact],
    ];
    el.innerHTML = `
      <a class="skip" href="#main">Skip</a>
      <a class="brand" href="${href("home")}">
        <img class="brand-mark" src="${BASE}../assets/logo.png" alt="" width="44" height="44" />
        <span class="brand-wordmark" aria-hidden="true">
          <span class="brand-ready">Ready</span>
          <span class="brand-rest">Rent a Car</span>
        </span>
        <span class="visually-hidden">Ready Rent-a-Car</span>
      </a>
      <nav class="nav-links" id="nav-links" aria-label="Primary">
        ${links
          .map(
            ([id, label]) =>
              `<a href="${href(id)}" class="${page === id ? "is-active" : ""}">${label}</a>`
          )
          .join("")}
      </nav>
      <div class="nav-actions">
        <div class="lang-switch" role="group" aria-label="Language">
          ${["en", "es", "pt"]
            .map(
              (l) =>
                `<button type="button" data-lang="${l}" class="${getLang() === l ? "is-active" : ""}">${I18N[l].langName}</button>`
            )
            .join("")}
        </div>
        <a class="btn btn-ghost btn-sm" href="${DATA.whatsappLink}" target="_blank" rel="noopener">WhatsApp</a>
        <a class="btn btn-ember btn-sm btn-header-quote" href="${href("quote")}">${dict.nav.quote}</a>
        <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-label="Menu">☰</button>
      </div>
    `;
    el.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => setLang(btn.dataset.lang));
    });
    const toggle = el.querySelector("#menu-toggle");
    const nav = el.querySelector("#nav-links");
    toggle?.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function renderFooter() {
    const el = document.getElementById("site-footer");
    if (!el) return;
    const dict = t();
    el.innerHTML = `
      <div class="footer-grid">
        <div>
          <a class="brand" href="${href("home")}">
            <img src="${BASE}../assets/logo.png" alt="" width="44" height="44" />
            <div>
              <strong>Ready Rent-a-Car</strong>
              <div class="footer-tag">${dict.footer.tag}</div>
            </div>
          </a>
        </div>
        <div>
          <h4>${dict.nav.quote}</h4>
          <ul>
            <li><a href="${href("quote")}">${dict.nav.quote}</a></li>
            <li><a href="${href("fleet")}">${dict.nav.fleet}</a></li>
            <li><a href="${href("extras")}">${dict.nav.extras}</a></li>
            <li><a href="${href("promos")}">${dict.nav.promos}</a></li>
            <li><a href="${href("stations")}">${dict.nav.stations}</a></li>
            <li><a href="${href("routes")}">${dict.nav.routes}</a></li>
          </ul>
        </div>
        <div>
          <h4>${dict.footer.partners || "Partners"}</h4>
          <ul>
            <li><a href="${DATA.partnerStay}" target="_blank" rel="noopener">Orillas del Gutiérrez</a></li>
            <li><a href="${DATA.facebook}" target="_blank" rel="noopener">Facebook</a></li>
          </ul>
        </div>
        <div>
          <h4>${dict.nav.contact}</h4>
          <ul>
            <li><a href="https://wa.me/${DATA.whatsapp}">+54 9 294 415-8889</a></li>
            <li><a href="mailto:${DATA.email}">${DATA.email}</a></li>
            <li><a href="${href("faqs")}">${dict.nav.faqs}</a></li>
            <li><a href="${href("corporate")}">${dict.nav.corporate}</a></li>
          </ul>
        </div>
      </div>
      <p class="fineprint">${dict.footer.legal}</p>
    `;
  }

  function bindSearchForm(form) {
    if (!form) return;
    const trip = TRIP.load();
    const float = document.getElementById("search-float");
    const hero = document.querySelector(".hero");
    const pickup = form.querySelector('[name="pickup"]');
    const dropoff = form.querySelector('[name="dropoff"]');
    const dropWrap = document.querySelector("[data-drop-wrap]");
    const oneway = document.getElementById("oneway") || form.querySelector('[name="oneway"]');
    const from = form.querySelector('[name="from"]');
    const until = form.querySelector('[name="until"]');
    const feeBox = document.querySelector("[data-oneway-fee]");
    const winterBox = document.querySelector("[data-winter-banner]");

    const defaultFrom = trip.from || "2026-07-20T10:00";
    const defaultUntil = trip.until || "2026-07-27T10:00";
    if (from) from.value = defaultFrom;
    if (until) until.value = defaultUntil;
    const defaultPickup = trip.pickup || "brc";
    const defaultDrop =
      trip.dropoff ||
      (trip.oneway ? "fte" : defaultPickup) ||
      defaultPickup;
    if (pickup) pickup.innerHTML = stationOptions(defaultPickup);
    if (dropoff) dropoff.innerHTML = stationOptions(defaultDrop, true);
    // Slim search always shows pickup + dropoff; one-way mirrors different stations
    if (dropWrap) dropWrap.classList.add("is-on");
    form.classList.add("has-drop");
    if (oneway) oneway.checked = Boolean(trip.oneway) || defaultPickup !== defaultDrop;

    let syncingStations = false;

    function sync() {
      const p = pickup?.value;
      const d = dropoff?.value || p;
      const isOne = Boolean(p && d && p !== d);
      if (oneway && oneway.checked !== isOne) oneway.checked = isOne;
      const fee = isOne ? onewayFee(p, d) : 0;
      if (feeBox) {
        const dict = t().search;
        feeBox.classList.toggle("is-on", Boolean(isOne && fee));
        feeBox.textContent = isOne && fee ? `${dict.feeLabel}: ${money(fee)}` : "";
      }
      if (winterBox) {
        const show = (p === "brc" || p === "cpc") && isWinterSeason(from?.value);
        winterBox.classList.toggle("is-on", show);
        winterBox.textContent = show ? t().home.winterNoteShort || t().home.winterNote : "";
      }
    }

    oneway?.addEventListener("change", () => {
      if (syncingStations) return;
      if (!oneway.checked && pickup && dropoff) {
        syncingStations = true;
        dropoff.value = pickup.value;
        syncingStations = false;
      } else if (oneway.checked && pickup && dropoff && dropoff.value === pickup.value) {
        // Suggest a common one-way destination when enabling
        syncingStations = true;
        dropoff.value = pickup.value === "brc" ? "fte" : "brc";
        syncingStations = false;
      }
      sync();
    });

    form.addEventListener("change", (e) => {
      if (syncingStations) return;
      if (e.target === oneway) return;
      sync();
    });
    sync();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const isOne = pickup.value !== dropoff.value;
      const payload = {
        pickup: pickup.value,
        dropoff: dropoff.value,
        oneway: isOne,
        from: from.value,
        until: until.value,
        age21: Boolean(document.querySelector('[name="age21"]')?.checked),
        onewayFee: isOne ? onewayFee(pickup.value, dropoff.value) : 0,
      };
      payload.extras = seedExtrasFromFlags(payload);
      TRIP.save(payload);

      const jedeye = window.READY_JEDEYE;
      if (jedeye && jedeye.engineMode() === "live") {
        try {
          jedeye.handoffToLiveBooking(payload, { lang: getLang() === "pt" ? "pt" : getLang() === "es" ? "es" : "en" });
          return;
        } catch (err) {
          console.warn("Live handoff failed, falling back to quote", err);
        }
      }
      location.href = href("quote");
    });

    // Sticky search: pin after leaving hero, keep spacer so strip stays readable
    const spacer = document.getElementById("search-spacer");
    const mq = window.matchMedia("(min-width: 701px)");

    function unpin() {
      if (!float) return;
      float.classList.remove("is-pinned");
      if (spacer) spacer.style.height = "0px";
    }

    function pin() {
      if (!float || !mq.matches) return;
      const h = float.offsetHeight;
      if (spacer) spacer.style.height = `${h}px`;
      float.classList.add("is-pinned");
    }

    function onScroll() {
      if (!float || !hero) return;
      if (!mq.matches) {
        unpin();
        return;
      }
      const heroBottom = hero.getBoundingClientRect().bottom;
      if (heroBottom < 80) pin();
      else unpin();
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => {
      if (float?.classList.contains("is-pinned") && spacer) {
        spacer.style.height = `${float.offsetHeight}px`;
      }
      onScroll();
    });
    onScroll();
  }

  function carImg(c) {
    if (!c?.img) return "";
    if (/^https?:\/\//.test(c.img)) return c.img;
    return `${BASE}${c.img}`;
  }

  function carLabel(id) {
    return t().cars[id] || { name: id, similar: "", tags: "" };
  }

  function renderFleetGrid(container, filter = "all") {
    if (!container) return;
    const dict = t().fleetPage;
    container.innerHTML = DATA.cars
      .filter((c) => {
        if (filter === "all") return true;
        if (filter === "corporate") return c.corporate;
        return c.fit.includes(filter);
      })
      .map((c) => {
        const label = carLabel(c.id);
        return `
          <article class="card fleet-card" data-id="${c.id}">
            <div class="card-media fleet-photo" style="background-image:url('${carImg(c)}')"></div>
            <div class="card-body">
              <h3>${label.name}${c.isNew ? `<span class="badge-new">NEW</span>` : ""}${c.corporate ? ` <span class="chip-dark">${dict.corporate}</span>` : ""}</h3>
              <p style="margin:0;color:var(--muted)">${label.similar}</p>
              <ul class="specs"><li>${label.tags}</li></ul>
              <div class="fleet-foot">
                <span class="price-hint">${dict.from}</span>
                <a class="btn btn-solid btn-sm" href="${href("quote")}&car=${c.id}" data-select-car="${c.id}">${dict.select}</a>
              </div>
            </div>
          </article>`;
      })
      .join("");
    container.querySelectorAll("[data-select-car]").forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        TRIP.save({ carId: a.dataset.selectCar });
        location.href = href("quote");
      });
    });
  }

  function applyHome() {
    const dict = t();
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    set("eyebrow", dict.home.eyebrow);
    // Hero brand is the Ready logo (image); keep alt in HTML — do not replace with plain text
    set("hero-lede", dict.home.lede);
    ["1", "2", "3", "4"].forEach((n) => {
      set(`strip${n}t`, dict.home[`strip${n}t`]);
      set(`strip${n}d`, dict.home[`strip${n}d`]);
    });
    set("routes-title", dict.home.routesTitle);
    set("routes-lede", dict.home.routesLede);
    set("why-title", dict.home.whyTitle);
    set("why-lede", dict.home.whyLede);
    set("why1t", dict.home.why1t);
    set("why1d", dict.home.why1d);
    set("why2t", dict.home.why2t);
    set("why2d", dict.home.why2d);
    set("why3t", dict.home.why3t);
    set("why3d", dict.home.why3d);
    set("mp-title", dict.home.mpTitle);
    set("mp-lede", dict.home.mpLede);
    set("mp-cta", dict.home.mpCta);
    set("fleet-title", dict.home.fleetTitle);
    set("fleet-lede", dict.home.fleetLede);
    set("stations-title", dict.home.stationsTitle);
    set("stations-lede", dict.home.stationsLede);

    const search = t().search;
    const mapLabel = {
      "label-pickup": search.pickup,
      "label-dropoff": search.dropoff,
      "label-from": search.from,
      "label-until": search.until,
      "label-oneway": search.oneway,
      "label-age21": search.age21,
      "search-submit": search.submit,
      "extras-title": dict.home.extrasTitle,
      "extras-lede": dict.home.extrasLede,
    };
    Object.entries(mapLabel).forEach(([id, val]) => set(id, val));

    const homeExtras = document.getElementById("home-extras");
    if (homeExtras) {
      const exDict = dict.extras;
      homeExtras.innerHTML = DATA.extras
        .filter((ex) => ex.common)
        .map((ex) => {
          const copy = exDict[ex.id] || { name: ex.id, desc: "" };
          return `
            <article class="extra-card">
              <div class="extra-icon" aria-hidden="true">${extraIconHtml(ex)}</div>
              <h3>${copy.name}</h3>
              <p>${copy.desc}</p>
              <div class="extra-meta">
                <span>${money(ex.amount)}${exDict.perDay}</span>
                ${ex.seasonal ? `<span class="tag-season">${exDict.seasonal}</span>` : ""}
              </div>
            </article>`;
        })
        .join("");
    }
    const extrasMore = document.getElementById("extras-more");
    if (extrasMore) {
      extrasMore.href = href("extras");
      extrasMore.textContent = dict.home.extrasCta + " →";
    }

    const routes = document.getElementById("route-grid");
    if (routes) {
      const r = dict.routes;
      const imgs = DATA.routeImages;
      routes.innerHTML = ["lakes", "r40", "winter", "fin"]
        .map(
          (k) => `
          <a class="route-card" href="${href("quote")}" style="background-image:url('${imgs[k]}')">
            <h3>${r[k].t}</h3>
            <p>${r[k].d}</p>
            <span class="chip">${r[k].c}</span>
          </a>`
        )
        .join("");
    }

    const stations = document.getElementById("station-grid");
    if (stations) {
      stations.innerHTML = DATA.stations
        .map((s) => {
          const label = dict.stations[s.id];
          return `<a class="station-card" href="${href("quote")}" data-set-pickup="${s.id}"><strong>${label}</strong><span>${s.address}</span></a>`;
        })
        .join("");
      stations.querySelectorAll("[data-set-pickup]").forEach((a) => {
        a.addEventListener("click", () => TRIP.save({ pickup: a.dataset.setPickup }));
      });
    }

    renderFleetGrid(document.getElementById("home-fleet"), "all");
    bindSearchForm(document.getElementById("home-search"));

    const mpCta = document.getElementById("mp-cta");
    if (mpCta) mpCta.href = href("quote");
    const whyMore = document.getElementById("why-more");
    if (whyMore) {
      whyMore.href = href("services");
      whyMore.textContent = dict.nav.services + " →";
    }
    const fleetMore = document.getElementById("fleet-more");
    if (fleetMore) {
      fleetMore.href = href("fleet");
      fleetMore.textContent = dict.nav.fleet + " →";
    }

    const sticky = document.getElementById("sticky-cta");
    if (sticky) sticky.remove();
  }

  function applyFleetPage() {
    const dict = t().fleetPage;
    document.getElementById("page-title").textContent = dict.title;
    document.getElementById("page-lede").textContent = dict.lede;
    const filters = document.getElementById("fleet-filters");
    const keys = ["all", "suv", "4x4", "family", "pickup", "corporate"];
    filters.innerHTML = keys
      .map((k) => `<button type="button" data-filter="${k}" class="${k === "all" ? "is-active" : ""}">${dict[k]}</button>`)
      .join("");
    const grid = document.getElementById("fleet-grid");
    renderFleetGrid(grid, "all");
    filters.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-filter]");
      if (!btn) return;
      filters.querySelectorAll("button").forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      renderFleetGrid(grid, btn.dataset.filter);
    });
  }

  function applyStationsPage() {
    const dict = t();
    document.getElementById("page-title").textContent = dict.stationsPage.title;
    document.getElementById("page-lede").textContent = dict.stationsPage.lede;
    document.getElementById("policy-title").textContent = dict.stationsPage.policyTitle;
    document.getElementById("policy-body").textContent = dict.stationsPage.policyBody;
    const grid = document.getElementById("stations-list");
    grid.innerHTML = DATA.stations
      .map((s) => {
        const label = dict.stations[s.id];
        return `
          <article class="card">
            <div class="card-body">
              <h3>${label}</h3>
              <p style="color:var(--muted);margin:0 0 8px">${s.address}</p>
              <p style="margin:0;font-size:.9rem">${s.hours}</p>
              <div style="margin-top:14px">
                <a class="btn btn-solid btn-sm" href="${href("quote")}" data-set-pickup="${s.id}">${dict.nav.quote}</a>
              </div>
            </div>
          </article>`;
      })
      .join("");
    grid.querySelectorAll("[data-set-pickup]").forEach((a) => {
      a.addEventListener("click", () => TRIP.save({ pickup: a.dataset.setPickup }));
    });
  }

  function applyRoutesPage() {
    const dict = t();
    document.getElementById("page-title").textContent = dict.home.routesTitle;
    document.getElementById("page-lede").textContent = dict.home.routesLede;
    const grid = document.getElementById("routes-list");
    const r = dict.routes;
    const imgs = DATA.routeImages;
    grid.innerHTML = ["lakes", "r40", "winter", "fin"]
      .map(
        (k) => `
        <a class="route-card" style="min-height:280px;background-image:url('${imgs[k]}')" href="${href("quote")}" data-route="${k}">
          <h3>${r[k].t}</h3>
          <p>${r[k].d}</p>
          <span class="chip">${r[k].c}</span>
        </a>`
      )
      .join("");
    grid.querySelector('[data-route="r40"]')?.addEventListener("click", () => {
      TRIP.save({ pickup: "brc", dropoff: "fte", oneway: true, onewayFee: onewayFee("brc", "fte") });
    });
    grid.querySelector('[data-route="winter"]')?.addEventListener("click", () => {
      TRIP.save({ pickup: "brc", winter: true });
    });
    grid.querySelector('[data-route="fin"]')?.addEventListener("click", () => {
      TRIP.save({ pickup: "ush" });
    });
  }

  function applyServicesPage() {
    const dict = t().servicesPage;
    document.getElementById("page-title").textContent = dict.title;
    document.getElementById("page-lede").textContent = dict.lede;
    document.getElementById("s1t").textContent = dict.s1t;
    document.getElementById("s1d").textContent = dict.s1d;
    document.getElementById("s2t").textContent = dict.s2t;
    document.getElementById("s2d").textContent = dict.s2d;
    document.getElementById("s3t").textContent = dict.s3t;
    document.getElementById("s3d").textContent = dict.s3d;
    document.getElementById("vs-title").textContent = dict.vsTitle;
    document.getElementById("vs-body").textContent = dict.vsBody;
  }

  function applyCorporatePage() {
    const dict = t().corporatePage;
    document.getElementById("page-title").textContent = dict.title;
    document.getElementById("page-lede").textContent = dict.lede;
    document.getElementById("corp-cta").textContent = dict.cta;
    document.getElementById("corp-cta").href = href("quote");
    document.getElementById("b1").textContent = dict.b1;
    document.getElementById("b2").textContent = dict.b2;
    document.getElementById("b3").textContent = dict.b3;
    renderFleetGrid(document.getElementById("corp-fleet"), "corporate");
  }

  function applyFaqsPage() {
    const dict = t().faqsPage;
    document.getElementById("page-title").textContent = dict.title;
    document.getElementById("faq-list").innerHTML = dict.items
      .map((item, i) => `<details ${i === 0 ? "open" : ""}><summary>${item.q}</summary><p>${item.a}</p></details>`)
      .join("");
  }

  function applyExtrasPage() {
    const dict = t();
    const page = dict.extrasPage;
    document.getElementById("page-title").textContent = page.title;
    document.getElementById("page-lede").textContent = page.lede;
    const cta = document.getElementById("extras-cta");
    if (cta) {
      cta.textContent = page.cta;
      cta.href = href("quote");
    }
    const grid = document.getElementById("extras-grid");
    if (!grid) return;
    const exDict = dict.extras;
    grid.innerHTML = DATA.extras
      .map((ex) => {
        const copy = exDict[ex.id] || { name: ex.id, desc: "" };
        return `
          <article class="extra-card">
            <div class="extra-icon" aria-hidden="true">${extraIconHtml(ex)}</div>
            <h3>${copy.name}</h3>
            <p>${copy.desc}</p>
            <div class="extra-meta">
              <span>${money(ex.amount)}${exDict.perDay}</span>
              ${ex.seasonal ? `<span class="tag-season">${exDict.seasonal}</span>` : ""}
            </div>
          </article>`;
      })
      .join("");
  }

  function applyPromosPage() {
    const dict = t().promosPage;
    document.getElementById("page-title").textContent = dict.title;
    document.getElementById("page-lede").textContent = dict.lede;
    const grid = document.getElementById("promos-grid");
    if (!grid) return;
    grid.innerHTML = DATA.promotions
      .map((p) => {
        const copy = dict[p.id] || { t: p.id, d: "" };
        return `
          <article class="extra-card">
            <h3>${copy.t}</h3>
            <p>${copy.d}</p>
            <div class="extra-meta">
              <a class="btn btn-solid btn-sm" href="${p.href}" target="_blank" rel="noopener">${dict.open}</a>
            </div>
          </article>`;
      })
      .join("");
  }

  function applyContactPage() {
    const dict = t().contactPage;
    document.getElementById("page-title").textContent = dict.title;
    document.getElementById("page-lede").textContent = dict.lede;
    document.getElementById("c-reservas-l").textContent = dict.reservas;
    document.getElementById("c-ops-l").textContent = dict.ops;
    document.getElementById("c-admin-l").textContent = dict.admin;
    document.getElementById("c-email-l").textContent = dict.email;
    document.getElementById("c-hours-l").textContent = dict.hours;
    document.getElementById("c-hours-v").textContent = dict.hoursVal;
    document.getElementById("c-partners-l").textContent = dict.partners;
    document.getElementById("c-social-l").textContent = dict.social;
  }

  function applyQuotePage() {
    const dict = t();
    const q = dict.quotePage;
    document.getElementById("page-title").textContent = q.title;
    document.getElementById("page-lede").textContent = q.lede;

    const trip = TRIP.load();
    const urlCar = new URL(location.href).searchParams.get("car");
    if (urlCar) TRIP.save({ carId: urlCar });
    if (!trip.extras || !Object.keys(trip.extras).length) {
      TRIP.save({ extras: seedExtrasFromFlags(trip) });
    }

    let step = 1;
    let maxReached = 1;
    /** @type {null | { groups: any[], query: any, fetchedAt: number, tripKey: string }} */
    let bffQuote = null;
    let bffError = "";
    let bffLoading = false;

    const panels = [...document.querySelectorAll("[data-qpanel]")];
    const pills = [...document.querySelectorAll("[data-qstep]")];
    const errBox = document.getElementById("quote-error");
    const sticky = document.getElementById("quote-sticky");
    const stickyTotal = document.getElementById("quote-sticky-total");
    const stickyCta = document.getElementById("quote-sticky-cta");
    const stage = document.getElementById("quote-stage");
    const trailFill = document.getElementById("trail-fill");
    const trailProgress = document.getElementById("trail-progress");
    const stageKicker = document.getElementById("quote-stage-kicker");
    const quoteEyebrow = document.getElementById("quote-eyebrow");

    function stepShort(raw) {
      return String(raw || "").replace(/^\d+\s*[·.\-–—]\s*/, "").trim();
    }

    function stageCopy(n) {
      const keys = {
        1: q.stage1,
        2: q.stage2,
        3: useCoverMatrix() ? q.stage3Cover || q.stage3 : q.stage3,
        4: q.stage4,
        5: q.stage5,
      };
      return keys[n] || "";
    }

    function useBff() {
      return window.READY_JEDEYE?.engineMode() === "bff" && window.READY_BFF;
    }

    function useCoverMatrix() {
      return Boolean(window.READY_FLAGS?.isEnabled("insuranceMatrix"));
    }

    function planLabel(id) {
      if (id === "total") return q.coverPlanTotal || "Total";
      if (id === "premium") return q.coverPlanPremium || "Premium";
      return q.coverPlanCdw || "Basic CDW";
    }

    function resolveInsurancePlan(stored) {
      if (useCoverMatrix()) {
        const p = stored.insurancePlan || (stored.premium ? "premium" : "cdw");
        return p === "total" || p === "premium" ? p : "cdw";
      }
      const p = stored.insurancePlan || (stored.premium ? "premium" : "cdw");
      return p === "premium" ? "premium" : "cdw";
    }

    function insuranceQuote(plan, days, live) {
      const demo = DATA.demoInsurance?.[plan] || DATA.demoInsurance?.cdw || {};
      if (live && window.READY_BFF) {
        const code = DATA.insurances.find((i) => i.id === plan)?.liveCode;
        const hit = window.READY_BFF.insuranceDaily(live.insurances, code);
        if (hit) {
          return {
            daily: hit.daily,
            cost: hit.daily * days,
            excess: hit.excess,
            deposit: hit.deposit,
            name: hit.name || planLabel(plan),
          };
        }
      }
      const daily =
        plan === "total" ? DATA.totalDaily || 0 : plan === "premium" ? DATA.premiumDaily || 0 : 0;
      return {
        daily,
        cost: daily * days,
        excess: demo.excess ?? null,
        deposit: demo.deposit ?? null,
        name: planLabel(plan),
      };
    }

    function tripKey(t) {
      return [t.pickup, t.dropoff, t.from, t.until, t.oneway ? "1" : "0"].join("|");
    }

    function setError(msg) {
      if (!errBox) return;
      if (!msg) {
        errBox.hidden = true;
        errBox.textContent = "";
        return;
      }
      errBox.hidden = false;
      errBox.textContent = msg;
    }

    function datesOk() {
      const a = new Date(from.value).getTime();
      const b = new Date(until.value).getTime();
      return !Number.isNaN(a) && !Number.isNaN(b) && b > a;
    }

    function syncStageMedia() {
      const media = stage?.querySelector(".quote-stage-media");
      if (!media) return;
      const carId = TRIP.load().carId;
      const car = DATA.cars.find((c) => c.id === carId);
      const live = carId ? liveForCar(carId) : null;
      const img = step === 2 && car ? live?.imageUrl || carImg(car) : "";
      if (img) {
        media.style.backgroundImage = `url("${img}")`;
        media.classList.add("is-fleet-hero");
      } else {
        media.style.backgroundImage = "";
        media.classList.remove("is-fleet-hero");
      }
    }

    function updateStepChrome() {
      pills.forEach((p) => {
        const n = Number(p.dataset.qstep);
        p.classList.toggle("is-active", n === step);
        p.classList.toggle("is-done", n < step);
        p.disabled = n > maxReached;
        p.setAttribute("aria-current", n === step ? "step" : "false");
      });
      const step3 = document.getElementById("q-step3-label");
      if (step3) {
        const raw = useCoverMatrix() ? q.step3Cover || q.step3 : q.step3;
        step3.textContent = stepShort(raw);
      }
      if (stage) {
        stage.dataset.step = String(step);
        // Retrigger media subtle fade by toggling class
        stage.classList.remove("is-shifting");
        void stage.offsetWidth;
        stage.classList.add("is-shifting");
      }
      if (trailFill) {
        const pct = Math.max(8, Math.round(((step - 1) / 4) * 100));
        trailFill.style.width = `${pct}%`;
      }
      if (trailProgress) {
        const tpl = q.progressMark || "{current} / {total}";
        trailProgress.textContent = tpl.replace("{current}", String(step)).replace("{total}", "5");
      }
      if (stageKicker) stageKicker.textContent = stageCopy(step);
      if (quoteEyebrow) {
        quoteEyebrow.textContent = q.eyebrow || "Ready";
      }
      if (sticky && stickyCta) {
        sticky.hidden = false;
        const labels = {
          1: q.stickyVehicles || q.showCars,
          2: q.stickyContinue || q.continue,
          3: q.stickyContinue || q.continue,
          4: q.stickyContinue || q.continue,
          5: q.stickyWhatsApp || q.payCtaSafe,
        };
        stickyCta.textContent = labels[step] || q.continue;
      }
      syncStageMedia();
    }

    function goNext() {
      if (step === 1) document.getElementById("to-step-2")?.click();
      else if (step === 2) document.getElementById("to-step-3")?.click();
      else if (step === 3) document.getElementById("to-step-4")?.click();
      else if (step === 4) document.getElementById("to-step-5")?.click();
      else if (step === 5) form.requestSubmit();
    }

    function show(n) {
      step = n;
      maxReached = Math.max(maxReached, n);
      panels.forEach((p) => {
        p.hidden = Number(p.dataset.qpanel) !== n;
      });
      updateStepChrome();
      if (n === 3) {
        renderCoverMatrix();
        renderCoverSimple();
        renderExtras();
      }
      renderSummary();
      setError("");
      // Keep stage + sticky site header in view (don't jump into the panel)
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    const form = document.getElementById("quote-form");
    const pickup = form.querySelector('[name="pickup"]');
    const dropoff = form.querySelector('[name="dropoff"]');
    const oneway = form.querySelector('[name="oneway"]');
    const from = form.querySelector('[name="from"]');
    const until = form.querySelector('[name="until"]');
    const dropWrap = form.querySelector("[data-drop-wrap]");

    pickup.innerHTML = stationOptions(trip.pickup || "brc");
    dropoff.innerHTML = stationOptions(trip.dropoff || "fte", true);
    from.value = trip.from || "2026-08-01T10:00";
    until.value = trip.until || "2026-08-08T10:00";
    oneway.checked = Boolean(trip.oneway) || trip.pickup !== trip.dropoff;
    // Prefill extras once from trip flags (e.g. winter route) — not shown again in step 1
    const seeded = seedExtrasFromFlags(trip);
    if (JSON.stringify(seeded) !== JSON.stringify(normalizeExtras(trip.extras))) {
      TRIP.save({ extras: seeded });
    }
    if (!TRIP.load().insurancePlan) {
      TRIP.save({
        insurancePlan: trip.premium ? "premium" : "cdw",
        premium: Boolean(trip.premium),
      });
    }
    const nameInput = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const notesInput = form.querySelector('[name="notes"]');
    if (nameInput && trip.name) nameInput.value = trip.name;
    if (emailInput && trip.email) emailInput.value = trip.email;
    if (phoneInput && trip.phone) phoneInput.value = trip.phone;
    if (notesInput && trip.notes) notesInput.value = trip.notes;
    dropWrap.hidden = !oneway.checked;

    document.getElementById("q-step1-label").textContent = stepShort(q.step1);
    document.getElementById("q-step2-label").textContent = stepShort(q.step2);
    document.getElementById("q-step3-label").textContent = stepShort(
      useCoverMatrix() ? q.step3Cover || q.step3 : q.step3
    );
    document.getElementById("q-step4-label").textContent = stepShort(q.step4);
    document.getElementById("q-step5-label").textContent = stepShort(q.step5);
    document.querySelectorAll(".page-quote [data-i18n]").forEach((el) => {
      const key = el.dataset.i18n;
      const parts = key.split(".");
      let cur = dict;
      for (const p of parts) cur = cur?.[p];
      if (typeof cur === "string") {
        if (el.tagName === "TEXTAREA" || (el.tagName === "INPUT" && el.type !== "radio" && el.type !== "checkbox")) {
          if (el.placeholder !== undefined) el.placeholder = cur;
        } else el.textContent = cur;
      }
    });

    const payCta = form.querySelector('[type="submit"]');
    if (payCta) payCta.textContent = q.payCtaSafe || q.payCta;

    pills.forEach((p) => {
      p.addEventListener("click", () => {
        const n = Number(p.dataset.qstep);
        if (n <= maxReached) show(n);
      });
    });
    stickyCta?.addEventListener("click", goNext);

    oneway.addEventListener("change", () => {
      dropWrap.hidden = !oneway.checked;
      renderSummary();
    });
    form.addEventListener("change", renderSummary);

    document.getElementById("to-step-2")?.addEventListener("click", async () => {
      if (!datesOk()) {
        setError(q.dateError || "Return must be after pick-up.");
        return;
      }
      setError("");
      const payload = readTrip();
      payload.extras = seedExtrasFromFlags({ ...TRIP.load(), ...payload });
      TRIP.save(payload);
      await loadBffQuote(true);
      if (useBff() && bffQuote?.groups?.[0]) {
        const sample = window.READY_BFF.pricingFromGroup(bffQuote.groups[0]);
        DATA.extras.forEach((ex) => {
          if (!ex.liveCode) return;
          const p = window.READY_BFF.extraUnitPrice(sample.extras, ex.liveCode);
          if (p != null) ex.amount = p;
        });
        const pcdw = window.READY_BFF.insuranceDaily(sample.insurances, "PCDW");
        if (pcdw) DATA.premiumDaily = pcdw.daily;
        const total = window.READY_BFF.insuranceDaily(sample.insurances, "SEGURO TOTAL");
        if (total) DATA.totalDaily = total.daily;
      }
      renderCars();
      show(2);
    });
    document.getElementById("back-1")?.addEventListener("click", () => show(1));
    document.getElementById("to-step-3")?.addEventListener("click", () => {
      if (!TRIP.load().carId) {
        setError(q.pickCar || "Select a vehicle");
        return;
      }
      setError("");
      show(3);
    });
    document.getElementById("back-2")?.addEventListener("click", () => show(2));
    document.getElementById("to-step-4")?.addEventListener("click", () => {
      TRIP.save({ extras: readExtrasFromUi() });
      show(4);
    });
    document.getElementById("back-3")?.addEventListener("click", () => show(3));
    document.getElementById("to-step-5")?.addEventListener("click", () => {
      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const phone = form.querySelector('[name="phone"]');
      if (!name.reportValidity() || !email.reportValidity() || !phone.reportValidity()) return;
      TRIP.save({
        ...readTrip(),
        extras: TRIP.load().extras || {},
        name: name.value.trim(),
        email: email.value.trim(),
        phone: phone.value.trim(),
        notes: form.querySelector('[name="notes"]').value.trim(),
      });
      show(5);
    });
    document.getElementById("back-4")?.addEventListener("click", () => show(4));

    async function loadBffQuote(force = false) {
      if (!useBff()) {
        bffQuote = null;
        bffError = "";
        return null;
      }
      const tnow = readTrip();
      const key = tripKey(tnow);
      if (!force && bffQuote && bffQuote.tripKey === key) return bffQuote;
      bffLoading = true;
      bffError = "";
      renderCars();
      renderSummary();
      try {
        const lang = getLang() === "pt" ? "pt" : getLang() === "es" ? "es" : "en";
        const res = await window.READY_BFF.fetchPrices(tnow, lang);
        bffQuote = { ...res, tripKey: key, fetchedAt: Date.now() };
        bffError = res.groups?.length ? "" : q.bffEmpty || "No rates for these dates";
      } catch (err) {
        console.warn("BFF quote failed", err);
        bffQuote = null;
        bffError = err.message || "BFF error";
      } finally {
        bffLoading = false;
      }
      return bffQuote;
    }

    function liveForCar(carId) {
      if (!bffQuote?.groups?.length) return null;
      const g = window.READY_BFF.groupForCar(carId, bffQuote.groups);
      return window.READY_BFF.pricingFromGroup(g);
    }

    function readTrip() {
      const isOne = oneway.checked;
      const plan = resolveInsurancePlan(TRIP.load());
      return {
        pickup: pickup.value,
        dropoff: isOne ? dropoff.value : pickup.value,
        oneway: isOne,
        from: from.value,
        until: until.value,
        winter: Boolean(TRIP.load().winter) || Boolean(normalizeExtras(TRIP.load().extras).chains),
        wantChild:
          Boolean(TRIP.load().wantChild) ||
          Boolean(normalizeExtras(TRIP.load().extras).child || normalizeExtras(TRIP.load().extras).infant),
        premium: plan === "premium",
        insurancePlan: plan,
        onewayFee: isOne ? onewayFee(pickup.value, dropoff.value) : 0,
        age21: true,
        pay: form.querySelector('input[name="pay"]:checked')?.value || "mercadopago",
      };
    }

    function extrasCostLive(extrasMap, days, live) {
      const map = normalizeExtras(extrasMap);
      let total = 0;
      const lines = [];
      const exDict = dict.extras;
      DATA.extras.forEach((ex) => {
        const qty = map[ex.id] || 0;
        if (!qty) return;
        let unit = ex.amount;
        if (live && ex.liveCode) {
          const p = window.READY_BFF.extraUnitPrice(live.extras, ex.liveCode);
          if (p != null) unit = p;
        }
        const amount = ex.pricing === "once" ? unit * qty : unit * qty * days;
        total += amount;
        lines.push({ id: ex.id, name: exDict[ex.id]?.name || ex.id, qty, amount });
      });
      return { total, lines };
    }

    function renderCoverMatrix() {
      const box = document.getElementById("cover-matrix");
      if (!box) return;
      if (!useCoverMatrix()) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      box.hidden = false;
      const stored = TRIP.load();
      const plan = resolveInsurancePlan(stored);
      const days = daysBetween(from.value, until.value);
      const live = liveForCar(stored.carId);
      const rows = DATA.coverageCompare?.rows || [];
      const rowNames = q.coverRows || {};
      const plans = DATA.coverageCompare?.plans || ["cdw", "premium", "total"];
      const meta = {
        cdw: { title: q.coverPlanCdw, hint: q.coverPlanCdwHint },
        premium: { title: q.coverPlanPremium, hint: q.coverPlanPremiumHint },
        total: { title: q.coverPlanTotal, hint: q.coverPlanTotalHint },
      };

      const cards = plans
        .map((id) => {
          const quote = insuranceQuote(id, days, live);
          const selected = plan === id;
          const priceLine =
            quote.daily <= 0
              ? q.coverIncluded || "Included"
              : `${money(quote.daily)}${q.coverPerDay || "/ day"}`;
          const features = rows
            .map((row) => {
              const ok = Boolean(row[id]);
              return `<li class="${ok ? "is-yes" : "is-no"}"><span aria-hidden="true">${ok ? "✓" : "–"}</span> ${rowNames[row.id] || row.id}</li>`;
            })
            .join("");
          return `
            <label class="cover-card ${selected ? "is-selected" : ""}">
              <input type="radio" name="insurancePlan" value="${id}" ${selected ? "checked" : ""} />
              <div class="cover-card-top">
                <strong>${meta[id]?.title || id}</strong>
                <span class="cover-hint">${meta[id]?.hint || ""}</span>
                <div class="cover-price">${priceLine}</div>
              </div>
              <ul class="cover-features">${features}</ul>
              <div class="cover-money">
                <div><span>${q.coverExcess || "Excess"}</span><strong>${quote.excess != null ? money(quote.excess) : "—"}</strong></div>
                <div><span>${q.coverDeposit || "Deposit"}</span><strong>${quote.deposit != null ? money(quote.deposit) : "—"}</strong></div>
              </div>
              <span class="cover-cta">${selected ? q.coverSelected || "Selected" : q.coverSelect || "Select"}</span>
            </label>`;
        })
        .join("");

      box.innerHTML = `
        <div class="cover-head">
          <h3>${q.coverTitle || "Coverage"}</h3>
          <p>${q.coverLede || ""}</p>
        </div>
        <div class="cover-grid" role="radiogroup" aria-label="${q.coverTitle || "Coverage"}">${cards}</div>
      `;
      box.querySelectorAll('input[name="insurancePlan"]').forEach((input) => {
        input.addEventListener("change", () => {
          const next = input.value;
          TRIP.save({
            insurancePlan: next,
            premium: next === "premium",
          });
          renderCoverMatrix();
          renderCoverSimple();
          renderSummary();
        });
      });
    }

    function renderCoverSimple() {
      const box = document.getElementById("cover-simple");
      if (!box) return;
      if (useCoverMatrix()) {
        box.hidden = true;
        box.innerHTML = "";
        return;
      }
      box.hidden = false;
      const plan = resolveInsurancePlan(TRIP.load());
      const days = daysBetween(from.value, until.value);
      const live = liveForCar(TRIP.load().carId);
      const basic = insuranceQuote("cdw", days, live);
      const premiumQ = insuranceQuote("premium", days, live);
      box.innerHTML = `
        <div class="cover-head">
          <h3>${q.coverSimpleTitle || "Coverage"}</h3>
          <p>${q.coverSimpleLede || ""}</p>
        </div>
        <div class="cover-simple-grid" role="radiogroup">
          <label class="cover-card ${plan === "cdw" ? "is-selected" : ""}">
            <input type="radio" name="insurancePlanSimple" value="cdw" ${plan === "cdw" ? "checked" : ""} />
            <div class="cover-card-top">
              <strong>${q.coverPlanCdw}</strong>
              <span class="cover-hint">${q.coverPlanCdwHint}</span>
              <div class="cover-price">${q.coverIncluded}</div>
            </div>
            <div class="cover-money">
              <div><span>${q.coverExcess}</span><strong>${basic.excess != null ? money(basic.excess) : "—"}</strong></div>
              <div><span>${q.coverDeposit}</span><strong>${basic.deposit != null ? money(basic.deposit) : "—"}</strong></div>
            </div>
          </label>
          <label class="cover-card ${plan === "premium" ? "is-selected" : ""}">
            <input type="radio" name="insurancePlanSimple" value="premium" ${plan === "premium" ? "checked" : ""} />
            <div class="cover-card-top">
              <strong>${q.coverPlanPremium}</strong>
              <span class="cover-hint">${q.coverPlanPremiumHint}</span>
              <div class="cover-price">${premiumQ.daily > 0 ? `${money(premiumQ.daily)}${q.coverPerDay}` : q.coverIncluded}</div>
            </div>
            <div class="cover-money">
              <div><span>${q.coverExcess}</span><strong>${premiumQ.excess != null ? money(premiumQ.excess) : "—"}</strong></div>
              <div><span>${q.coverDeposit}</span><strong>${premiumQ.deposit != null ? money(premiumQ.deposit) : "—"}</strong></div>
            </div>
          </label>
        </div>
      `;
      box.querySelectorAll('input[name="insurancePlanSimple"]').forEach((input) => {
        input.addEventListener("change", () => {
          TRIP.save({ insurancePlan: input.value, premium: input.value === "premium" });
          renderCoverSimple();
          renderSummary();
        });
      });
    }

    function persistExtras(map) {
      TRIP.save({
        extras: map,
        winter: Boolean(map.chains),
        wantChild: Boolean(map.child || map.infant),
      });
      renderSummary();
    }

    function renderExtras() {
      const list = document.getElementById("quote-extras");
      if (!list) return;
      const selected = normalizeExtras(TRIP.load().extras);
      const exDict = dict.extras;
      const live = liveForCar(TRIP.load().carId);
      list.innerHTML = DATA.extras
        .map((ex) => {
          const copy = exDict[ex.id] || { name: ex.id, desc: "" };
          const qty = selected[ex.id] || 0;
          let unit = ex.amount;
          if (live && ex.liveCode) {
            const p = window.READY_BFF.extraUnitPrice(live.extras, ex.liveCode);
            if (p != null) unit = p;
          }
          const price = `${money(unit)}${ex.pricing === "once" ? "" : exDict.perDay}`;
          const title = `${copy.name}${ex.seasonal ? ` · ${exDict.seasonal}` : ""}`;
          if (ex.maxQty <= 1) {
            const on = qty > 0;
            return `
              <button type="button" class="extra-row extra-toggle ${on ? "is-on" : ""}" data-extra-toggle="${ex.id}" aria-pressed="${on}">
                <div class="extra-icon" aria-hidden="true">${extraIconHtml(ex)}</div>
                <div class="extra-copy">
                  <h4>${title}</h4>
                  <p>${copy.desc} · ${price}</p>
                </div>
                <span class="extra-toggle-state">${on ? q.added || "Added" : q.add || "Add"}</span>
              </button>`;
          }
          return `
            <div class="extra-row ${qty ? "is-on" : ""}" data-extra-row="${ex.id}">
              <div class="extra-icon" aria-hidden="true">${extraIconHtml(ex)}</div>
              <div class="extra-copy">
                <h4>${title}</h4>
                <p>${copy.desc} · ${price}</p>
              </div>
              <div class="qty-stepper" data-extra-stepper="${ex.id}">
                <button type="button" class="qty-btn" data-extra-dec aria-label="${q.qtyLess || "Less"}">−</button>
                <span class="qty-val" data-extra-id="${ex.id}" data-qty="${qty}" aria-live="polite">${qty}</span>
                <button type="button" class="qty-btn" data-extra-inc aria-label="${q.qtyMore || "More"}" data-max="${ex.maxQty}">+</button>
              </div>
            </div>`;
        })
        .join("");

      list.querySelectorAll("[data-extra-toggle]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.dataset.extraToggle;
          const map = { ...normalizeExtras(TRIP.load().extras) };
          map[id] = map[id] ? 0 : 1;
          if (!map[id]) delete map[id];
          persistExtras(normalizeExtras(map));
          renderExtras();
        });
      });
      list.querySelectorAll("[data-extra-stepper]").forEach((wrap) => {
        const id = wrap.dataset.extraStepper;
        const valEl = wrap.querySelector("[data-extra-id]");
        const max = Number(wrap.querySelector("[data-extra-inc]")?.dataset.max) || 1;
        const setQty = (next) => {
          const map = { ...normalizeExtras(TRIP.load().extras) };
          const qn = Math.max(0, Math.min(max, next));
          if (qn) map[id] = qn;
          else delete map[id];
          persistExtras(normalizeExtras(map));
          renderExtras();
        };
        wrap.querySelector("[data-extra-dec]")?.addEventListener("click", () => {
          setQty((Number(valEl?.dataset.qty) || 0) - 1);
        });
        wrap.querySelector("[data-extra-inc]")?.addEventListener("click", () => {
          setQty((Number(valEl?.dataset.qty) || 0) + 1);
        });
      });
    }

    function readExtrasFromUi() {
      return normalizeExtras(TRIP.load().extras);
    }

    function renderCars() {
      const list = document.getElementById("quote-cars");
      let selected = TRIP.load().carId;
      const days = daysBetween(from.value, until.value);
      if (bffLoading) {
        list.innerHTML = `<p style="color:var(--muted)">${q.bffLoading || "Loading live rates…"}</p>`;
        return;
      }
      let prefix = "";
      if (useBff() && bffError && !bffQuote?.groups?.length) {
        prefix = `<p style="color:var(--ember)">${bffError}</p>`;
      }
      const cars = DATA.cars.filter((c) => {
        if (!useBff() || !bffQuote?.groups?.length) return true;
        return Boolean(liveForCar(c.id));
      });
      const source = cars.length ? cars : DATA.cars;
      if (!selected && source[0]) {
        selected = source[0].id;
        TRIP.save({ carId: selected });
      }
      list.innerHTML =
        prefix +
        source
          .map((c) => {
            const label = carLabel(c.id);
            const live = liveForCar(c.id);
            const rental = live ? live.totalAfterTax : c.daily * days;
            const status = live?.status && live.status !== "AVAILABLE" ? ` · ${live.status}` : "";
            const img = live?.imageUrl || carImg(c);
            const isSel = selected === c.id;
            return `
            <label class="result-row car-option ${isSel ? "is-selected" : ""}">
              <div class="thumb fleet-photo" style="background-image:url('${img}')"></div>
              <div>
                <h3 style="margin:0">${label.name}${c.isNew ? ' <span class="badge-new">NEW</span>' : ""}</h3>
                <p class="meta" style="margin:4px 0;color:var(--muted)">${live ? `${live.brand || ""} ${live.model || ""}`.trim() || label.similar : label.similar}</p>
                <p style="margin:0;font-size:.88rem;color:var(--muted)">${label.tags} · ${days}d${status}</p>
              </div>
              <div class="car-option-price">
                <strong>${money(rental)}</strong>
                <span class="car-pick">${isSel ? "✓" : ""}</span>
                <input type="radio" name="carId" value="${c.id}" ${isSel ? "checked" : ""} />
              </div>
            </label>`;
          })
          .join("");
      list.querySelectorAll('input[name="carId"]').forEach((input) => {
        input.addEventListener("change", () => {
          TRIP.save({ carId: input.value });
          setError("");
          renderCars();
          renderSummary();
          syncStageMedia();
        });
      });
      syncStageMedia();
    }

    function renderSummary() {
      const stored = TRIP.load();
      const cur = { ...stored, ...readTrip(), extras: stored.extras || {} };
      if (step === 3) cur.extras = readExtrasFromUi();
      const car = DATA.cars.find((c) => c.id === cur.carId);
      const days = daysBetween(cur.from, cur.until);
      const live = car ? liveForCar(car.id) : null;
      const usingLive = Boolean(useBff() && live);

      let rental = car ? car.daily * days : 0;
      let fee = cur.oneway ? onewayFee(cur.pickup, cur.dropoff) : 0;
      const plan = resolveInsurancePlan(cur);
      cur.insurancePlan = plan;
      cur.premium = plan === "premium";
      let { total: extrasTotal, lines: extrasLines } = extrasCost(cur.extras, days);
      let deposit = null;
      let excess = null;
      let cover = insuranceQuote(plan, days, usingLive ? live : null);
      let premiumCost = cover.cost;
      deposit = cover.deposit;
      excess = cover.excess;

      if (usingLive) {
        rental = live.totalAfterTax;
        fee = 0;
        cover = insuranceQuote(plan, days, live);
        premiumCost = cover.cost;
        deposit = cover.deposit;
        excess = cover.excess;
        ({ total: extrasTotal, lines: extrasLines } = extrasCostLive(cur.extras, days, live));
      }

      const winterCost = 0;
      const total = rental + fee + winterCost + premiumCost + extrasTotal;
      const box = document.getElementById("quote-summary");
      const st = dict.stations;
      const payLabel = cur.pay === "stripe" ? q.payStripe : q.payMp;
      const coverLineLabel = `${q.lineCoverage || q.linePremium || "Coverage"} (${planLabel(plan)})`;
      const extrasHtml = extrasLines.length
        ? `<ul class="summary-extras">${extrasLines
            .map((l) => `<li><span>${l.name}${l.qty > 1 ? ` ×${l.qty}` : ""}</span><span>${money(l.amount)}</span></li>`)
            .join("")}</ul>`
        : "";
      const sourceNote = "";
      const showDep = (deposit != null || excess != null);
      const depHtml = showDep
          ? `<div><dt>${q.lineDeposit || "Deposit"}</dt><dd>${money(deposit || 0)}</dd></div>
             <div><dt>${q.lineExcess || "Excess"}</dt><dd>${money(excess || 0)}</dd></div>`
          : "";
      const handoff = "";
      box.innerHTML = `
        <dl>
          <div><dt>${dict.search.pickup}</dt><dd>${st[cur.pickup] || cur.pickup}</dd></div>
          <div><dt>${dict.search.dropoff}</dt><dd>${st[cur.dropoff] || cur.dropoff}</dd></div>
          <div><dt>${dict.search.from}</dt><dd>${cur.from?.replace("T", " ") || "—"}</dd></div>
          <div><dt>${dict.search.until}</dt><dd>${cur.until?.replace("T", " ") || "—"}</dd></div>
          <div><dt>${q.lineRental}</dt><dd>${car ? money(rental) : "—"}</dd></div>
          <div><dt>${q.lineOneway}</dt><dd>${usingLive ? q.includedInRate || "Included in rate" : money(fee)}</dd></div>
          <div><dt>${q.lineExtras}</dt><dd>${money(extrasTotal)}</dd></div>
          <div><dt>${coverLineLabel}</dt><dd>${money(premiumCost)}</dd></div>
          ${depHtml}
          <div><dt>${q.lineTotal}</dt><dd>${money(total)}</dd></div>
          <div><dt>${q.step5}</dt><dd>${payLabel}</dd></div>
        </dl>
        ${extrasHtml}
        ${bffLoading ? `<p style="margin:12px 0 0;font-size:.82rem;color:var(--muted)">${q.bffLoading || "Loading…"}</p>` : ""}
        ${bffError && useBff() && !usingLive ? `<p style="margin:8px 0 0;font-size:.82rem;color:var(--ember)">${bffError}</p>` : ""}
      `;
      if (stickyTotal) stickyTotal.textContent = money(total);
      window.__readyQuoteTotal = {
        cur,
        car,
        days,
        rental,
        fee,
        winterCost,
        premiumCost,
        extrasTotal,
        extrasLines,
        total,
        usingLive,
        deposit,
        excess,
      };
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const pay = form.querySelector('input[name="pay"]:checked')?.value || "mercadopago";
      const stored = TRIP.load();
      TRIP.save({ ...readTrip(), ...stored, pay, status: "wa_quote" });
      const snap = window.__readyQuoteTotal;
      const label = snap?.car ? carLabel(snap.car.id).name : "";
      const extrasTxt = (snap?.extrasLines || []).map((l) => `${l.name}×${l.qty}`).join(", ");
      const cover = snap?.cur?.insurancePlan || "cdw";
      const msg = encodeURIComponent(
        `Ready Rent-a-Car — cotización\n${stored.name || ""}\n${stored.email || ""} · ${stored.phone || ""}\n${dict.stations[snap.cur.pickup]} → ${dict.stations[snap.cur.dropoff]}\n${snap.cur.from} → ${snap.cur.until}\n${label}\nCobertura: ${cover}\nExtras: ${extrasTxt || "—"}\nPreferencia de pago: ${pay}\nTotal: ${money(snap.total)}\n${stored.notes || ""}`
      );
      document.getElementById("success").hidden = false;
      document.getElementById("success-title").textContent = q.successTitleSafe || q.successTitle;
      document.getElementById("success-body").textContent = q.successBodySafe || q.successBody;
      document.getElementById("success-pay").textContent =
        q.successPaySafe || (pay === "stripe" ? q.successPayStripe : q.successPayMp);
      const wa = document.getElementById("success-wa");
      wa.textContent = q.wa;
      wa.href = `https://wa.me/${DATA.whatsapp}?text=${msg}`;
      form.hidden = true;
      document.getElementById("quote-aside").hidden = true;
      if (sticky) sticky.hidden = true;
    });

    show(1);
    renderSummary();
    if (TRIP.load().carId) renderCars();
  }

  function applyI18n() {
    renderHeader();
    renderFooter();
    const page = pageName();
    if (page === "home") applyHome();
    if (page === "fleet") applyFleetPage();
    if (page === "stations") applyStationsPage();
    if (page === "routes") applyRoutesPage();
    if (page === "extras") applyExtrasPage();
    if (page === "promos") applyPromosPage();
    if (page === "services") applyServicesPage();
    if (page === "corporate") applyCorporatePage();
    if (page === "faqs") applyFaqsPage();
    if (page === "contact") applyContactPage();
    if (page === "quote") applyQuotePage();
    document.documentElement.lang = getLang();
  }

  document.addEventListener("DOMContentLoaded", applyI18n);
})();
