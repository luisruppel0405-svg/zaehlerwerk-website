import { calculatePrice } from '/pricing.mjs';
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeColorMeta = document.getElementById('theme-color-meta');
const darkMedia = matchMedia('(prefers-color-scheme: dark)');
function currentTheme() {
  const explicit = root.getAttribute('data-theme');
  if (explicit === 'dark' || explicit === 'light') return explicit;
  return darkMedia.matches ? 'dark' : 'light';
}
function syncTheme() {
  const theme = currentTheme();
  themeToggle?.setAttribute('aria-pressed', String(theme === 'dark'));
  themeToggle?.setAttribute('aria-label', theme === 'dark' ? 'Helles Design aktivieren' : 'Dunkles Design aktivieren');
  if (themeColorMeta) themeColorMeta.content = theme === 'dark' ? '#081a14' : '#10644d';
}
themeToggle?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('zw-theme', next); } catch {}
  syncTheme();
});
darkMedia.addEventListener('change', () => {
  if (root.getAttribute('data-theme') !== 'dark' && root.getAttribute('data-theme') !== 'light') syncTheme();
});
syncTheme();
const menu = document.querySelector('.menu');
const navigation = document.querySelector('#navigation');
function setMenu(open) {
  if (!menu || !navigation) return;
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  navigation.classList.toggle('is-open', open);
}
menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
navigation?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
    setMenu(false); menu.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.site-header')) setMenu(false);
});
matchMedia('(min-width: 901px)').addEventListener('change', event => {
  if (event.matches) setMenu(false);
});
// All reading content remains visible without JavaScript or animation support.
if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible'); observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top > innerHeight) {
      element.classList.add('will-reveal'); observer.observe(element);
    }
  });
}
const dialog = document.getElementById('screenshot-dialog');
const shotData = {
  desktop: { src: '/assets/zaehlerwerk-desktop.png', title: 'ZählerWerk · Desktop-Übersicht', alt: 'Übersicht über Objekte, Zähler und offene Ablesungen', type: 'desktop' },
  mobile: { src: '/assets/zaehlerwerk-mobil.jpeg', title: 'ZählerWerk · Heute', alt: 'Mobile Übersicht mit offenen Ablesungen und Objekten', type: 'mobile' },
  reading: { src: '/assets/zaehlerwerk-schnellablesung.jpeg', title: 'ZählerWerk · Schnellablesung', alt: 'Mobile Suche nach Zählernummer für die Schnellablesung', type: 'mobile' }
};
const missingShots = new Set();
document.querySelectorAll('.shot-crop img').forEach(img => {
  const markMissing = () => {
    const figure = img.closest('.real-shot');
    figure?.classList.add('shot-missing');
    const type = figure?.querySelector('[data-shot]')?.dataset.shot;
    if (type) missingShots.add(type);
  };
  if (img.complete && img.naturalWidth === 0) markMissing();
  else img.addEventListener('error', markMissing, { once: true });
});
let activeShot;
let previousOverflow = '';
document.querySelectorAll('[data-shot]').forEach(button => button.addEventListener('click', () => {
  if (missingShots.has(button.dataset.shot)) return;
  const data = shotData[button.dataset.shot];
  if (!data || !dialog) return;
  if (typeof dialog.showModal !== 'function') {
    window.open(data.src, '_blank', 'noopener'); return;
  }
  activeShot = button;
  const img = document.getElementById('dialog-image');
  img.src = data.src; img.alt = data.alt;
  img.removeAttribute('width'); img.removeAttribute('height');
  document.getElementById('screenshot-title').textContent = data.title;
  document.getElementById('dialog-caption').textContent = data.type === 'desktop' && innerWidth <= 700
    ? 'Originalansicht aus ZählerWerk. Für Details horizontal scrollen.'
    : 'Originalansicht aus ZählerWerk.';
  document.querySelector('.dialog-image-wrap').className = 'dialog-image-wrap ' + data.type;
  previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  dialog.showModal();
  dialog.querySelector('.dialog-body').scrollTop = 0;
  dialog.querySelector('.dialog-body').scrollLeft = 0;
}));
dialog?.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  }
});
dialog?.addEventListener('close', () => {
  document.body.style.overflow = previousOverflow;
  activeShot?.focus();
});
const money = cents => new Intl.NumberFormat('de-DE', {
  style: 'currency', currency: 'EUR', minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2
}).format(cents / 100);
const calculator = document.getElementById('price-calculator');
if (calculator) {
  const unitsInput = document.getElementById('units');
  const range = document.getElementById('unit-range');
  const update = () => {
    const billing = calculator.elements.billing.value;
    const result = calculatePrice(unitsInput.value, billing);
    document.getElementById('price-error').hidden = !!result;
    unitsInput.setAttribute('aria-invalid', String(!result));
    calculator.querySelector('.price-result').hidden = !result;
    if (!result) return;
    range.value = Math.min(6000, result.units);
    range.setAttribute('aria-valuetext', result.units >= 6000 ? '6.000 Einheiten oder mehr' : result.units.toLocaleString('de-DE') + ' Einheiten');
    document.querySelectorAll('[data-units]').forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.units) === result.units)));
    const total = document.getElementById('price-total');
    total.textContent = result.custom ? 'Individuelles Angebot' : money(result.displayCents);
    total.classList.toggle('custom-price', result.custom);
    document.getElementById('price-period').textContent = result.custom ? 'Für mehr als 5.000 Einheiten' : billing === 'annual' ? 'Monatsdurchschnitt bei jährlicher Abrechnung' : 'Bei monatlicher Abrechnung';
    document.getElementById('price-suffix').textContent = result.custom ? '' : '/Monat';
    document.getElementById('price-description').textContent = result.custom
      ? 'Wir besprechen Einführung und Konditionen persönlich mit Ihnen.'
      : money(result.rateCents) + ' pro Einheit · Mindestpreis ' + money(2900) + '/Monat vor Jahresrabatt';
    const annual = document.getElementById('price-annual');
    annual.hidden = result.custom || billing !== 'annual';
    annual.textContent = money(result.annualCents) + ' pro Jahr · jährliche Zahlung · 10 % Rabatt berücksichtigt';
    const params = new URLSearchParams({ anliegen: result.custom ? 'angebot' : 'demo', units: String(result.units), billing });
    const cta = document.getElementById('price-cta');
    cta.href = '/kontakt/?' + params.toString();
    cta.textContent = result.custom ? 'Individuelles Angebot anfragen' : 'Demo für Ihren Bestand anfragen';
  };
  calculator.addEventListener('submit', event => event.preventDefault());
  unitsInput.addEventListener('input', update);
  calculator.querySelectorAll('[name=billing]').forEach(input => input.addEventListener('change', update));
  range.addEventListener('input', () => { unitsInput.value = range.value; update(); });
  calculator.querySelectorAll('[data-units]').forEach(button => button.addEventListener('click', () => {
    unitsInput.value = button.dataset.units; update();
  }));
  update();
}
const form = document.getElementById('contact-form');
if (form) {
  const params = new URLSearchParams(location.search);
  const inquiry = params.get('anliegen');
  if (['demo', 'kontakt', 'angebot', 'datenschutz'].includes(inquiry)) form.elements.inquiry.value = inquiry;
  const units = params.get('units');
  if (units && calculatePrice(units)) form.elements.units.value = units;
  const billing = params.get('billing');
  if (['monthly', 'annual'].includes(billing)) form.elements.billing.value = billing;
  const generateButton = form.querySelector('[type=submit]');
  const defaultButtonLabel = generateButton.innerHTML;
  const errorBox = document.getElementById('send-error');
  const defaultErrorHTML = errorBox.innerHTML;
  const formOpenedAt = Date.now();
  generateButton.disabled = false;
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const values = new FormData(form);
    const get = name => String(values.get(name) || '').trim();
    const ready = document.getElementById('email-ready');
    ready.hidden = true;
    errorBox.hidden = true;
    errorBox.innerHTML = defaultErrorHTML;
    generateButton.disabled = true;
    generateButton.textContent = 'Wird gesendet…';
    try {
      const response = await fetch('/api/kontakt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: get('name'), company: get('company'), email: get('email'),
          phone: get('phone'), units: get('units'), billing: get('billing'),
          anliegen: get('inquiry'), message: get('message'),
          website: get('website'), elapsed: Date.now() - formOpenedAt
        })
      });
      if (response.ok) {
        form.reset();
        ready.hidden = false;
        ready.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      } else if (response.status === 422) {
        const data = await response.json().catch(() => null);
        const messages = data?.errors ? Object.values(data.errors) : null;
        if (messages?.length) errorBox.textContent = 'Bitte prüfen Sie Ihre Angaben: ' + messages.join(' ');
        errorBox.hidden = false;
      } else {
        throw new Error('send-failed');
      }
    } catch {
      errorBox.innerHTML = defaultErrorHTML;
      errorBox.hidden = false;
    } finally {
      generateButton.disabled = false;
      generateButton.innerHTML = defaultButtonLabel;
    }
  });
  // A changed field hides a previous confirmation/error, so it doesn't linger after edits.
  form.addEventListener('input', () => {
    document.getElementById('email-ready').hidden = true;
    document.getElementById('send-error').hidden = true;
  });
}