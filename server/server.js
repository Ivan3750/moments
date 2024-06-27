const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path")
const routes = require("./routes");
const api = require("./api");

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../src")));

// Use routes
app.use("/", routes);
app.use("/API/", api);

// Handle unsupported methods
app.all("*", (req, res) => {
  res.status(405).json({ message: "Method Not Alloweds" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
