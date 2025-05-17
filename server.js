import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COUNTRIES = [
  "Norwegen",
  "Luxemburg",
  "Estland",
  "Israel",
  "Litauen",
  "Spanien",
  "Ukraine",
  "Großbritannien",
  "Österreich",
  "Island",
  "Lettland",
  "Niederlande",
  "Finnland",
  "Italien",
  "Polen",
  "Deutschland",
  "Griechenland",
  "Armenien",
  "Schweiz",
  "Malta",
  "Portugal",
  "Dänemark",
  "Schweden",
  "Frankreich",
  "San Marino",
  "Albanien",
];
const FLAGS = {
  Norwegen: "🇳🇴",
  Luxemburg: "🇱🇺",
  Estland: "🇪🇪",
  Israel: "🇮🇱",
  Litauen: "🇱🇹",
  Spanien: "🇪🇸",
  Ukraine: "🇺🇦",
  Großbritannien: "🇬🇧",
  Österreich: "🇦🇹",
  Island: "🇮🇸",
  Lettland: "🇱🇻",
  Niederlande: "🇳🇱",
  Finnland: "🇫🇮",
  Italien: "🇮🇹",
  Polen: "🇵🇱",
  Deutschland: "🇩🇪",
  Griechenland: "🇬🇷",
  Armenien: "🇦🇲",
  Schweiz: "🇨🇭",
  Malta: "🇲🇹",
  Portugal: "🇵🇹",
  Dänemark: "🇩🇰",
  Schweden: "🇸🇪",
  Frankreich: "🇫🇷",
  "San Marino": "🇸🇲",
  Albanien: "🇦🇱",
};

// ── DB ──────────────────────────────────────────────
const db = new Database("votes.db");
db.prepare(
  `CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  data TEXT NOT NULL
)`,
).run();

// ── Server-Setup ───────────────────────────────────────────
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ── Routes ─────────────────────────────────────────────────
app.get("/", (_, res) => res.render('index', { countries: COUNTRIES, flags: FLAGS }));

app.post("/vote", (req, res) => {
  const arr = JSON.parse(req.body.ranking || "[]"); // [{country, rank}, …]
  if (arr.length !== 26) {
    return res.status(400).render("index", {
      countries: COUNTRIES,
      error: "Bitte alle 26 Länder einsortieren!",
    });
  }
  // valid, unique?
  const nums = arr.map((o) => o.rank);
  if (new Set(nums).size !== 26 || nums.some((n) => n < 1 || n > 26)) {
    return res.status(400).render("index", {
      countries: COUNTRIES,
      error: "Rangliste enthält Fehler (doppelt oder außerhalb 1–26).",
    });
  }
  db.prepare("INSERT INTO votes (data) VALUES (?)").run(JSON.stringify(arr));
  res.render("thanks");
});

app.listen(3000, () => console.log("Server running on Port 3000"));
