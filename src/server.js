// server.js
const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// Read/write JSON file functions
const getYaps = () => {
  try {
    const data = fs.readFileSync("yaps.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    return { yaps: [] };
  }
};

const saveYap = (yap) => {
  const data = getYaps();
  data.yaps.push({
    ...yap,
    timestamp: new Date().toISOString(),
  });
  fs.writeFileSync("yaps.json", JSON.stringify(data, null, 2));
};

// Routes
app.get("/api/yaps", (req, res) => {
  res.json(getYaps());
});

app.post("/api/yaps", (req, res) => {
  saveYap(req.body);
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
