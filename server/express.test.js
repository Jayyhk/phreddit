// express.test.js
/* global describe, test, afterAll */

const request = require("supertest");
const mongoose = require("mongoose");
const { server, sessionStore } = require("../server"); // ← destructure

describe("Test 2 - Listening Server", () => {
  test("GET / responds", async () => {
    await request(server).get("/").expect(200).expect("Server is up");
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await mongoose.disconnect();
    if (sessionStore?.client?.close) {
      await sessionStore.client.close();
    }
  });
});
