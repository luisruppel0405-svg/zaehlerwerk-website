const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = {
  demo: "Demo-Anfrage",
  kontakt: "Kontaktanfrage",
  angebot: "Individuelles Angebot",
  datenschutz: "Fragen zur Datenverarbeitung",
};
const CONTACT_EMAIL = "kontakt@xn--zhlerwerk-v2a.eu";

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Methode nicht erlaubt." });
    return;
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  const name = String(body.name ?? "").trim();
  const company = String(body.company ?? "").trim();
  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const units = String(body.units ?? "").trim();
  const billing = String(body.billing ?? "").trim();
  const message = String(body.message ?? "").trim();
  const anliegen = TOPICS[body.anliegen] ? body.anliegen : "kontakt";

  const errors = {};
  if (name.length < 2) errors.name = "Bitte geben Sie Ihren Namen an.";
  if (company.length < 2) errors.company = "Bitte geben Sie Ihr Unternehmen an.";
  if (!EMAIL_REGEX.test(email)) errors.email = "Bitte geben Sie eine gültige E-Mail-Adresse an.";
  if (message.length < 10) errors.message = "Bitte beschreiben Sie Ihr Anliegen etwas genauer.";

  if (Object.keys(errors).length > 0) {
    res.status(422).json({ errors });
    return;
  }

  const subject = "ZählerWerk – " + TOPICS[anliegen];
  const text = [
    "Name: " + name,
    "Unternehmen: " + company,
    "E-Mail: " + email,
    phone ? "Telefon: " + phone : null,
    units ? "Verwaltete Einheiten: " + units : null,
    billing ? "Gewünschte Abrechnung: " + (billing === "annual" ? "Jährlich" : "Monatlich") : null,
    "",
    message,
  ]
    .filter((line) => line !== null)
    .join("\n");

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY nicht konfiguriert");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `ZählerWerk Website <${CONTACT_EMAIL}>`,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend-API antwortete mit Status ${response.status}`);
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("[kontakt] Versand fehlgeschlagen:", error);
    res.status(502).json({
      error:
        "Die Anfrage konnte nicht versendet werden. Bitte versuchen Sie es später erneut oder schreiben Sie uns direkt per E-Mail.",
    });
  }
};
