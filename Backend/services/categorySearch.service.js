// Used by the AI search: runs the right scraper set for a category and
// normalizes every site's card shape into ONE common product shape the
// LLM ranking step can work with.

const getmedicinepharmaDescription = require("../Categories/MedicineWebsites/PharmaeasyModule.js");
const getmedicineApollopharmaDescription = require("../Categories/MedicineWebsites/ApolloPharmaModule.js");
const getClothesMyntra = require("../Categories/ClothingWebsites/MyntraModule.js");
const getClothesSnapdeal = require("../Categories/ClothingWebsites/SnapdealModule.js");
const getGroceryFrugivoreDescription = require("../Categories/GroceryWebsites/FrugivoreModule.js");
const getelectronicdesc = require("../Categories/SmartPhonesWebsites/Gadget360Module.js");
const searchAmazon = require("../Categories/Common/AmazonScraper.js");
const searchFlipkart = require("../Categories/Common/FlipkartScraper.js");
const {
  toClothingCard,
  toGroceryCard,
  toMedicineCard,
} = require("./mappers.js");

// Normalizers: each category's card shape -> one common product shape
const normalizers = {
  smartphone: (p) => ({
    name: p.name, price: p.price, mrp: null, ratings: p.Ratings,
    specScore: p.SPEC_SCORE, quantity: null, image: p.image,
    link: p.fullURL, scrapFrom: p.scrapFrom,
  }),
  clothing: (p) => ({
    name: p.title, price: p.discountPrice, mrp: p.price, ratings: null,
    specScore: null, quantity: null, image: p.image,
    link: p.link, scrapFrom: p.scrapFrom,
  }),
  grocery: (p) => ({
    name: p.groceryName, price: p.groceryNewPrice, mrp: p.groceryMRP,
    ratings: null, specScore: null, quantity: p.groceryQnty,
    image: p.groceryIMG, link: p.groceryURL, scrapFrom: p.scrapFrom,
  }),
  medicine: (p) => ({
    name: p.medicineName, price: p.medicineNewPrice, mrp: p.medicineMRP,
    ratings: null, specScore: null, quantity: p.medicineQnty,
    image: p.medicineIMG, link: p.medicineURL, scrapFrom: p.scrapFrom,
  }),
};

// Scraper sets per category (same scrapers as the category endpoints)
const categoryScrapers = {
  smartphone: (term) => Promise.all([
    getelectronicdesc(`https://www.91mobiles.com/search_page.php?q=${term}`),
    searchAmazon(`${term} phone`),
    searchFlipkart(`${term} mobile`),
  ]).then(([m91, am, fk]) => [
    ...m91.map((p) => normalizers.smartphone(p)),
    ...am.map((p) => ({ ...normalizers.smartphone({ ...p, fullURL: p.link, Ratings: p.rating, SPEC_SCORE: null }), mrp: p.mrp })),
    ...fk.map((p) => ({ ...normalizers.smartphone({ ...p, fullURL: p.link, Ratings: p.rating, SPEC_SCORE: null }), mrp: p.mrp })),
  ]),
  clothing: (term) => Promise.all([
    getClothesMyntra(`https://www.myntra.com/${term}`),
    getClothesSnapdeal(`https://www.snapdeal.com/search?keyword=${term}`),
    searchAmazon(`${term} clothing`),
    searchFlipkart(`${term} clothing`),
  ]).then(([my, sd, am, fk]) => [
    ...(my || []).map(normalizers.clothing),
    ...(sd || []).map(normalizers.clothing),
    ...toClothingCard(am).map(normalizers.clothing),
    ...toClothingCard(fk).map(normalizers.clothing),
  ]),
  grocery: (term) => Promise.all([
    getGroceryFrugivoreDescription(`https://frugivore.in/search?qf=${term}`),
    searchAmazon(`${term} grocery`),
    searchFlipkart(`${term} grocery`),
  ]).then(([fr, am, fk]) => [
    ...(fr || []).map(normalizers.grocery),
    ...toGroceryCard(am).map(normalizers.grocery),
    ...toGroceryCard(fk).map(normalizers.grocery),
  ]),
  medicine: (term) => Promise.all([
    getmedicinepharmaDescription(`https://pharmeasy.in/search/all?name=${term}`),
    getmedicineApollopharmaDescription(`https://www.apollopharmacy.in/search-medicines/${term}`),
    searchAmazon(`${term} medicine`),
  ]).then(([ph, ap, am]) => [
    ...(ph || []).map(normalizers.medicine),
    ...(ap || []).map(normalizers.medicine),
    ...toMedicineCard(am).map(normalizers.medicine),
  ]),
};

module.exports = { categoryScrapers, normalizers };
