// server.js
/* global process */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const session = require("express-session");
const MongoStore = require("connect-mongo");

const buildApiRouter = require("./api");

const app = express();
const PORT = 8000;

/* JWT settings */
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-local-key";
const TOKEN_AUD = "local";
const TOKEN_TTL = "24h";

/* Middleware */
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

/* Session store
  - Disabled when NODE_ENV === "test" so unit tests don’t spawn a second
    Mongo client.
  - Exported so tests can close the store’s client if it exists.            */
const sessionStore =
  process.env.NODE_ENV === "test"
    ? undefined
    : MongoStore.create({
        mongoUrl: "mongodb://127.0.0.1:27017/phreddit",
        collectionName: "sessions",
      });

app.use(
  session({
    secret: "throw-away-secret",
    store: sessionStore, // undefined ⇒ default MemoryStore in tests
    name: "phreddit.sid",
    saveUninitialized: false,
    resave: false,
    cookie: { maxAge: 86_400_000, sameSite: "lax" }, // 24 h
  })
);

/* ░ JWT verify ░ */
app.use((req, _res, next) => {
  const auth = req.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7).trim(), JWT_SECRET, {
        audience: TOKEN_AUD,
      });
      req.auth = {
        userID: payload.sub,
        displayName: payload.displayName,
        isAdmin: payload.isAdmin,
      };
    } catch (err) {
      console.error("JWT error:", err);
      req.auth = null;
    }
  }
  next();
});

/* Database */
mongoose
  .connect("mongodb://127.0.0.1:27017/phreddit", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

/* Routes */
app.use("/", buildApiRouter(JWT_SECRET, TOKEN_AUD, TOKEN_TTL));
app.get("/", (_req, res) => res.send("Server is up"));

/* Start & graceful shutdown */
const server = app.listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
);

process.on("SIGINT", () => {
  server.close(async () => {
    await mongoose.disconnect();
    if (sessionStore?.client?.close) await sessionStore.client.close();
    console.log("Server closed. Database disconnected.");
    process.exit(0);
  });
});

/*  Export BOTH:
    • server         → Supertest uses this in unit tests
    • sessionStore   → tests close its Mongo client to avoid open handles     */
module.exports = { server, sessionStore };
