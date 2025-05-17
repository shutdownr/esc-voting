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

db.prepare(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts DATETIME DEFAULT CURRENT_TIMESTAMP,
      voter TEXT    NOT NULL
    )
  `).run();

  
db.prepare(`
    CREATE TABLE IF NOT EXISTS vote_lines (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      submission_id INTEGER NOT NULL,
      country       TEXT    NOT NULL,
      rank          INTEGER NOT NULL,
      FOREIGN KEY (submission_id) REFERENCES submissions(id)
    )
  `).run();

/* prepared statement for speed */
const insertSubmission = db.prepare('INSERT INTO submissions (voter) VALUES (?)');
const insertLine       = db.prepare('INSERT INTO vote_lines (submission_id,country,rank) VALUES (?,?,?)');


// ── Server-Setup ───────────────────────────────────────────
const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ── Routes ─────────────────────────────────────────────────
app.get("/", (_, res) => res.render('index', { countries: COUNTRIES, flags: FLAGS }));


app.post('/vote', (req, res) => {
    const voter = (req.body.voter || '').trim();

    if (!voter) {
    return res.status(400).render('index', {
        countries: COUNTRIES, flags: FLAGS,
        error: 'Bitte deinen Namen eingeben!'
    });
    }
    const arr = JSON.parse(req.body.ranking || '[]');   // [{country,rank}, …]
  
    /* --- Validation -------------------------------------------------- */
    if (arr.length !== 26) {
      return res.status(400).render('index', {
        countries: COUNTRIES, flags: FLAGS,
        error: 'Bitte alle 26 Länder einsortieren!'
      });
    }
    const ranks = arr.map(o => o.rank);
    if (new Set(ranks).size !== 26 || ranks.some(n => n < 1 || n > 26)) {
      return res.status(400).render('index', {
        countries: COUNTRIES, flags: FLAGS,
        error: 'Rangliste enthält Fehler (doppelt oder außerhalb 1–26).'
      });
    }
  
    /* --- Write to DB inside a transaction ---------------------------- */
    const tx = db.transaction(() => {
      /* b) new normalised tables */
      const { lastInsertRowid: submissionId } = insertSubmission.run(voter);
      for (const { country, rank } of arr) {
        insertLine.run(submissionId, country, rank);
      }
    });
    tx();                       // commit
  
    res.render('thanks', {voter});
  });
  

app.listen(3000, () => console.log("Server running on Port 3000"));
