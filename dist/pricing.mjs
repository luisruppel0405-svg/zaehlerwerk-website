export const pricing = Object.freeze({
  minimumCents: 2900,
  customQuoteThreshold: 5000,
  annualDiscountPercent: 10
});
export function calculatePrice(rawUnits, billing = 'monthly') {
  const units = Number(rawUnits);
  if (!Number.isSafeInteger(units) || units < 1 || units > 1000000) return null;
  if (!['monthly', 'annual'].includes(billing)) return null;
  const rateCents = units <= 500 ? 19 : units <= 2000 ? 15 : 12;
  const monthlyCents = Math.max(pricing.minimumCents, units * rateCents);
  const annualCents = Math.round(monthlyCents * 12 * .9);
  return { units, rateCents, monthlyCents, annualCents, custom: units > pricing.customQuoteThreshold,
    displayCents: billing === 'annual' ? annualCents / 12 : monthlyCents,
    billing };
}