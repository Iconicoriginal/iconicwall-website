const supportedLangs = ["it", "en", "fr", "de", "es"];
const langMatch = location.pathname.match(/^\/(en|fr|de|es)(\/|$)/);
const lang = langMatch && supportedLangs.includes(langMatch[1]) ? langMatch[1] : "it";

// Percorso della pagina corrente senza prefisso di lingua, usato dallo switcher
// (piu' affidabile di data-page: piu' pagine di supporto condividono lo stesso data-page="info")
const currentPath = location.pathname.replace(/^\/(en|fr|de|es)\//, "").replace(/^\//, "") || "index.html";

const translatedPaths = new Set([
  "index.html", "sistema.html", "collezione.html", "materiali.html", "accessori.html",
  "applicazioni.html", "origine.html", "contatti.html", "tecnologia-proprietaria.html",
  "faq.html", "manutenzione.html", "istruzioni-montaggio.html",
  "documentazione/index.html", "savhotel-mantegna-padova/index.html",
]);

function urlForLang(targetLang, filename) {
  return targetLang === "it" ? `/${filename}` : `/${targetLang}/${filename}`;
}

function pageUrl(filename) {
  return urlForLang(lang, filename);
}

const i18n = {
  it: {
    nav: { sistema: "Sistema", collezione: "Collezione", materiali: "Materiali", accessori: "Accessori", applicazioni: "Applicazioni", origine: "Origine", contatti: "Contatti" },
    navCta: "Parliamone",
    menuToggle: "Apri il menu",
    homeAria: "IconicWall home",
    iconicAria: "Iconic home",
    footerIntroAria: "IconicWall",
    footerCompanyAria: "Iconic S.R.L.",
    footerIntro: "Una struttura permanente progettata<br>per accogliere superfici, luce, accessori<br>e funzioni che evolvono nel tempo.",
    footerCompanyName: "ICONIC S.R.L. a socio unico",
    footerAddress: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD)",
    footerVat: "P.IVA / C.F. 04683100988",
    footerResources: "Risorse",
    footerDocs: "Documentazione",
    footerFaq: "FAQ",
    footerMaintenance: "Manutenzione",
    footerInstructions: "Istruzioni di montaggio",
    footerTech: "Tecnologia proprietaria",
    footerLegal: "Legali",
    footerPrivacy: "Privacy Policy",
    footerCookie: "Cookie Policy",
    footerCookiePrefs: "Preferenze Cookie",
    footerTerms: "Termini e condizioni",
    footerSocial: "Social",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicOriginal",
    linkedinAria: "LinkedIn IconicOriginal",
    footerRights: "Tutti i diritti riservati.",
    footerTagline: "Designed & Made in Italy",
    cookieAria: "Preferenze cookie",
    cookieText1: "Utilizziamo cookie tecnici necessari al funzionamento del sito e, solo con il tuo consenso, cookie analytics e marketing per migliorare l’esperienza, misurare le visite e proporti contenuti più pertinenti.",
    cookieText2: "Puoi accettare tutti i cookie, rifiutare quelli non necessari o personalizzare le tue preferenze.",
    cookiePolicyAria: "Informative cookie",
    cookieReject: "Rifiuta non necessari",
    cookieCustomize: "Personalizza",
    cookieAcceptAll: "Accetta tutti",
    cookiePrefsSaved: "Le tue preferenze sono state salvate. Puoi modificarle in qualsiasi momento tornando su questa pagina.",
    videoPause: "Pausa",
    videoPlay: "Play",
    formErrorName: "Inserisci nome e cognome.",
    formErrorEmailEmpty: "Inserisci un indirizzo email.",
    formErrorEmailInvalid: "Inserisci un indirizzo email valido.",
    formErrorMessage: "Scrivi un messaggio.",
    formErrorPrivacy: "Devi accettare l'informativa privacy.",
    formSending: "INVIO IN CORSO…",
    formSubmit: "INVIA RICHIESTA",
    formSuccess: "Richiesta inviata. Ti risponderemo appena possibile.",
    formError: "Non siamo riusciti a inviare la richiesta. Riprova tra poco o scrivici via email.",
    configDimLabel: "Dimensioni",
    configFinishLabel: "Finitura",
    configElementsLabel: "Elementi",
    configNoAccessory: "nessun accessorio",
    configTBD: "da definire",
    configSampleMsg: "Vorrei richiedere un campionario dei materiali IconicWall.",
    configDocsMsg: "Vorrei ricevere la documentazione tecnica IconicWall.",
  },
  en: {
    nav: { sistema: "System", collezione: "Collection", materiali: "Materials", accessori: "Accessories", applicazioni: "Applications", origine: "Origin", contatti: "Contact" },
    navCta: "Let's talk",
    menuToggle: "Open menu",
    homeAria: "IconicWall home",
    iconicAria: "Iconic home",
    footerIntroAria: "IconicWall",
    footerCompanyAria: "Iconic S.R.L.",
    footerIntro: "A permanent structure designed<br>to host surfaces, light, accessories<br>and functions that evolve over time.",
    footerCompanyName: "ICONIC S.R.L. a socio unico",
    footerAddress: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italy",
    footerVat: "VAT / Tax ID 04683100988",
    footerResources: "Resources",
    footerDocs: "Documentation",
    footerFaq: "FAQ",
    footerMaintenance: "Maintenance",
    footerInstructions: "Assembly instructions",
    footerTech: "Proprietary technology",
    footerLegal: "Legal",
    footerPrivacy: "Privacy Policy",
    footerCookie: "Cookie Policy",
    footerCookiePrefs: "Cookie Preferences",
    footerTerms: "Terms & Conditions",
    footerSocial: "Social",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicOriginal",
    linkedinAria: "LinkedIn IconicOriginal",
    footerRights: "All rights reserved.",
    footerTagline: "Designed & Made in Italy",
    cookieAria: "Cookie preferences",
    cookieText1: "We use technical cookies necessary for the site to function and, only with your consent, analytics and marketing cookies to improve your experience, measure visits and offer more relevant content.",
    cookieText2: "You can accept all cookies, reject non-essential ones, or customize your preferences.",
    cookiePolicyAria: "Cookie policies",
    cookieReject: "Reject non-essential",
    cookieCustomize: "Customize",
    cookieAcceptAll: "Accept all",
    cookiePrefsSaved: "Your preferences have been saved. You can change them at any time by returning to this page.",
    videoPause: "Pause",
    videoPlay: "Play",
    formErrorName: "Please enter your full name.",
    formErrorEmailEmpty: "Please enter an email address.",
    formErrorEmailInvalid: "Please enter a valid email address.",
    formErrorMessage: "Please write a message.",
    formErrorPrivacy: "You must accept the privacy policy.",
    formSending: "SENDING…",
    formSubmit: "SEND REQUEST",
    formSuccess: "Request sent. We'll get back to you as soon as possible.",
    formError: "We couldn't send your request. Please try again shortly or email us directly.",
    configDimLabel: "Dimensions",
    configFinishLabel: "Finish",
    configElementsLabel: "Elements",
    configNoAccessory: "no accessories",
    configTBD: "to be defined",
    configSampleMsg: "I would like to request an IconicWall materials sample kit.",
    configDocsMsg: "I would like to receive IconicWall technical documentation.",
  },
  fr: {
    nav: { sistema: "Système", collezione: "Collection", materiali: "Matériaux", accessori: "Accessoires", applicazioni: "Applications", origine: "Origine", contatti: "Contact" },
    navCta: "Discutons-en",
    menuToggle: "Ouvrir le menu",
    homeAria: "Accueil IconicWall",
    iconicAria: "Accueil Iconic",
    footerIntroAria: "IconicWall",
    footerCompanyAria: "Iconic S.R.L.",
    footerIntro: "Une structure permanente conçue<br>pour accueillir surfaces, lumière, accessoires<br>et fonctions qui évoluent dans le temps.",
    footerCompanyName: "ICONIC S.R.L. a socio unico",
    footerAddress: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italie",
    footerVat: "TVA / C.F. 04683100988",
    footerResources: "Ressources",
    footerDocs: "Documentation",
    footerFaq: "FAQ",
    footerMaintenance: "Entretien",
    footerInstructions: "Instructions de montage",
    footerTech: "Technologie propriétaire",
    footerLegal: "Mentions légales",
    footerPrivacy: "Politique de confidentialité",
    footerCookie: "Politique cookies",
    footerCookiePrefs: "Préférences cookies",
    footerTerms: "Conditions générales",
    footerSocial: "Réseaux sociaux",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicOriginal",
    linkedinAria: "LinkedIn IconicOriginal",
    footerRights: "Tous droits réservés.",
    footerTagline: "Designed & Made in Italy",
    cookieAria: "Préférences cookies",
    cookieText1: "Nous utilisons des cookies techniques nécessaires au fonctionnement du site et, uniquement avec votre consentement, des cookies analytiques et marketing pour améliorer l'expérience, mesurer les visites et vous proposer des contenus plus pertinents.",
    cookieText2: "Vous pouvez accepter tous les cookies, refuser ceux qui ne sont pas nécessaires ou personnaliser vos préférences.",
    cookiePolicyAria: "Informations sur les cookies",
    cookieReject: "Refuser non nécessaires",
    cookieCustomize: "Personnaliser",
    cookieAcceptAll: "Tout accepter",
    cookiePrefsSaved: "Vos préférences ont été enregistrées. Vous pouvez les modifier à tout moment en revenant sur cette page.",
    videoPause: "Pause",
    videoPlay: "Lecture",
    formErrorName: "Veuillez indiquer vos nom et prénom.",
    formErrorEmailEmpty: "Veuillez indiquer une adresse e-mail.",
    formErrorEmailInvalid: "Veuillez indiquer une adresse e-mail valide.",
    formErrorMessage: "Veuillez écrire un message.",
    formErrorPrivacy: "Vous devez accepter la politique de confidentialité.",
    formSending: "ENVOI EN COURS…",
    formSubmit: "ENVOYER LA DEMANDE",
    formSuccess: "Demande envoyée. Nous vous répondrons dès que possible.",
    formError: "Nous n'avons pas pu envoyer votre demande. Réessayez dans quelques instants ou écrivez-nous par e-mail.",
    configDimLabel: "Dimensions",
    configFinishLabel: "Finition",
    configElementsLabel: "Éléments",
    configNoAccessory: "aucun accessoire",
    configTBD: "à définir",
    configSampleMsg: "Je souhaite demander un échantillonnage des matériaux IconicWall.",
    configDocsMsg: "Je souhaite recevoir la documentation technique IconicWall.",
  },
  de: {
    nav: { sistema: "System", collezione: "Kollektion", materiali: "Materialien", accessori: "Zubehör", applicazioni: "Anwendungen", origine: "Ursprung", contatti: "Kontakt" },
    navCta: "Sprechen wir darüber",
    menuToggle: "Menü öffnen",
    homeAria: "IconicWall Startseite",
    iconicAria: "Iconic Startseite",
    footerIntroAria: "IconicWall",
    footerCompanyAria: "Iconic S.R.L.",
    footerIntro: "Eine dauerhafte Struktur, konzipiert,<br>um Oberflächen, Licht, Zubehör<br>und sich wandelnde Funktionen aufzunehmen.",
    footerCompanyName: "ICONIC S.R.L. a socio unico",
    footerAddress: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italien",
    footerVat: "USt-IdNr. / St.-Nr. 04683100988",
    footerResources: "Ressourcen",
    footerDocs: "Dokumentation",
    footerFaq: "FAQ",
    footerMaintenance: "Wartung",
    footerInstructions: "Montageanleitung",
    footerTech: "Patentierte Technologie",
    footerLegal: "Rechtliches",
    footerPrivacy: "Datenschutzerklärung",
    footerCookie: "Cookie-Richtlinie",
    footerCookiePrefs: "Cookie-Einstellungen",
    footerTerms: "Allgemeine Geschäftsbedingungen",
    footerSocial: "Social Media",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicOriginal",
    linkedinAria: "LinkedIn IconicOriginal",
    footerRights: "Alle Rechte vorbehalten.",
    footerTagline: "Designed & Made in Italy",
    cookieAria: "Cookie-Einstellungen",
    cookieText1: "Wir verwenden technisch notwendige Cookies für den Betrieb der Website und, nur mit Ihrer Zustimmung, Analyse- und Marketing-Cookies, um die Nutzererfahrung zu verbessern, Besuche zu messen und Ihnen relevantere Inhalte anzubieten.",
    cookieText2: "Sie können alle Cookies akzeptieren, nicht notwendige ablehnen oder Ihre Einstellungen anpassen.",
    cookiePolicyAria: "Cookie-Informationen",
    cookieReject: "Nicht notwendige ablehnen",
    cookieCustomize: "Anpassen",
    cookieAcceptAll: "Alle akzeptieren",
    cookiePrefsSaved: "Ihre Einstellungen wurden gespeichert. Sie können sie jederzeit ändern, indem Sie auf diese Seite zurückkehren.",
    videoPause: "Pause",
    videoPlay: "Abspielen",
    formErrorName: "Bitte geben Sie Ihren Vor- und Nachnamen ein.",
    formErrorEmailEmpty: "Bitte geben Sie eine E-Mail-Adresse ein.",
    formErrorEmailInvalid: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
    formErrorMessage: "Bitte schreiben Sie eine Nachricht.",
    formErrorPrivacy: "Sie müssen die Datenschutzerklärung akzeptieren.",
    formSending: "WIRD GESENDET…",
    formSubmit: "ANFRAGE SENDEN",
    formSuccess: "Anfrage gesendet. Wir werden uns so schnell wie möglich bei Ihnen melden.",
    formError: "Ihre Anfrage konnte nicht gesendet werden. Versuchen Sie es später erneut oder schreiben Sie uns eine E-Mail.",
    configDimLabel: "Abmessungen",
    configFinishLabel: "Oberfläche",
    configElementsLabel: "Elemente",
    configNoAccessory: "kein Zubehör",
    configTBD: "noch festzulegen",
    configSampleMsg: "Ich möchte ein Materialmuster von IconicWall anfordern.",
    configDocsMsg: "Ich möchte die technische Dokumentation von IconicWall erhalten.",
  },
  es: {
    nav: { sistema: "Sistema", collezione: "Colección", materiali: "Materiales", accessori: "Accesorios", applicazioni: "Aplicaciones", origine: "Origen", contatti: "Contacto" },
    navCta: "Hablemos",
    menuToggle: "Abrir menú",
    homeAria: "Inicio de IconicWall",
    iconicAria: "Inicio de Iconic",
    footerIntroAria: "IconicWall",
    footerCompanyAria: "Iconic S.R.L.",
    footerIntro: "Una estructura permanente diseñada<br>para acoger superficies, luz, accesorios<br>y funciones que evolucionan con el tiempo.",
    footerCompanyName: "ICONIC S.R.L. a socio unico",
    footerAddress: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italia",
    footerVat: "NIF / C.F. 04683100988",
    footerResources: "Recursos",
    footerDocs: "Documentación",
    footerFaq: "FAQ",
    footerMaintenance: "Mantenimiento",
    footerInstructions: "Instrucciones de montaje",
    footerTech: "Tecnología patentada",
    footerLegal: "Legal",
    footerPrivacy: "Política de privacidad",
    footerCookie: "Política de cookies",
    footerCookiePrefs: "Preferencias de cookies",
    footerTerms: "Términos y condiciones",
    footerSocial: "Redes sociales",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicOriginal",
    linkedinAria: "LinkedIn IconicOriginal",
    footerRights: "Todos los derechos reservados.",
    footerTagline: "Designed & Made in Italy",
    cookieAria: "Preferencias de cookies",
    cookieText1: "Utilizamos cookies técnicas necesarias para el funcionamiento del sitio y, solo con tu consentimiento, cookies analíticas y de marketing para mejorar la experiencia, medir las visitas y ofrecerte contenidos más relevantes.",
    cookieText2: "Puedes aceptar todas las cookies, rechazar las no necesarias o personalizar tus preferencias.",
    cookiePolicyAria: "Información sobre cookies",
    cookieReject: "Rechazar no necesarias",
    cookieCustomize: "Personalizar",
    cookieAcceptAll: "Aceptar todas",
    cookiePrefsSaved: "Tus preferencias se han guardado. Puedes modificarlas en cualquier momento volviendo a esta página.",
    videoPause: "Pausa",
    videoPlay: "Reproducir",
    formErrorName: "Introduce tu nombre y apellidos.",
    formErrorEmailEmpty: "Introduce una dirección de correo electrónico.",
    formErrorEmailInvalid: "Introduce una dirección de correo electrónico válida.",
    formErrorMessage: "Escribe un mensaje.",
    formErrorPrivacy: "Debes aceptar la política de privacidad.",
    formSending: "ENVIANDO…",
    formSubmit: "ENVIAR SOLICITUD",
    formSuccess: "Solicitud enviada. Te responderemos lo antes posible.",
    formError: "No hemos podido enviar la solicitud. Vuelve a intentarlo en breve o escríbenos por correo electrónico.",
    configDimLabel: "Dimensiones",
    configFinishLabel: "Acabado",
    configElementsLabel: "Elementos",
    configNoAccessory: "ningún accesorio",
    configTBD: "por definir",
    configSampleMsg: "Me gustaría solicitar un muestrario de materiales de IconicWall.",
    configDocsMsg: "Me gustaría recibir la documentación técnica de IconicWall.",
  },
};

