// server/express.test.js
/* global describe, test */

const request = require("supertest");
const mongoose = require("mongoose");

require("./server");

describe("Test 2 - express.test.js", () => {
  test("webserver is listening on port 8000", async () => {
    await request("http://localhost:8000")
      .get("/")
      .expect(200)
      .expect("Server is up");
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
