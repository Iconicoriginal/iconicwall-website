const page = document.body.dataset.page || "home";

const navItems = [
  ["sistema", "Sistema", "sistema.html"],
  ["collezione", "Collezione", "collezione.html"],
  ["accessori", "Accessori", "accessori.html"],
  ["materiali", "Materiali", "materiali.html"],
  ["applicazioni", "Applicazioni", "applicazioni.html"],
  ["contatti", "Contatti", "contatti.html"],
];

const header = document.createElement("header");
header.className = "site-header";
header.innerHTML = `
  <a class="brand" href="index.html" aria-label="IconicWall home">
    <b>ICONIC</b><span>WALL</span>
  </a>
  <button class="menu-toggle" aria-expanded="false" aria-label="Apri il menu">
    <i></i><i></i>
  </button>
  <nav class="main-nav">
    ${navItems.map(([id, label, href]) => `<a ${page === id ? 'class="active"' : ""} href="${href}">${label}</a>`).join("")}
    <a class="nav-contact" href="contatti.html">Parliamone <span>↗</span></a>
  </nav>`;
document.body.prepend(header);

const footer = document.createElement("footer");
footer.innerHTML = `
  <div class="footer-top">
    <a class="brand footer-brand" href="index.html"><b>ICONIC</b><span>WALL</span></a>
    <p class="footer-statement">Dress your interiors.<br>Change them when life changes.</p>
    <div class="footer-links">
      ${navItems.map(([, label, href]) => `<a href="${href}">${label}</a>`).join("")}
      <a href="contatti.html">Contatti</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>ICONIC S.R.L. · Via Guido Rossa 39, Padova</span>
    <a href="mailto:info@iconicoriginal.it">info@iconicoriginal.it</a>
    <span>© ${new Date().getFullYear()}</span>
  </div>`;
document.body.append(footer);

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".main-nav");
menuButton.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  nav.classList.toggle("open", !open);
  document.body.classList.toggle("menu-open", !open);
});

document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    menuButton.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    document.body.classList.remove("menu-open");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      revealObserver.unobserve(entry.target);
    }
  }),
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach((el, index) => {
  el.style.setProperty("--delay", `${Math.min(index % 5, 4) * 70}ms`);
  revealObserver.observe(el);
});

const progress = document.createElement("div");
progress.className = "scroll-progress";
document.body.append(progress);

let ticking = false;
function updateScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
  header.classList.toggle("scrolled", scrollY > 30);
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const rect = el.getBoundingClientRect();
    const distance = (innerHeight - rect.top) / (innerHeight + rect.height);
    el.style.setProperty("--parallax", `${(distance - 0.5) * 50}px`);
  });
  ticking = false;
}
addEventListener("scroll", () => {
  if (!ticking) {
    requestAnimationFrame(updateScroll);
    ticking = true;
  }
}, { passive: true });
updateScroll();

document.querySelectorAll("[data-cursor]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--x", `${event.clientX - rect.left}px`);
    card.style.setProperty("--y", `${event.clientY - rect.top}px`);
  });
});

document.querySelectorAll("[data-accordion]").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".accordion-item");
    const open = item.classList.contains("open");
    document.querySelectorAll(".accordion-item.open").forEach((el) => el.classList.remove("open"));
    if (!open) item.classList.add("open");
  });
});

const video = document.querySelector(".hero-video");
if (video) {
  const videoButton = document.querySelector(".video-toggle");
  videoButton?.addEventListener("click", () => {
    if (video.paused) {
      video.play();
      videoButton.textContent = "Pausa";
    } else {
      video.pause();
      videoButton.textContent = "Play";
    }
  });
}

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  const params = new URLSearchParams(location.search);
  if (params.get("tipo") === "Configurazione 3D") {
    const projectType = document.querySelector("#type");
    const message = document.querySelector("#message");
    if (projectType && ![...projectType.options].some((option) => option.value === "Configurazione IconicWall")) {
      projectType.add(new Option("Configurazione IconicWall", "Configurazione IconicWall"));
    }
    if (projectType) projectType.value = "Configurazione IconicWall";
    if (message) {
      const components = params.get("elementi") || "nessun accessorio";
      message.value = `Configurazione IconicWall 3D\nDimensioni: ${params.get("dimensioni") || "da definire"} cm\nFinitura: ${params.get("finitura") || "da definire"}\nElementi: ${components}`;
    }
  }
}
