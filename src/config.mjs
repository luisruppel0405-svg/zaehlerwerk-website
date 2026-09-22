// Facts verified against zählerwerk.eu on 2026-09-15.
// Private review remains enabled until the remaining business details are confirmed.
export const site = {
  name: 'ZählerWerk',
  origin: 'https://xn--zhlerwerk-v2a.eu',
  productionOrigin: 'https://xn--zhlerwerk-v2a.eu',
  indexable: true,
  email: 'kontakt@xn--zhlerwerk-v2a.eu',
  displayEmail: 'kontakt@zählerwerk.eu',
  phone: '+491606141200',
  displayPhone: '0160 6141200',
  owner: 'Luis Ruppel',
  street: 'G.-R. Twelbeck Straße 11',
  city: '49596 Gehrde',
  pricing: {
    minimumCents: 2900,
    annualDiscountPercent: 10,
    customQuoteThreshold: 5000,
    tiers: [{ upTo: 500, cents: 19 }, { upTo: 2000, cents: 15 }, { upTo: null, cents: 12 }]
  }
};