// server/express.test.js
/* global describe, test, afterAll */

const request = require("supertest");
const mongoose = require("mongoose");
const server = require("../server");

describe("Test 2 - express.test.js", () => {
  test("webserver is listening on port 8000", async () => {
    await request(server).get("/").expect(200).expect("Server is up");
  });

  afterAll(async () => {
    await mongoose.disconnect();
    server.close();
  });
});
