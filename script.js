const supportedLangs = ["it", "en", "fr", "de", "es", "nl"];
const langMatch = location.pathname.match(/^\/(en|fr|de|es|nl)(\/|$)/);
const lang = langMatch && supportedLangs.includes(langMatch[1]) ? langMatch[1] : "it";

// Percorso della pagina corrente senza prefisso di lingua, usato dallo switcher
// (piu' affidabile di data-page: piu' pagine di supporto condividono lo stesso data-page="info")
const currentPath = location.pathname.replace(/^\/(en|fr|de|es|nl)\//, "").replace(/^\//, "") || "index.html";

const translatedPaths = new Set([
  "index.html", "sistema.html", "collezione.html", "materiali.html", "accessori.html",
  "applicazioni.html", "origine.html", "contatti.html", "tecnologia-proprietaria.html",
  "faq.html", "manutenzione.html", "istruzioni-montaggio.html",
  "documentazione/index.html", "savhotel-mantegna-padova/index.html",
  "privacy.html", "cookie.html", "termini.html", "preferenze-cookie.html",
]);

function urlForLang(targetLang, filename) {
  return targetLang === "it" ? `/${filename}` : `/${targetLang}/${filename}`;
}

function pageUrl(filename) {
  return urlForLang(lang, filename);
}

const langNativeNames = { it: "Italiano", en: "English", fr: "Français", de: "Deutsch", es: "Español", nl: "Nederlands" };
const flagIcons = {
  it: `<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="1" height="2" fill="#009246"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#ce2b37"/></svg>`,
  en: `<svg viewBox="0 0 60 30" preserveAspectRatio="none"><rect width="60" height="30" fill="#00247d"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#cf142b" stroke-width="2"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#cf142b" stroke-width="6"/></svg>`,
  fr: `<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="1" height="2" fill="#0055A4"/><rect width="1" height="2" x="1" fill="#fff"/><rect width="1" height="2" x="2" fill="#EF4135"/></svg>`,
  de: `<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="3" height=".667" fill="#000"/><rect width="3" height=".667" y=".667" fill="#DD0000"/><rect width="3" height=".667" y="1.333" fill="#FFCE00"/></svg>`,
  es: `<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="3" height="2" fill="#AA151B"/><rect width="3" height="1" y=".5" fill="#F1BF00"/></svg>`,
  nl: `<svg viewBox="0 0 3 2" preserveAspectRatio="none"><rect width="3" height=".667" fill="#AE1C28"/><rect width="3" height=".667" y=".667" fill="#fff"/><rect width="3" height=".667" y="1.333" fill="#21468B"/></svg>`,
};

const i18n = {
  it: {
    nav: { sistema: "Sistema", collezione: "Collezione", materiali: "Materiali", accessori: "Accessori", applicazioni: "Applicazioni", origine: "Origine", contatti: "Contatti" },
    menuToggle: "Apri il menu",
    skipToContent: "Salta al contenuto",
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
    footerGuides: "Guide alla progettazione",
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
    facebookAria: "Facebook IconicWall",
    linkedinAria: "LinkedIn IconicWall",
    footerRights: "Tutti i diritti riservati.",
    footerTagline: "Progettato e realizzato in Italia",
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
    chatToggleAria: "Apri la chat",
    chatCloseAria: "Chiudi la chat",
    chatMinimizeAria: "Riduci a icona",
    chatTitle: "Assistente IconicWall",
    chatSubtitle: "Domande su sistema, materiali e prodotti",
    chatWelcome: "Ciao! Sono l'assistente virtuale di IconicWall. Posso rispondere a domande su sistema, collezione, materiali, accessori e installazione. Come posso aiutarti?",
    chatPlaceholder: "Scrivi un messaggio…",
    chatSendAria: "Invia messaggio",
    chatDisclaimer: "Risposte generate automaticamente. Per richieste commerciali o progetti specifici, usa il modulo contatti.",
    chatError: "Non riesco a rispondere in questo momento. Riprova tra poco o scrivici tramite il modulo contatti.",
    chatRateLimit: "Hai inviato troppi messaggi. Riprova tra qualche minuto.",
    chatThinking: "sta scrivendo…",
  },
  en: {
    nav: { sistema: "System", collezione: "Collection", materiali: "Materials", accessori: "Accessories", applicazioni: "Applications", origine: "Origin", contatti: "Contact" },
    menuToggle: "Open menu",
    skipToContent: "Skip to content",
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
    footerGuides: "Design guides",
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
    facebookAria: "Facebook IconicWall",
    linkedinAria: "LinkedIn IconicWall",
    footerRights: "All rights reserved.",
    footerTagline: "Progettato e realizzato in Italia",
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
    configTBD: "to be confirmed",
    configSampleMsg: "I would like to request an IconicWall materials sample kit.",
    configDocsMsg: "I would like to receive IconicWall technical documentation.",
    chatToggleAria: "Open chat",
    chatCloseAria: "Close chat",
    chatMinimizeAria: "Minimize chat",
    chatTitle: "IconicWall Assistant",
    chatSubtitle: "Questions about the system, materials and products",
    chatWelcome: "Hi! I'm the IconicWall virtual assistant. I can answer questions about the system, collection, materials, accessories and installation. How can I help you?",
    chatPlaceholder: "Type a message…",
    chatSendAria: "Send message",
    chatDisclaimer: "Answers are generated automatically. For commercial requests or specific projects, please use the contact form.",
    chatError: "I can't reply right now. Please try again shortly or reach us through the contact form.",
    chatRateLimit: "You've sent too many messages. Please try again in a few minutes.",
    chatThinking: "typing…",
  },
  fr: {
    nav: { sistema: "Système", collezione: "Collection", materiali: "Matériaux", accessori: "Accessoires", applicazioni: "Applications", origine: "Origine", contatti: "Contact" },
    menuToggle: "Ouvrir le menu",
    skipToContent: "Aller au contenu",
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
    footerGuides: "Guides de conception",
    footerFaq: "FAQ",
    footerMaintenance: "Entretien",
    footerInstructions: "Instructions de montage",
    footerTech: "Technologie propriétaire",
    footerLegal: "Mentions légales",
    footerPrivacy: "Politique de confidentialité",
    footerCookie: "Politique de cookies",
    footerCookiePrefs: "Préférences cookies",
    footerTerms: "Conditions générales",
    footerSocial: "Réseaux sociaux",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicWall",
    linkedinAria: "LinkedIn IconicWall",
    footerRights: "Tous droits réservés.",
    footerTagline: "Progettato e realizzato in Italia",
    cookieAria: "Préférences cookies",
    cookieText1: "Nous utilisons des cookies techniques nécessaires au fonctionnement du site et, uniquement avec votre consentement, des cookies analytiques et marketing pour améliorer l'expérience, mesurer les visites et vous proposer des contenus plus pertinents.",
    cookieText2: "Vous pouvez accepter tous les cookies, refuser ceux qui ne sont pas nécessaires ou personnaliser vos préférences.",
    cookiePolicyAria: "Informations sur les cookies",
    cookieReject: "Refuser les non essentiels",
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
    configSampleMsg: "Je souhaite demander un jeu d'échantillons des matériaux IconicWall.",
    configDocsMsg: "Je souhaite recevoir la documentation technique IconicWall.",
    chatToggleAria: "Ouvrir le chat",
    chatCloseAria: "Fermer le chat",
    chatMinimizeAria: "Réduire le chat",
    chatTitle: "Assistant IconicWall",
    chatSubtitle: "Questions sur le système, les matériaux et les produits",
    chatWelcome: "Bonjour ! Je suis l'assistant virtuel d'IconicWall. Je peux répondre à vos questions sur le système, la collection, les matériaux, les accessoires et la pose. Comment puis-je vous aider ?",
    chatPlaceholder: "Écrivez un message…",
    chatSendAria: "Envoyer le message",
    chatDisclaimer: "Réponses générées automatiquement. Pour toute demande commerciale ou projet spécifique, utilisez le formulaire de contact.",
    chatError: "Je ne peux pas répondre pour le moment. Réessayez dans un instant ou écrivez-nous via le formulaire de contact.",
    chatRateLimit: "Vous avez envoyé trop de messages. Réessayez dans quelques minutes.",
    chatThinking: "est en train d'écrire…",
  },
  de: {
    nav: { sistema: "System", collezione: "Kollektion", materiali: "Materialien", accessori: "Zubehör", applicazioni: "Anwendungen", origine: "Ursprung", contatti: "Kontakt" },
    menuToggle: "Menü öffnen",
    skipToContent: "Zum Inhalt springen",
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
    footerGuides: "Planungsleitfäden",
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
    facebookAria: "Facebook IconicWall",
    linkedinAria: "LinkedIn IconicWall",
    footerRights: "Alle Rechte vorbehalten.",
    footerTagline: "Progettato e realizzato in Italia",
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
    chatToggleAria: "Chat öffnen",
    chatCloseAria: "Chat schließen",
    chatMinimizeAria: "Chat minimieren",
    chatTitle: "IconicWall Assistent",
    chatSubtitle: "Fragen zu System, Materialien und Produkten",
    chatWelcome: "Hallo! Ich bin der virtuelle Assistent von IconicWall. Ich beantworte Fragen zu System, Kollektion, Materialien, Zubehör und Montage. Wie kann ich Ihnen helfen?",
    chatPlaceholder: "Nachricht schreiben…",
    chatSendAria: "Nachricht senden",
    chatDisclaimer: "Antworten werden automatisch generiert. Für kommerzielle Anfragen oder konkrete Projekte nutzen Sie bitte das Kontaktformular.",
    chatError: "Ich kann gerade nicht antworten. Versuchen Sie es später erneut oder schreiben Sie uns über das Kontaktformular.",
    chatRateLimit: "Sie haben zu viele Nachrichten gesendet. Bitte versuchen Sie es in ein paar Minuten erneut.",
    chatThinking: "schreibt…",
  },
  es: {
    nav: { sistema: "Sistema", collezione: "Colección", materiali: "Materiales", accessori: "Accesorios", applicazioni: "Aplicaciones", origine: "Origen", contatti: "Contacto" },
    menuToggle: "Abrir menú",
    skipToContent: "Saltar al contenido",
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
    footerGuides: "Guías de proyecto",
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
    facebookAria: "Facebook IconicWall",
    linkedinAria: "LinkedIn IconicWall",
    footerRights: "Todos los derechos reservados.",
    footerTagline: "Progettato e realizzato in Italia",
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
    chatToggleAria: "Abrir el chat",
    chatCloseAria: "Cerrar el chat",
    chatMinimizeAria: "Minimizar el chat",
    chatTitle: "Asistente IconicWall",
    chatSubtitle: "Preguntas sobre el sistema, los materiales y los productos",
    chatWelcome: "¡Hola! Soy el asistente virtual de IconicWall. Puedo responder preguntas sobre el sistema, la colección, los materiales, los accesorios y la instalación. ¿En qué puedo ayudarte?",
    chatPlaceholder: "Escribe un mensaje…",
    chatSendAria: "Enviar mensaje",
    chatDisclaimer: "Las respuestas se generan automáticamente. Para solicitudes comerciales o proyectos específicos, utiliza el formulario de contacto.",
    chatError: "Ahora mismo no puedo responder. Inténtalo de nuevo en un momento o escríbenos a través del formulario de contacto.",
    chatRateLimit: "Has enviado demasiados mensajes. Inténtalo de nuevo en unos minutos.",
    chatThinking: "está escribiendo…",
  },
  nl: {
    nav: { sistema: "Systeem", collezione: "Collectie", materiali: "Materialen", accessori: "Accessoires", applicazioni: "Toepassingen", origine: "Oorsprong", contatti: "Contact" },
    menuToggle: "Menu openen",
    skipToContent: "Naar de inhoud",
    homeAria: "IconicWall home",
    iconicAria: "Iconic home",
    footerIntroAria: "IconicWall",
    footerCompanyAria: "Iconic S.R.L.",
    footerIntro: "Een permanente structuur, ontworpen<br>voor oppervlakken, licht, accessoires<br>en functies die met de tijd mee-evolueren.",
    footerCompanyName: "ICONIC S.R.L. a socio unico",
    footerAddress: "Via Guido Rossa, 39<br>35020 Ponte San Nicolò (PD), Italië",
    footerVat: "BTW-nr. / Fiscaal nr. 04683100988",
    footerResources: "Informatie",
    footerDocs: "Documentatie",
    footerGuides: "Ontwerpgidsen",
    footerFaq: "FAQ",
    footerMaintenance: "Onderhoud",
    footerInstructions: "Montage-instructies",
    footerTech: "Eigen technologie",
    footerLegal: "Juridisch",
    footerPrivacy: "Privacybeleid",
    footerCookie: "Cookiebeleid",
    footerCookiePrefs: "Cookievoorkeuren",
    footerTerms: "Algemene voorwaarden",
    footerSocial: "Social media",
    instagramAria: "Instagram IconicWall",
    facebookAria: "Facebook IconicWall",
    linkedinAria: "LinkedIn IconicWall",
    footerRights: "Alle rechten voorbehouden.",
    footerTagline: "Ontworpen en gemaakt in Italië",
    cookieAria: "Cookievoorkeuren",
    cookieText1: "Wij gebruiken technische cookies die noodzakelijk zijn voor de werking van de site en, uitsluitend met uw toestemming, analytische en marketingcookies om de ervaring te verbeteren, bezoeken te meten en relevantere content te tonen.",
    cookieText2: "U kunt alle cookies accepteren, niet-noodzakelijke cookies weigeren of uw voorkeuren aanpassen.",
    cookiePolicyAria: "Cookie-informatie",
    cookieReject: "Niet-noodzakelijke weigeren",
    cookieCustomize: "Aanpassen",
    cookieAcceptAll: "Alles accepteren",
    cookiePrefsSaved: "Uw voorkeuren zijn opgeslagen. U kunt ze op elk moment wijzigen door naar deze pagina terug te keren.",
    videoPause: "Pauze",
    videoPlay: "Afspelen",
    formErrorName: "Vul uw voor- en achternaam in.",
    formErrorEmailEmpty: "Vul een e-mailadres in.",
    formErrorEmailInvalid: "Vul een geldig e-mailadres in.",
    formErrorMessage: "Schrijf een bericht.",
    formErrorPrivacy: "U dient de privacyverklaring te accepteren.",
    formSending: "BEZIG MET VERZENDEN…",
    formSubmit: "AANVRAAG VERSTUREN",
    formSuccess: "Aanvraag verzonden. Wij nemen zo snel mogelijk contact met u op.",
    formError: "De aanvraag kon niet worden verzonden. Probeer het over enkele ogenblikken opnieuw of stuur ons een e-mail.",
    configDimLabel: "Afmetingen",
    configFinishLabel: "Afwerking",
    configElementsLabel: "Elementen",
    configNoAccessory: "geen accessoires",
    configTBD: "nader te bepalen",
    configSampleMsg: "Ik wil graag een staalkaart van de IconicWall-materialen aanvragen.",
    configDocsMsg: "Ik ontvang graag de technische documentatie van IconicWall.",
    chatToggleAria: "Chat openen",
    chatCloseAria: "Chat sluiten",
    chatMinimizeAria: "Chat minimaliseren",
    chatTitle: "IconicWall-assistent",
    chatSubtitle: "Vragen over systeem, materialen en producten",
    chatWelcome: "Hallo! Ik ben de virtuele assistent van IconicWall. Ik beantwoord graag vragen over het systeem, de collectie, materialen, accessoires en montage. Waarmee kan ik u helpen?",
    chatPlaceholder: "Typ een bericht…",
    chatSendAria: "Bericht versturen",
    chatDisclaimer: "Automatisch gegenereerde antwoorden. Gebruik voor commerciële aanvragen of specifieke projecten het contactformulier.",
    chatError: "Ik kan op dit moment niet antwoorden. Probeer het over enkele ogenblikken opnieuw of gebruik het contactformulier.",
    chatRateLimit: "U hebt te veel berichten verstuurd. Probeer het over enkele minuten opnieuw.",
    chatThinking: "is aan het typen…",
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
  "email": "info@iconicwall.it",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Guido Rossa, 39",
    "addressLocality": "Ponte San Nicolò",
    "postalCode": "35020",
    "addressRegion": "PD",
    "addressCountry": "IT",
  },
  "sameAs": [
    "https://www.instagram.com/iconicwall.it/",
    "https://www.facebook.com/profile.php?id=61591808465350",
    "https://www.linkedin.com/company/iconicwall/",
  ],
});
document.head.appendChild(organizationSchema);