const t = i18n[lang] || i18n.it;

const page = document.body.dataset.page || "home";

const navItems = [
  ["sistema", t.nav.sistema, "sistema.html"],
  ["collezione", t.nav.collezione, "collezione.html"],
  ["materiali", t.nav.materiali, "materiali.html"],
  ["accessori", t.nav.accessori, "accessori.html"],
  ["applicazioni", t.nav.applicazioni, "applicazioni.html"],
  ["origine", t.nav.origine, "origine.html"],
  ["contatti", t.nav.contatti, "contatti.html"],
];

const organizationSchema = document.createElement("script");
organizationSchema.type = "application/ld+json";
organizationSchema.textContent = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "IconicWall",
  "legalName": "Iconic S.r.l.",
  "url": "https://www.iconicwall.it/",
  "logo": "https://www.iconicwall.it/assets/logos/iconicwall-logo-black.svg",
  "email": "info@iconicoriginal.it",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Guido Rossa, 39",
    "addressLocality": "Ponte San Nicolò",
    "postalCode": "35020",
    "addressRegion": "PD",
    "addressCountry": "IT",
  },
  "sameAs": [
    "https://www.instagram.com/iconic_dressyourinteriors/",
    "https://www.facebook.com/iconicoriginal/",
    "https://www.linkedin.com/company/iconicoriginal/",
  ],
});
document.head.appendChild(organizationSchema);

