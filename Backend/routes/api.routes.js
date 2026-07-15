const express = require("express");
const router = express.Router();

const { searchMedicine } = require("../controllers/medicine.controller.js");
const { searchClothing } = require("../controllers/clothing.controller.js");
const { searchGrocery } = require("../controllers/grocery.controller.js");
const { searchSmartphone } = require("../controllers/smartphone.controller.js");
const { aiSearch } = require("../controllers/aiSearch.controller.js");

// Category searches (scrapers run in parallel per category)
router.get("/medicine/:name", searchMedicine);
router.get("/clothing/:name", searchClothing);
router.get("/grocery/:name", searchGrocery);
router.get("/smartphone/:name", searchSmartphone);

// AI search: plain-language query -> parse -> scrape -> rank -> review sentiment
router.post("/ai-search", aiSearch);

module.exports = router;
