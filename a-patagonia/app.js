const oneway = document.getElementById("oneway");
const dropField = document.querySelector(".drop-field");
const form = document.getElementById("search");
const toast = document.getElementById("toast");
const chips = document.querySelectorAll(".chip-btn");
const cards = document.querySelectorAll(".fleet-card");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

oneway?.addEventListener("change", () => {
  if (!dropField) return;
  dropField.hidden = !oneway.checked;
});

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!toast) return;
  toast.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { toast.hidden = true; }, 2800);
});

chips.forEach((chip) => {
  chip.addEventListener("click", () => {
    chips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const filter = chip.dataset.filter;
    cards.forEach((card) => {
      const tags = (card.dataset.tags || "").split(/\s+/);
      const show = filter === "all" || tags.includes(filter);
      card.classList.toggle("is-hidden", !show);
    });
  });
});

menuToggle?.addEventListener("click", () => {
  const open = navLinks?.style.display === "flex";
  if (navLinks) {
    navLinks.style.display = open ? "none" : "flex";
    navLinks.style.flexDirection = "column";
    navLinks.style.position = "absolute";
    navLinks.style.top = "72px";
    navLinks.style.left = "0";
    navLinks.style.right = "0";
    navLinks.style.background = "rgba(244,240,231,.98)";
    navLinks.style.padding = "16px 24px";
    navLinks.style.gap = "14px";
    navLinks.style.borderBottom = "1px solid rgba(18,28,23,.12)";
  }
  menuToggle.setAttribute("aria-expanded", String(!open));
});

const searchBar = document.querySelector(".search-bar");
const hero = document.querySelector(".hero");
if (searchBar && hero && window.matchMedia("(min-width: 901px)").matches) {
  const io = new IntersectionObserver(
    ([entry]) => {
      searchBar.style.position = entry.isIntersecting ? "absolute" : "fixed";
      searchBar.style.bottom = entry.isIntersecting ? "28px" : "16px";
      if (!entry.isIntersecting) {
        searchBar.style.left = "24px";
        searchBar.style.right = "24px";
        searchBar.style.zIndex = "45";
      }
    },
    { threshold: 0.15 }
  );
  io.observe(hero);
}
