const CARS = [
  {
    id: "tracker",
    name: "SUV Automatic",
    similar: "Tracker or similar",
    fit: ["suv", "any"],
    seats: 5,
    tags: ["Auto", "Petrol", "Lakes"],
    img: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=800&q=80",
    price: "Quote",
  },
  {
    id: "cross",
    name: "SUV AT Premium",
    similar: "Corolla Cross or similar",
    fit: ["suv", "any"],
    seats: 5,
    tags: ["Auto", "Comfort"],
    img: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?auto=format&fit=crop&w=800&q=80",
    price: "Quote",
  },
  {
    id: "spin",
    name: "Minivan 7",
    similar: "Spin 7 AT or similar",
    fit: ["family", "any"],
    seats: 7,
    tags: ["7 seats", "Family"],
    img: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80",
    price: "Quote",
  },
  {
    id: "hiace",
    name: "Van 9",
    similar: "Hiace AT or similar",
    fit: ["family", "any"],
    seats: 9,
    tags: ["9 seats", "Groups"],
    img: "https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=800&q=80",
    price: "Quote",
  },
  {
    id: "hilux",
    name: "Pickup 4×4 Auto",
    similar: "Hilux 4×4 AT or similar",
    fit: ["pickup", "4x4", "any"],
    seats: 5,
    tags: ["4×4", "Diesel", "Ruta 40"],
    img: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80",
    price: "Quote",
  },
  {
    id: "sw4",
    name: "Luxury 4×4",
    similar: "SW4 4×4 AT or similar",
    fit: ["4x4", "suv", "any"],
    seats: 7,
    tags: ["4×4", "Premium"],
    img: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=800&q=80",
    price: "Quote",
  },
];

const STATION_LABELS = {
  brc: "Bariloche (BRC)",
  cpc: "San Martín · Chapelco (CPC)",
  eqs: "Esquel (EQS)",
  fte: "El Calafate (FTE)",
  ush: "Ushuaia (USH)",
  mdz: "Mendoza (MDZ)",
};

const funnel = document.getElementById("funnel");
const panels = [...document.querySelectorAll("[data-panel]")];
const indicators = [...document.querySelectorAll("[data-step-indicator]")];
const oneway = document.getElementById("oneway");
const dropWrap = document.getElementById("drop-wrap");
const needAge = document.getElementById("need-age");
const ageWrap = document.getElementById("age-wrap");
const resultList = document.getElementById("result-list");
const summary = document.getElementById("summary");
const sticky = document.getElementById("sticky-book");
const stickyMeta = document.getElementById("sticky-meta");
const stickyCta = document.getElementById("sticky-cta");
const dialog = document.getElementById("quote-dialog");
const dialogTitle = document.getElementById("dialog-title");
const dialogCopy = document.getElementById("dialog-copy");
const station = document.getElementById("station");

let currentStep = 1;
let lastFit = "any";

function showStep(n) {
  currentStep = n;
  panels.forEach((p) => {
    const id = Number(p.dataset.panel);
    const active = id === n;
    p.hidden = !active;
    p.classList.toggle("is-active", active);
  });
  indicators.forEach((el) => {
    el.classList.toggle("is-active", Number(el.dataset.stepIndicator) === n);
  });
  if (sticky) sticky.hidden = false;
  if (stickyMeta) stickyMeta.textContent = `Step ${n} of 3`;
}

funnel?.addEventListener("click", (e) => {
  const next = e.target.closest("[data-next]");
  const prev = e.target.closest("[data-prev]");
  if (next) {
    const to = Number(next.dataset.next);
    if (to === 2 && !station.value) {
      station.reportValidity();
      return;
    }
    showStep(to);
  }
  if (prev) showStep(Number(prev.dataset.prev));
});

oneway?.addEventListener("change", () => {
  dropWrap.hidden = !oneway.checked;
});

needAge?.addEventListener("change", () => {
  ageWrap.hidden = !needAge.checked;
});

function daysBetween() {
  const from = new Date(document.getElementById("from").value);
  const to = new Date(document.getElementById("to").value);
  const ms = to - from;
  if (Number.isNaN(ms) || ms <= 0) return 7;
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function renderCars(fit = "any") {
  lastFit = fit;
  const filtered = CARS.filter((c) => c.fit.includes(fit) || fit === "any");
  resultList.innerHTML = filtered
    .map(
      (c) => `
      <article class="car" data-id="${c.id}">
        <div class="car-img" style="background-image:url('${c.img}')" role="img" aria-label="${c.name}"></div>
        <div>
          <h3>${c.name}</h3>
          <p class="meta">${c.similar} · ${c.seats} seats</p>
          <div class="badges">${c.tags.map((t) => `<span class="badge">${t}</span>`).join("")}</div>
        </div>
        <div class="price-block">
          <span class="from">Total path</span>
          <strong>${c.price}</strong>
          <span class="note">Taxes &amp; extras on next step</span>
          <button type="button" class="primary" data-quote="${c.id}">Select</button>
        </div>
      </article>`
    )
    .join("");
}

funnel?.addEventListener("submit", (e) => {
  e.preventDefault();
  const fit = funnel.querySelector('input[name="fit"]:checked')?.value || "any";
  const label = STATION_LABELS[station.value] || "Station";
  const drop = oneway.checked ? ` → ${STATION_LABELS[document.getElementById("drop").value]}` : "";
  summary.textContent = `${label}${drop} · ${daysBetween()} days · ${fit === "any" ? "Any category" : fit.toUpperCase()}`;
  if (stickyMeta) stickyMeta.textContent = summary.textContent;
  renderCars(fit);
  document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

stickyCta?.addEventListener("click", () => {
  if (currentStep < 3) showStep(Math.min(3, currentStep + 1));
  else funnel.requestSubmit();
});

resultList?.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-quote]");
  if (!btn) return;
  const car = CARS.find((c) => c.id === btn.dataset.quote);
  if (!car || !dialog) return;
  dialogTitle.textContent = `Select · ${car.name}`;
  dialogCopy.textContent = `${car.similar}. Demo quote — connect Ready inventory or continue on WhatsApp with your dates.`;
  dialog.showModal();
});

document.querySelectorAll("[data-set-station]").forEach((el) => {
  el.addEventListener("click", () => {
    station.value = el.dataset.setStation;
    showStep(1);
  });
});

renderCars("any");
showStep(1);

const io = new IntersectionObserver(
  ([entry]) => {
    if (!sticky) return;
    sticky.hidden = entry.isIntersecting && currentStep === 1 ? true : false;
  },
  { threshold: 0.4 }
);
if (funnel) io.observe(funnel);
