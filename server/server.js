// server.js  – JWT (token-based) auth, LOCAL-ONLY variant
/* global process */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const buildApiRouter = require("./api");

const app = express();
const PORT = 8000;

/* ────────────────────────────
   1.  Auth settings (LOCAL) */
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-local-key"; // hard-coded for dev only
const TOKEN_AUD = process.env.TOKEN_AUD || "local"; // audience claim
const TOKEN_TTL = process.env.TOKEN_TTL || "24h"; // expiration

/* ────────────────────────────
   2.  General middleware     */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // allow front-end to send the Authorization header
  })
);
app.use(express.json());

/* ────────────────────────────
   3.  JWT verify middleware  */
app.use((req, _res, next) => {
  const auth = req.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) {
    const token = auth.slice(7).trim();
    try {
      const payload = jwt.verify(token, JWT_SECRET, { audience: TOKEN_AUD });
      req.auth = {
        userID: payload.sub,
        displayName: payload.displayName,
        isAdmin: payload.isAdmin,
      };
    } catch (err) {
      console.error("JWT verify failed:", err.message);
      // treat as unauthenticated
    }
  }
  next();
});

/* ────────────────────────────
   4.  Database               */
mongoose
  .connect("mongodb://127.0.0.1:27017/phreddit", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* ────────────────────────────
   5.  Routes                 */
const apiRouter = buildApiRouter(JWT_SECRET, TOKEN_AUD, TOKEN_TTL);
app.use("/", apiRouter);

app.get("/", (_req, res) => res.send("Server is up"));

/* ────────────────────────────
   6.  Start / shutdown       */
const server = app.listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
);
module.exports = server;

process.on("SIGINT", () => {
  server.close(async () => {
    await mongoose.disconnect();
    console.log("Server closed. Database disconnected.");
    process.exit(0);
  });
});
