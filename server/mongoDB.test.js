// server/mongoDB.test.js
/* global process, describe, test, beforeAll, afterAll, expect */

const mongoose = require("mongoose");
const request = require("supertest");
const express = require("express");

const apiRouter = require("./api");
const Post = require("./models/posts");
const Comment = require("./models/comments");

const app = express();
app.use(express.json());
app.use("/", apiRouter);

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/phreddit";

beforeAll(async () => {
  await mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe("Test 1 - Deleting a post cascades to its comments", () => {
  test("DELETE /posts/:id removes post and all nested comments", async () => {
    // Build a three-level comment tree: root → reply → grandchild
    const root = await Comment.create({
      content: "Root comment",
      commentedBy: "Alice",
    });
    const reply = await Comment.create({
      content: "Reply to root",
      commentedBy: "Bob",
    });
    const grandchild = await Comment.create({
      content: "Reply to reply",
      commentedBy: "Carol",
    });

    root.commentIDs = [reply._id];
    await root.save();
    reply.commentIDs = [grandchild._id];
    await reply.save();

    // Create a post pointing at the root comment
    const post = await Post.create({
      title: "Test Post",
      content: "Some content",
      postedBy: "Alice",
      commentIDs: [root._id],
    });

    // Delete the post
    await request(app).delete(`/posts/${post._id}`).expect(200);

    // Verify the post is gone
    const foundPost = await Post.findById(post._id);
    expect(foundPost).toBeNull();

    // Verify all comments have been removed
    const comments = await Promise.all([
      Comment.findById(root._id),
      Comment.findById(reply._id),
      Comment.findById(grandchild._id),
    ]);
    comments.forEach((c) => expect(c).toBeNull());
  });
});
