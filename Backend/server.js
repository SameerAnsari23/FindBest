const express = require("express");
const cors = require("cors");

// Load .env BEFORE anything that reads process.env
require("dotenv").config({ path: require("find-config")(".env") });

const apiRoutes = require("./routes/api.routes.js");

const app = express();

// middlewares
app.use(
  cors({
    // Allow the deployed frontend plus any localhost port in development
    // (CRA falls back to 3001, 3002, ... when 3000 is already taken).
    origin: ["https://find-best-tau.vercel.app/", /^http:\/\/localhost:\d+$/],
    methods: ["POST", "GET"],
    credentials: true,
  })
);
app.use(express.json());

// routes
app.use("/api", apiRoutes);

const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
