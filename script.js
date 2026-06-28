const page = document.body.dataset.page || "home";

const navItems = [
  ["sistema", "Sistema", "sistema.html"],
  ["collezione", "Collezione", "collezione.html"],
  ["accessori", "Accessori", "accessori.html"],
  ["materiali", "Materiali", "materiali.html"],
  ["applicazioni", "Applicazioni", "applicazioni.html"],
  ["origine", "Origine", "origine.html"],
  ["contatti", "Contatti", "contatti.html"],
];

const header = document.createElement("header");
header.className = "site-header";
header.innerHTML = `
  <a class="brand" href="index.html" aria-label="IconicWall home">
    <img src="assets/logos/iconicwall-logo-black.svg" alt="Logo IconicWall">
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
  <div class="footer-inner">
    <div class="footer-columns">
      <section class="footer-column footer-intro" aria-label="IconicWall">
        <a class="footer-brand footer-brand-wall" href="index.html" aria-label="IconicWall home">
          <img src="assets/logos/iconicwall-logo-white.svg" alt="Logo IconicWall">
        </a>
        <p>Una struttura permanente progettata<br>per accogliere superfici, luce, accessori<br>e funzioni che evolvono nel tempo.</p>
      </section>

      <section class="footer-column footer-company" aria-label="Iconic S.R.L.">
        <a class="footer-iconic-mark" href="index.html" aria-label="Iconic home">
          <img src="assets/logos/iconic-logo-white.svg" alt="Logo Iconic">
        </a>
        <strong>ICONIC S.R.L. a socio unico</strong>
        <ul class="footer-contact-list">
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD)</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>
            <span>P.IVA / C.F. 04683100988</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4Z"/><path d="m22 6-10 7L2 6"/></svg>
            <a href="mailto:info@iconicoriginal.it">info@iconicoriginal.it</a>
          </li>
        </ul>
      </section>

      <nav class="footer-column footer-nav" aria-label="Risorse">
        <h2>Risorse</h2>
        <a href="downloads.html">Cataloghi</a>
        <a href="faq.html">FAQ</a>
        <a href="manutenzione.html">Manutenzione</a>
        <a href="istruzioni-montaggio.html">Istruzioni di montaggio</a>
      </nav>

      <nav class="footer-column footer-nav" aria-label="Legali">
        <h2>Legali</h2>
        <a href="privacy.html">Privacy Policy</a>
        <a href="cookie.html">Cookie Policy</a>
        <a href="cookie.html#preferenze">Preferenze Cookie</a>
        <a href="termini.html">Termini e condizioni</a>
      </nav>

      <nav class="footer-column footer-nav footer-social" aria-label="Social">
        <h2>Social</h2>
        <a href="https://www.instagram.com/iconic_dressyourinteriors/" target="_blank" rel="noopener noreferrer" aria-label="Instagram IconicWall">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
          <span>Instagram</span>
        </a>
        <a href="https://www.facebook.com/iconicoriginal/" target="_blank" rel="noopener noreferrer" aria-label="Facebook IconicOriginal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/></svg>
          <span>Facebook</span>
        </a>
        <a href="https://www.linkedin.com/company/iconicoriginal/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn IconicOriginal">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11v6M8 8v.01M12 17v-6M12 14a3 3 0 0 1 6 0v3"/></svg>
          <span>LinkedIn</span>
        </a>
      </nav>
    </div>

    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} IconicWall.<br>Tutti i diritti riservati.</span>
      <span>Designed & Made in Italy</span>
    </div>
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
    const requestType = document.querySelector("#request_type");
    const message = document.querySelector("#message");
    if (requestType) requestType.value = "Nuovo progetto";
    if (message) {
      const components = params.get("elementi") || "nessun accessorio";
      message.value = `Configurazione IconicWall 3D\nDimensioni: ${params.get("dimensioni") || "da definire"} cm\nFinitura: ${params.get("finitura") || "da definire"}\nElementi: ${components}`;
    }
  }

  const status = contactForm.querySelector(".form-status");
  const submitButton = contactForm.querySelector(".contact-submit");
  const submitLabel = submitButton?.querySelector(".contact-submit-label");
  const fields = ["full_name", "email", "profile_type", "request_type", "message", "privacy"];

  function setFieldError(name, message) {
    const field = contactForm.elements[name];
    const error = contactForm.querySelector(`[data-error-for="${name}"]`);
    if (field) {
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (error) field.setAttribute("aria-describedby", error.id || `${name}_error`);
    }
    if (error) {
      if (!error.id) error.id = `${name}_error`;
      error.textContent = message;
    }
  }

  function setStatus(message, type = "") {
    if (!status) return;
    status.textContent = message;
    status.className = `form-status${type ? ` ${type}` : ""}`;
  }

  function validateContactForm() {
    let valid = true;
    fields.forEach((name) => setFieldError(name, ""));

    const fullName = contactForm.elements.full_name.value.trim();
    const email = contactForm.elements.email.value.trim();
    const profileType = contactForm.elements.profile_type.value.trim();
    const requestType = contactForm.elements.request_type.value.trim();
    const message = contactForm.elements.message.value.trim();
    const privacy = contactForm.elements.privacy.checked;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!fullName) {
      setFieldError("full_name", "Inserisci nome e cognome.");
      valid = false;
    }
    if (!email) {
      setFieldError("email", "Inserisci un indirizzo email.");
      valid = false;
    } else if (!emailValid) {
      setFieldError("email", "Inserisci un indirizzo email valido.");
      valid = false;
    }
    if (!profileType) {
      setFieldError("profile_type", "Seleziona un profilo.");
      valid = false;
    }
    if (!requestType) {
      setFieldError("request_type", "Seleziona il tipo di richiesta.");
      valid = false;
    }
    if (!message) {
      setFieldError("message", "Scrivi un messaggio.");
      valid = false;
    }
    if (!privacy) {
      setFieldError("privacy", "Devi accettare l'informativa privacy.");
      valid = false;
    }

    return valid;
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    if (!validateContactForm()) return;

    const payload = {
      full_name: contactForm.elements.full_name.value.trim(),
      email: contactForm.elements.email.value.trim(),
      phone: contactForm.elements.phone.value.trim(),
      company: contactForm.elements.company.value.trim(),
      profile_type: contactForm.elements.profile_type.value.trim(),
      request_type: contactForm.elements.request_type.value.trim(),
      message: contactForm.elements.message.value.trim(),
    };

    if (submitButton) {
      submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "INVIO IN CORSO…";
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Request failed");

      contactForm.reset();
      fields.forEach((name) => setFieldError(name, ""));
      setStatus("Richiesta inviata. Ti risponderemo appena possibile.", "success");
    } catch {
      setStatus("Non siamo riusciti a inviare la richiesta. Riprova tra poco o scrivici via email.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "INVIA RICHIESTA";
      }
    }
  });
}
