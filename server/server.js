// server.js
/* global process */

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const apiRouter = require("./api");

const app = express();
const PORT = 8000;

// --- Middleware ---
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true, // allow cookies to be sent
  })
);
app.use(express.json());

app.use(
  session({
    name: "phreddit.sid",
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      secure: false,
    },
  })
);

// --- Database Connection ---
mongoose
  .connect("mongodb://127.0.0.1:27017/phreddit", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB error:", err));

// --- Routes ---
app.use("/", apiRouter);

// --- Health Check & Start ---
app.get("/", (req, res) => res.send("Server is up"));
const server = app.listen(PORT, () =>
  console.log(`Listening on http://localhost:${PORT}`)
);

module.exports = server;

// --- Graceful Shutdown ---
process.on("SIGINT", () => {
  server.close(async () => {
    await mongoose.disconnect();
    console.log("Server closed. Database instance disconnected.");
    process.exit(0);
  });
});