// Schema WebSite: solo sulla home di ciascuna lingua
if (page === "home") {
  const websiteSchema = document.createElement("script");
  websiteSchema.type = "application/ld+json";
  websiteSchema.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "IconicWall",
    "url": "https://www.iconicwall.it/",
    "inLanguage": lang,
    "publisher": { "@type": "Organization", "name": "Iconic S.R.L." },
  });
  document.head.appendChild(websiteSchema);
}

const langSwitcherPath = translatedPaths.has(currentPath) ? currentPath : "index.html";
const langDropdownItems = supportedLangs.map((targetLang) => `
    <li role="option" aria-selected="${targetLang === lang}">
      <a href="${urlForLang(targetLang, langSwitcherPath)}" ${targetLang === lang ? 'class="active"' : ""}>
        <span class="flag">${flagIcons[targetLang]}</span>
        <span>${langNativeNames[targetLang]}</span>
      </a>
    </li>`).join("");

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
    <div class="lang-switcher" aria-label="Language">
      <button type="button" class="lang-current" aria-haspopup="listbox" aria-expanded="false">
        <span class="flag">${flagIcons[lang]}</span>
        <span class="lang-code">${lang.toUpperCase()}</span>
        <svg class="lang-caret" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
      </button>
      <ul class="lang-dropdown" role="listbox">${langDropdownItems}</ul>
    </div>
  </nav>`;
const mainEl = document.querySelector("main");
if (mainEl && !mainEl.id) mainEl.id = "contenuto";
document.body.prepend(header);
const skipLink = document.createElement("a");
skipLink.className = "skip-link";
skipLink.href = "#contenuto";
skipLink.textContent = t.skipToContent;
document.body.prepend(skipLink);

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
            <a href="mailto:info@iconicwall.it">info@iconicwall.it</a>
          </li>
        </ul>
      </section>

      <nav class="footer-column footer-nav" aria-label="${t.footerResources}">
        <h2>${t.footerResources}</h2>
        <a href="${pageUrl("documentazione/index.html")}">${t.footerDocs}</a>
        ${lang === "it" ? `<a href="/guide/index.html">${t.footerGuides}</a>` : ""}
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
        <a href="https://www.instagram.com/iconicwall.it/" target="_blank" rel="noopener noreferrer" aria-label="${t.instagramAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/></svg>
          <span>Instagram</span>
        </a>
        <a href="https://www.facebook.com/profile.php?id=61591808465350" target="_blank" rel="noopener noreferrer" aria-label="${t.facebookAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z"/></svg>
          <span>Facebook</span>
        </a>
        <a href="https://www.linkedin.com/company/iconicwall/" target="_blank" rel="noopener noreferrer" aria-label="${t.linkedinAria}">
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

const langSwitcher = document.querySelector(".lang-switcher");
const langButton = langSwitcher?.querySelector(".lang-current");
if (langSwitcher && langButton) {
  function closeLangDropdown() {
    langButton.setAttribute("aria-expanded", "false");
    langSwitcher.classList.remove("open");
  }
  langButton.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = langButton.getAttribute("aria-expanded") === "true";
    langButton.setAttribute("aria-expanded", String(!open));
    langSwitcher.classList.toggle("open", !open);
  });
  document.addEventListener("click", (event) => {
    if (!langSwitcher.contains(event.target)) closeLangDropdown();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLangDropdown();
  });
}

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

// Google Analytics 4 — inerte finché l'utente non acconsente ai cookie "analytics"
const gaMeasurementId = "G-YEQ1FYZMRB";
const gaLoader = document.createElement("script");
gaLoader.setAttribute("type", "text/plain");
gaLoader.setAttribute("data-cookie-category", "analytics");
gaLoader.setAttribute("async", "");
gaLoader.setAttribute("src", `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`);
document.head.appendChild(gaLoader);

const gaInit = document.createElement("script");
gaInit.setAttribute("type", "text/plain");
gaInit.setAttribute("data-cookie-category", "analytics");
gaInit.textContent = `
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaMeasurementId}', { anonymize_ip: true });
`;
document.head.appendChild(gaInit);

cookieConsent.activateConsentScripts();
cookieConsent.renderBanner();

// Eventi GA4 sui gesti intermedi — stesso gate di consenso di generate_lead:
// senza consenso analytics window.gtag non esiste e non parte nulla.
function trackGesture(name, params) {
  if (typeof gtag === "function") gtag("event", name, params);
}

document.addEventListener("click", (event) => {
  const link = event.target.closest("a[href]");
  if (!link) return;
  const href = link.getAttribute("href") || "";

  if (href.startsWith("mailto:")) {
    trackGesture("email_click", { pagina: location.pathname });
    return;
  }
  if (href.startsWith("tel:")) {
    trackGesture("phone_click", { pagina: location.pathname });
    return;
  }
  if (location.pathname.includes("/guide/") && /\/contatti\.html$/.test(link.pathname)) {
    const guida = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    const tipo = new URLSearchParams(link.search).get("tipo");
    trackGesture("guide_cta_click", tipo ? { guida, tipo } : { guida });
  }
});

if (/\/configuratore\.html$/.test(location.pathname)) {
  const origine =
    document.referrer && document.referrer.startsWith(location.origin)
      ? new URL(document.referrer).pathname
      : "";
  trackGesture("configurator_open", origine ? { origine } : {});
}

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
    const message = document.querySelector("#message");
    if (message && !message.value) message.value = t.configSampleMsg;
  } else if (tipoParam === "documentazione") {
    const message = document.querySelector("#message");
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

  const contactFormLoadedAt = Date.now();

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("");

    if (!validateContactForm()) return;

    const payload = {
      full_name: contactForm.elements.full_name.value.trim(),
      email: contactForm.elements.email.value.trim(),
      message: contactForm.elements.message.value.trim(),
      lingua: lang,
      // anti-spam: campo esca (invisibile agli umani) + tempo di compilazione
      website: contactForm.elements.website ? contactForm.elements.website.value.trim() : "",
      elapsed_ms: Date.now() - contactFormLoadedAt,
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
      if (typeof gtag === "function") {
        gtag("event", "generate_lead", { form_id: "contact", lingua: lang });
      }
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

const iconicChat = (() => {
  const STORAGE_KEY = "iconic_chat_history";
  const POSITION_KEY = "iconic_chat_position";
  const MAX_STORED_MESSAGES = 20;

  function loadHistory() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveHistory(nextHistory) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory.slice(-MAX_STORED_MESSAGES)));
    } catch {
      // storage non disponibile (es. modalita' privata): la conversazione resta solo in memoria
    }
  }

  function loadPosition() {
    try {
      const raw = localStorage.getItem(POSITION_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && Number.isFinite(parsed.left) && Number.isFinite(parsed.top)) return parsed;
    } catch {
      // ignora, si usa la posizione di default
    }
    return null;
  }

  function savePosition(position) {
    try {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    } catch {
      // storage non disponibile: la posizione custom vale solo per questa sessione
    }
  }

  let history = loadHistory();
  let sending = false;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "chat-toggle";
  toggle.setAttribute("aria-label", t.chatToggleAria);
  toggle.setAttribute("aria-expanded", "false");
  toggle.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>`;
  document.body.append(toggle);

  const panel = document.createElement("section");
  panel.className = "chat-panel";
  panel.setAttribute("aria-label", t.chatTitle);
  panel.innerHTML = `
    <header class="chat-panel-header">
      <div>
        <strong>${t.chatTitle}</strong>
        <span>${t.chatSubtitle}</span>
      </div>
      <div class="chat-panel-actions">
        <button type="button" class="chat-minimize" aria-label="${t.chatMinimizeAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>
        </button>
        <button type="button" class="chat-close" aria-label="${t.chatCloseAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>
        </button>
      </div>
    </header>
    <div class="chat-body">
      <div class="chat-messages" role="log" aria-live="polite"></div>
      <form class="chat-input-row">
        <label class="sr-only" for="chat-input">${t.chatPlaceholder}</label>
        <input id="chat-input" type="text" placeholder="${t.chatPlaceholder}" maxlength="1000" autocomplete="off">
        <button type="submit" class="chat-send" aria-label="${t.chatSendAria}">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4Z"/></svg>
        </button>
      </form>
      <p class="chat-disclaimer">${t.chatDisclaimer}</p>
    </div>`;
  document.body.append(panel);

  const header = panel.querySelector(".chat-panel-header");
  const messagesEl = panel.querySelector(".chat-messages");
  const inputForm = panel.querySelector(".chat-input-row");
  const input = panel.querySelector("#chat-input");
  const minimizeButton = panel.querySelector(".chat-minimize");
  const closeButton = panel.querySelector(".chat-close");

  const DRAG_MIN_WIDTH = 760;

  function clampPosition(left, top) {
    const maxLeft = Math.max(0, innerWidth - panel.offsetWidth);
    const maxTop = Math.max(0, innerHeight - panel.offsetHeight);
    return { left: Math.min(Math.max(left, 0), maxLeft), top: Math.min(Math.max(top, 0), maxTop) };
  }

  function applyPosition(position) {
    panel.style.left = `${position.left}px`;
    panel.style.top = `${position.top}px`;
    panel.style.right = "auto";
    panel.style.bottom = "auto";
  }

  function resetPosition() {
    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
    panel.style.bottom = "";
  }

  const storedPosition = loadPosition();
  if (storedPosition && innerWidth >= DRAG_MIN_WIDTH) applyPosition(clampPosition(storedPosition.left, storedPosition.top));

  addEventListener("resize", () => {
    if (innerWidth < DRAG_MIN_WIDTH) {
      resetPosition();
      return;
    }
    if (!panel.style.left) return;
    applyPosition(clampPosition(parseFloat(panel.style.left), parseFloat(panel.style.top)));
  });

  let dragState = null;
  header.addEventListener("pointerdown", (event) => {
    if (event.target.closest("button") || innerWidth < DRAG_MIN_WIDTH) return;
    const rect = panel.getBoundingClientRect();
    dragState = { pointerId: event.pointerId, offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top };
    header.setPointerCapture(event.pointerId);
    header.classList.add("dragging");
  });
  header.addEventListener("pointermove", (event) => {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    const position = clampPosition(event.clientX - dragState.offsetX, event.clientY - dragState.offsetY);
    applyPosition(position);
  });
  function endDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) return;
    header.classList.remove("dragging");
    dragState = null;
    savePosition({ left: parseFloat(panel.style.left), top: parseFloat(panel.style.top) });
  }
  header.addEventListener("pointerup", endDrag);
  header.addEventListener("pointercancel", endDrag);

  function renderMessage(role, content) {
    const bubble = document.createElement("div");
    bubble.className = `chat-message chat-message-${role}`;
    content.split("\n").forEach((line) => {
      if (!line) return;
      const p = document.createElement("p");
      p.textContent = line;
      bubble.append(p);
    });
    messagesEl.append(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function renderThinking() {
    const bubble = document.createElement("div");
    bubble.className = "chat-message chat-message-assistant chat-message-thinking";
    bubble.innerHTML = `<span class="sr-only">${t.chatThinking}</span><span class="chat-dot"></span><span class="chat-dot"></span><span class="chat-dot"></span>`;
    messagesEl.append(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function renderHistory() {
    messagesEl.innerHTML = "";
    if (history.length === 0) {
      renderMessage("assistant", t.chatWelcome);
    } else {
      history.forEach((message) => renderMessage(message.role, message.content));
    }
  }

  renderHistory();

  function openPanel() {
    panel.classList.add("is-open");
    panel.classList.remove("is-minimized");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("chat-active");
    requestAnimationFrame(() => input.focus());
  }

  function minimizePanel() {
    panel.classList.add("is-open", "is-minimized");
    toggle.setAttribute("aria-expanded", "true");
    document.body.classList.add("chat-active");
  }

  function closePanel() {
    panel.classList.remove("is-open", "is-minimized");
    toggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("chat-active");
    toggle.focus();
  }

  function isOpen() {
    return panel.classList.contains("is-open");
  }

  toggle.addEventListener("click", openPanel);
  minimizeButton.addEventListener("click", () => {
    if (panel.classList.contains("is-minimized")) openPanel(); else minimizePanel();
  });
  header.addEventListener("click", (event) => {
    if (panel.classList.contains("is-minimized") && !event.target.closest("button")) openPanel();
  });
  closeButton.addEventListener("click", closePanel);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen() && !panel.classList.contains("is-minimized")) closePanel();
  });

  inputForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = input.value.trim();
    if (!value || sending) return;

    input.value = "";
    renderMessage("user", value);
    history.push({ role: "user", content: value });
    saveHistory(history);

    const thinking = renderThinking();
    sending = true;
    input.disabled = true;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, messages: history }),
      });

      thinking.remove();

      if (response.status === 429) {
        renderMessage("assistant", t.chatRateLimit);
        return;
      }
      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      if (!data.reply) throw new Error("Empty reply");

      renderMessage("assistant", data.reply);
      history.push({ role: "assistant", content: data.reply });
      saveHistory(history);
    } catch {
      thinking.remove();
      renderMessage("assistant", t.chatError);
    } finally {
      sending = false;
      input.disabled = false;
      input.focus();
    }
  });

  return { openPanel, closePanel };
})();
