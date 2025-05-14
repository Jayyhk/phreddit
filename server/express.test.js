// server/express.test.js
/* global describe, test, afterAll */

const request = require("supertest");
const mongoose = require("mongoose");

// Require your server entrypoint so it starts listening on PORT (8000)
require("./server"); // assuming this is at server/server.js

describe("Test 2 - express.test.js", () => {
  test("webserver is listening on port 8000", async () => {
    await request("http://localhost:8000")
      .get("/")
      .expect(200)
      .expect("Server is up");
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });
});
