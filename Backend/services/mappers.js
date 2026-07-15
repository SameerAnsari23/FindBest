// Mappers: generic Amazon/Flipkart scraper items -> per-category card shapes
// (the exact prop shapes the frontend card components expect).

const percentOff = (price, mrp) => {
  const p = Number(String(price).replace(/[₹,]/g, ""));
  const m = Number(String(mrp).replace(/[₹,]/g, ""));
  if (!p || !m || m <= p) return "0% Off";
  return `${Math.round(((m - p) * 100) / m)}% Off`;
};

const toClothingCard = (items) =>
  items.map((p) => ({
    link: p.link,
    image: p.image,
    title: p.name,
    price: p.mrp || p.price,
    discountPrice: p.price,
    discount: percentOff(p.price, p.mrp),
    scrapFrom: p.scrapFrom,
  }));

const toSmartphoneCard = (items) =>
  items.map((p) => ({
    name: p.name,
    image: p.image,
    price: p.price,
    SPEC_SCORE: "—",
    Status: "Available",
    Ratings: p.rating || "N/A",
    fullURL: p.link,
    scrapFrom: p.scrapFrom,
  }));

const toGroceryCard = (items) =>
  items.map((p) => ({
    groceryIMG: p.image,
    groceryName: p.name,
    groceryURL: p.link,
    groceryMRP: p.mrp || p.price,
    groceryNewPrice: p.price,
    grocerySavedPrice: percentOff(p.price, p.mrp),
    groceryQnty: "",
    scrapFrom: p.scrapFrom,
  }));

const toMedicineCard = (items) =>
  items.map((p) => ({
    medicineIMG: p.image,
    medicineName: p.name,
    medicineURL: p.link,
    medicineMRP: p.mrp || p.price,
    medicineNewPrice: p.price,
    medicineSavedPrice: percentOff(p.price, p.mrp),
    medicineQnty: "",
    scrapFrom: p.scrapFrom,
  }));

// Weighted (Bayesian) rating score: a plain rating sort is unfair — 5★ from
// 3 people shouldn't beat 4.4★ from 16,000. score = (v·R + m·C) / (v + m),
// where m is a confidence threshold and C the assumed average rating.
const weightedScore = (rating, count) => {
  const R = parseFloat(rating) || 0; // "4.6/5" -> 4.6
  if (!R) return -1; // unrated items sink to the end (stable order preserved)
  const v = Number(count) || 0;
  if (!v) return R; // count unknown: fall back to the plain rating
  const m = 50;
  const C = 4.0;
  return (v * R + m * C) / (v + m);
};

// Sort a single site's items by weighted rating (highest first). Items
// without a rating keep their original relative order at the end.
const sortByRating = (items, getRating, getCount) =>
  [...(items || [])].sort(
    (a, b) =>
      weightedScore(getRating(b), getCount(b)) -
      weightedScore(getRating(a), getCount(a))
  );

module.exports = {
  percentOff,
  toClothingCard,
  toSmartphoneCard,
  toGroceryCard,
  toMedicineCard,
  sortByRating,
};