const langSwitcherLinks = supportedLangs.map((targetLang) => {
  const path = translatedPaths.has(currentPath) ? currentPath : "index.html";
  return `<a href="${urlForLang(targetLang, path)}" ${targetLang === lang ? 'class="active"' : ""}>${targetLang.toUpperCase()}</a>`;
}).join("");

const header = document.createElement("header");
header.className = "site-header";
header.innerHTML = `
  <a class="brand" href="${pageUrl("index.html")}" aria-label="${t.homeAria}">
    <img src="/assets/logos/iconicwall-logo-black.svg" alt="Logo IconicWall">
  </a>
  <button class="menu-toggle" aria-expanded="false" aria-label="${t.menuToggle}">
    <i></i><i></i>
  </button>
  <nav class="main-nav">
    ${navItems.map(([id, label, href]) => `<a ${page === id ? 'class="active"' : ""} href="${pageUrl(href)}">${label}</a>`).join("")}
    <a class="nav-contact" href="${pageUrl("contatti.html")}">${t.navCta} <span>↗</span></a>
    <div class="lang-switcher" aria-label="Language">${langSwitcherLinks}</div>
  </nav>`;
document.body.prepend(header);

const footer = document.createElement("footer");
footer.innerHTML = `
  <div class="footer-inner">
    <div class="footer-columns">
      <section class="footer-column footer-intro" aria-label="${t.footerIntroAria}">
        <a class="footer-brand footer-brand-wall" href="${pageUrl("index.html")}" aria-label="${t.homeAria}">
          <img src="/assets/logos/iconicwall-logo-white.svg" alt="Logo IconicWall">
        </a>
        <p>${t.footerIntro}</p>
      </section>

      <section class="footer-column footer-company" aria-label="${t.footerCompanyAria}">
        <a class="footer-iconic-mark" href="${pageUrl("index.html")}" aria-label="${t.iconicAria}">
          <img src="/assets/logos/iconic-logo-white.svg" alt="Logo Iconic">
        </a>
        <strong>${t.footerCompanyName}</strong>
        <ul class="footer-contact-list">
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>${t.footerAddress}</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h8M8 9h2"/></svg>
            <span>${t.footerVat}</span>
          </li>
          <li>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4Z"/><path d="m22 6-10 7L2 6"/></svg>
            <a href="mailto:info@iconicoriginal.it">info@iconicoriginal.it</a>
          </li>
        </ul>
      </section>

      <nav class="footer-column footer-nav" aria-label="${t.footerResources}">
        <h2>${t.footerResources}</h2>
        <a href="${pageUrl("documentazione/index.html")}">${t.footerDocs}</a>
        <a href="${pageUrl("faq.html")}">${t.footerFaq}</a>
        <a href="${pageUrl("manutenzione.html")}">${t.footerMaintenance}</a>
        <a href="${pageUrl("istruzioni-montaggio.html")}">${t.footerInstructions}</a>
        <a href="${pageUrl("tecnologia-proprietaria.html")}">${t.footerTech}</a>
      </nav>

      <nav class="footer-column footer-nav" aria-label="${t.footerLegal}">
        <h2>${t.footerLegal}</h2>
        <a href="${pageUrl("privacy.html")}">${t.footerPrivacy}</a>
        <a href="${pageUrl("cookie.html")}">${t.footerCookie}</a>
        <a href="${pageUrl("preferenze-cookie.html")}">${t.footerCookiePrefs}</a>
        <a href="${pageUrl("termini.html")}">${t.footerTerms}</a>
      </nav>

      <nav class="footer-column footer-nav footer-social" aria-label="${t.footerSocial}">
        <h2>${t.footerSocial}</h2>
        <a href="https://www.instagram.com/iconic_dressyourinteriors/" target="_blank" rel="noopener noreferrer" aria-label="${t.instagramAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
          <span>Instagram</span>
        </a>
        <a href="https://www.facebook.com/iconicoriginal/" target="_blank" rel="noopener noreferrer" aria-label="${t.facebookAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/></svg>
          <span>Facebook</span>
        </a>
        <a href="https://www.linkedin.com/company/iconicoriginal/" target="_blank" rel="noopener noreferrer" aria-label="${t.linkedinAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 11v6M8 8v.01M12 17v-6M12 14a3 3 0 0 1 6 0v3"/></svg>
          <span>LinkedIn</span>
        </a>
      </nav>
    </div>

    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} IconicWall.<br>${t.footerRights}</span>
      <span>${t.footerTagline}</span>
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
      videoButton.textContent = t.videoPause;
    } else {
      video.pause();
      videoButton.textContent = t.videoPlay;
    }
  });
}

const cookieConsent = (() => {
  const keys = {
    analytics: "iconic_cookie_analytics",
    marketing: "iconic_cookie_marketing",
    updatedAt: "iconic_cookie_consent_updated_at",
    choiceMade: "iconic_cookie_choice_made",
  };

  function hasChoice() {
    return localStorage.getItem(keys.choiceMade) === "true";
  }

  function getPreferences() {
    return {
      analytics: localStorage.getItem(keys.analytics) === "true",
      marketing: localStorage.getItem(keys.marketing) === "true",
    };
  }

  function savePreferences({ analytics, marketing }) {
    localStorage.setItem(keys.analytics, String(Boolean(analytics)));
    localStorage.setItem(keys.marketing, String(Boolean(marketing)));
    localStorage.setItem(keys.choiceMade, "true");
    localStorage.setItem(keys.updatedAt, new Date().toISOString());
    activateConsentScripts();
    window.dispatchEvent(new CustomEvent("iconicCookieConsentUpdated", { detail: getPreferences() }));
  }

  function activateConsentScripts() {
    const preferences = getPreferences();
    document.querySelectorAll('script[type="text/plain"][data-cookie-category]').forEach((script) => {
      const category = script.dataset.cookieCategory;
      if (!preferences[category] || script.dataset.cookieLoaded === "true") return;
      const activeScript = document.createElement("script");
      [...script.attributes].forEach((attribute) => {
        if (attribute.name !== "type" && attribute.name !== "data-cookie-category" && attribute.name !== "data-cookie-loaded") {
          activeScript.setAttribute(attribute.name, attribute.value);
        }
      });
      activeScript.textContent = script.textContent;
      script.dataset.cookieLoaded = "true";
      script.after(activeScript);
    });
  }

  function hideBanner() {
    document.querySelector(".cookie-banner")?.remove();
  }

  function renderBanner() {
    if (hasChoice() || document.querySelector(".cookie-banner")) return;

    const banner = document.createElement("section");
    banner.className = "cookie-banner";
    banner.setAttribute("aria-label", t.cookieAria);
    banner.innerHTML = `
      <div class="cookie-banner-copy">
        <p>${t.cookieText1}</p>
        <p>${t.cookieText2}</p>
        <nav aria-label="${t.cookiePolicyAria}">
          <a href="${pageUrl("privacy.html")}">${t.footerPrivacy}</a>
          <a href="${pageUrl("cookie.html")}">${t.footerCookie}</a>
          <a href="${pageUrl("preferenze-cookie.html")}">${t.footerCookiePrefs}</a>
        </nav>
      </div>
      <div class="cookie-banner-actions">
        <button type="button" data-cookie-reject>${t.cookieReject}</button>
        <a class="cookie-secondary-action" href="${pageUrl("preferenze-cookie.html")}">${t.cookieCustomize}</a>
        <button type="button" data-cookie-accept>${t.cookieAcceptAll}</button>
      </div>
    `;
    document.body.append(banner);

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      savePreferences({ analytics: true, marketing: true });
      hideBanner();
    });
    banner.querySelector("[data-cookie-reject]").addEventListener("click", () => {
      savePreferences({ analytics: false, marketing: false });
      hideBanner();
    });
  }

  return { keys, getPreferences, savePreferences, activateConsentScripts, renderBanner };
})();

cookieConsent.activateConsentScripts();
cookieConsent.renderBanner();

const cookiePreferencesForm = document.querySelector("[data-cookie-preferences]");
if (cookiePreferencesForm) {
  const analyticsInput = cookiePreferencesForm.elements.analytics;
  const marketingInput = cookiePreferencesForm.elements.marketing;
  const status = cookiePreferencesForm.querySelector(".form-status");

  function syncCookiePreferenceFields() {
    const preferences = cookieConsent.getPreferences();
    analyticsInput.checked = preferences.analytics;
    marketingInput.checked = preferences.marketing;
  }

  function showCookiePreferenceStatus() {
    if (!status) return;
    status.textContent = t.cookiePrefsSaved;
    status.className = "form-status success";
  }

  syncCookiePreferenceFields();

  cookiePreferencesForm.addEventListener("submit", (event) => {
    event.preventDefault();
    cookieConsent.savePreferences({
      analytics: analyticsInput.checked,
      marketing: marketingInput.checked,
    });
    showCookiePreferenceStatus();
  });

  cookiePreferencesForm.querySelector("[data-cookie-preferences-accept]").addEventListener("click", () => {
    cookieConsent.savePreferences({ analytics: true, marketing: true });
    syncCookiePreferenceFields();
    showCookiePreferenceStatus();
  });

  cookiePreferencesForm.querySelector("[data-cookie-preferences-reject]").addEventListener("click", () => {
    cookieConsent.savePreferences({ analytics: false, marketing: false });
    syncCookiePreferenceFields();
    showCookiePreferenceStatus();
  });
}

const contactForm = document.querySelector(".contact-form");
if (contactForm) {
  const params = new URLSearchParams(location.search);
  const tipoParam = params.get("tipo");
  if (tipoParam === "config3d") {
    const message = document.querySelector("#message");
    if (message) {
      const components = params.get("elementi") || t.configNoAccessory;
      message.value = `IconicWall 3D — ${document.title}\n${t.configDimLabel}: ${params.get("dimensioni") || t.configTBD} cm\n${t.configFinishLabel}: ${params.get("finitura") || t.configTBD}\n${t.configElementsLabel}: ${components}`;
    }
  } else if (tipoParam === "campionario") {
    const wantsSamples = document.querySelector("#wants_samples");
    const message = document.querySelector("#message");
    if (wantsSamples) wantsSamples.checked = true;
    if (message && !message.value) message.value = t.configSampleMsg;
  } else if (tipoParam === "documentazione") {
    const wantsDocs = document.querySelector("#wants_docs");
    const message = document.querySelector("#message");
    if (wantsDocs) wantsDocs.checked = true;
    if (message && !message.value) message.value = t.configDocsMsg;
  }

  const status = contactForm.querySelector(".form-status");
  const submitButton = contactForm.querySelector(".contact-submit");
  const submitLabel = submitButton?.querySelector(".contact-submit-label");
  const fields = ["full_name", "email", "message", "privacy"];

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
    const message = contactForm.elements.message.value.trim();
    const privacy = contactForm.elements.privacy.checked;
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!fullName) {
      setFieldError("full_name", t.formErrorName);
      valid = false;
    }
    if (!email) {
      setFieldError("email", t.formErrorEmailEmpty);
      valid = false;
    } else if (!emailValid) {
      setFieldError("email", t.formErrorEmailInvalid);
      valid = false;
    }
    if (!message) {
      setFieldError("message", t.formErrorMessage);
      valid = false;
    }
    if (!privacy) {
      setFieldError("privacy", t.formErrorPrivacy);
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
      message: contactForm.elements.message.value.trim(),
      profilo: contactForm.elements.profilo?.value.trim() || "",
      company: contactForm.elements.company?.value.trim() || "",
      wants_samples: Boolean(contactForm.elements.wants_samples?.checked),
      wants_docs: Boolean(contactForm.elements.wants_docs?.checked),
      lingua: lang,
    };

    if (submitButton) {
      submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = t.formSending;
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
      setStatus(t.formSuccess, "success");
    } catch {
      setStatus(t.formError, "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = t.formSubmit;
      }
    }
  });
}
