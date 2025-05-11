const express = require("express");
const router = express.Router();

const Community = require("./models/communities");
const Post = require("./models/posts");
const Comment = require("./models/comments");
const LinkFlair = require("./models/linkflairs");
const User = require("./models/user");
const bcrypt = require("bcrypt");

// Use-Case #1: Create Account
router.post("/users", async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      displayName,
      password,
      confirmPassword,
    } = req.body;

    // 1. All fields required
    if (
      !firstName ||
      !lastName ||
      !email ||
      !displayName ||
      !password ||
      !confirmPassword
    ) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // 2. Passwords must match
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match." });
    }

    // 3. Check for existing email or displayName
    if (await User.exists({ $or: [{ email }, { displayName }] })) {
      return res
        .status(400)
        .json({ error: "Email or display name already taken." });
    }

    // 4. Password must not contain personal info
    const forbidden = [firstName, lastName, displayName, email.toLowerCase()];
    if (
      forbidden.some((str) =>
        password.toLowerCase().includes(str.toLowerCase())
      )
    ) {
      return res
        .status(400)
        .json({ error: "Password may not contain personal information." });
    }

    // 5. Hash & save
    const passwordHash = await bcrypt.hash(password, 10);
    const user = new User({
      firstName,
      lastName,
      email,
      displayName,
      passwordHash,
    });
    await user.save();

    res.status(201).json({ message: "Account created successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

// Use-Case #2: Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }
    // Normalize email to lowercase if your schema uses lowercase
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password." });
    }
    req.session.userID = user._id;
    return res.json({ message: "Login successful." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error." });
  }
});

// Use-Case #2 and #3: Who am I?
router.get("/me", async (req, res) => {
  if (!req.session.userID) {
    return res.json({ user: null });
  }
  const user = await User.findById(req.session.userID).select(
    "-passwordHash -__v"
  );
  res.json({ user });
});

// Use-Case #3: Logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ error: "Logout failed." });
    }
    // Clear the session cookie on the client
    res
      .clearCookie("phreddit.sid")
      .json({ message: "Logged out successfully." });
  });
});

// getCommunities()
router.get("/communities", async (req, res) => {
  try {
    const communities = await Community.find();

    if (req.session.userID) {
      // Get user's display name
      const user = await User.findById(req.session.userID);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Add isMember flag for logged-in users using display name
      const communitiesWithMembership = communities.map((community) => {
        const communityObj = community.toObject();
        const isMember =
          Array.isArray(communityObj.members) &&
          communityObj.members.includes(user.displayName);
        return {
          ...communityObj,
          isMember,
        };
      });

      res.json(communitiesWithMembership);
    } else {
      res.json(communities);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getCommunity(communityID)
router.get("/communities/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    res.json(community);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getPosts()
router.get("/posts", async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getPost(postID)
router.get("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getLinkFlairs()
router.get("/linkflairs", async (req, res) => {
  try {
    const linkFlairs = await LinkFlair.find();
    res.json(linkFlairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getLinkFlair(linkFlairID)
router.get("/linkflairs/:id", async (req, res) => {
  try {
    const linkFlair = await LinkFlair.findById(req.params.id);
    if (!linkFlair) {
      return res.status(404).json({ error: "LinkFlair not found" });
    }
    res.json(linkFlair);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getComments()
router.get("/comments", async (req, res) => {
  try {
    const comments = await Comment.find();
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getComment(commentID)
router.get("/comments/:id", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addCommunity(community)
router.post("/communities", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to create a community" });
    }

    const { name, description } = req.body;
    if (!name || !description) {
      return res
        .status(400)
        .json({ error: "Name and description are required" });
    }

    // Get user's display name
    const user = await User.findById(req.session.userID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const newCommunity = new Community({
      name,
      description,
      creator: user.displayName,
      members: [user.displayName], // Creator is automatically a member
    });

    const savedCommunity = await newCommunity.save();
    res.status(201).json(savedCommunity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addPost(post)
router.post("/posts", async (req, res) => {
  try {
    const newPost = new Post(req.body);
    const savedPost = await newPost.save();
    res.json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addLinkFlair(linkFlair)
router.post("/linkflairs", async (req, res) => {
  try {
    const newLinkFlair = new LinkFlair(req.body);
    const savedLinkFlair = await newLinkFlair.save();
    res.json(savedLinkFlair);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addComment(comment)
router.post("/comments", async (req, res) => {
  try {
    const newComment = new Comment(req.body);
    const savedComment = await newComment.save();
    res.json(savedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// updateCommunity(communityID, newData)
router.put("/communities/:id", async (req, res) => {
  try {
    const updatedCommunity = await Community.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedCommunity) {
      return res.status(404).json({ error: "Community not found" });
    }
    res.json(updatedCommunity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// updatePost(postID, newData)
router.put("/posts/:id", async (req, res) => {
  try {
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedPost) {
      return res.status(404).json({ error: "Post not found" });
    }
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// updateComment(commentID, newData)
router.put("/comments/:id", async (req, res) => {
  try {
    const updatedComment = await Comment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedComment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    res.json(updatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getCommunityPosts(communityID)
router.get("/communities/:id/posts", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    const posts = await Post.find({ _id: { $in: community.postIDs } });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getSearchPosts(query)
router.get("/search", async (req, res) => {
  try {
    const query = req.query.query;
    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    const terms = query.trim().split(/\s+/);
    const lowerTerms = terms.map((term) => term.toLowerCase());

    const allPosts = await Post.find();
    const results = [];

    async function getAllComments(commentIds) {
      let results = [];
      for (const cid of commentIds) {
        const comment = await Comment.findById(cid);
        if (comment) {
          results.push(comment);
          const children = await getAllComments(comment.commentIDs);
          results = results.concat(children);
        }
      }
      return results;
    }

    for (const post of allPosts) {
      const titleLower = post.title.toLowerCase();
      const contentLower = post.content.toLowerCase();
      const inPost = lowerTerms.some(
        (term) => titleLower.includes(term) || contentLower.includes(term)
      );
      const postComments = await getAllComments(post.commentIDs);
      const inComments = postComments.some((comment) =>
        lowerTerms.some((term) => comment.content.toLowerCase().includes(term))
      );
      if (inPost || inComments) {
        results.push(post);
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getPostCommentsFromPostID(postID)
router.get("/posts/:id/comments/all", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    async function getAllComments(commentIds) {
      let results = [];
      for (const cid of commentIds) {
        const comment = await Comment.findById(cid);
        if (comment) {
          results.push(comment);
          const children = await getAllComments(comment.commentIDs);
          results = results.concat(children);
        }
      }
      return results;
    }
    const allComments = await getAllComments(post.commentIDs);
    res.json(allComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getTopCommentsFromPostID(postID)
router.get("/posts/:id/comments/top", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const topComments = await Comment.find({ _id: { $in: post.commentIDs } });
    res.json(topComments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getPostIDFromCommentID(commentID)
router.get("/comments/:id/post", async (req, res) => {
  try {
    const commentId = req.params.id;
    const posts = await Post.find();
    async function commentExists(commentIds) {
      for (const cid of commentIds) {
        if (cid.toString() === commentId) return true;
        const comment = await Comment.findById(cid);
        if (comment && comment.commentIDs && comment.commentIDs.length > 0) {
          if (await commentExists(comment.commentIDs)) return true;
        }
      }
      return false;
    }
    for (const post of posts) {
      if (await commentExists(post.commentIDs)) {
        return res.json({ postID: post._id });
      }
    }
    res.status(404).json({ error: "No post found for the given comment" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getCommentCountForPost(postID)
router.get("/posts/:id/comments/count", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    async function countComments(commentIds) {
      let count = 0;
      for (const cid of commentIds) {
        const comment = await Comment.findById(cid);
        if (comment) {
          count += 1;
          count += await countComments(comment.commentIDs);
        }
      }
      return count;
    }
    const totalCount = await countComments(post.commentIDs);
    res.json({ count: totalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getLinkFlairContent(linkFlairID)
router.get("/linkflairs/:id/content", async (req, res) => {
  try {
    const linkFlair = await LinkFlair.findById(req.params.id);
    if (!linkFlair) {
      return res.status(404).json({ error: "LinkFlair not found" });
    }
    res.json({ content: linkFlair.content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// getLatestHomeCommentDate(post)
router.get("/posts/:id/latest-comment-date", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    async function getLatest(commentIds) {
      let latest = new Date(0);
      for (const cid of commentIds) {
        const comment = await Comment.findById(cid);
        if (comment) {
          if (comment.commentedDate > latest) {
            latest = comment.commentedDate;
          }
          const childLatest = await getLatest(comment.commentIDs);
          if (childLatest > latest) {
            latest = childLatest;
          }
        }
      }
      return latest;
    }
    const latestDate = await getLatest(post.commentIDs);
    res.json({ latestCommentDate: latestDate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addPostToCommunity(communityID, postID)
router.post("/communities/:id/add-post", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }
    const { postID } = req.body;
    community.postIDs.unshift(postID);
    const savedCommunity = await community.save();
    res.json(savedCommunity);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addCommentToPost(postID, commentID)
router.post("/posts/:id/add-comment", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    const { commentID } = req.body;
    post.commentIDs.unshift(commentID);
    const savedPost = await post.save();
    res.json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// addReplyToComment(parentCommentID, replyCommentID)
router.post("/comments/:id/add-reply", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }
    const { replyCommentID } = req.body;
    comment.commentIDs.unshift(replyCommentID);
    const savedComment = await comment.save();
    res.json(savedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join a community
router.post("/communities/:id/join", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to join a community" });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Get user's display name
    const user = await User.findById(req.session.userID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (community.members.includes(user.displayName)) {
      return res
        .status(400)
        .json({ error: "Already a member of this community" });
    }

    community.members.push(user.displayName);
    await community.save();
    res.json({ message: "Successfully joined community" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Leave a community
router.post("/communities/:id/leave", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to leave a community" });
    }

    const community = await Community.findById(req.params.id);
    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    // Get user's display name
    const user = await User.findById(req.session.userID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    if (community.creator === user.displayName) {
      return res
        .status(400)
        .json({ error: "Creator cannot leave their community" });
    }

    if (!community.members.includes(user.displayName)) {
      return res.status(400).json({ error: "Not a member of this community" });
    }

    community.members = community.members.filter(
      (name) => name !== user.displayName
    );
    await community.save();
    res.json({ message: "Successfully left community" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user's communities
router.get("/users/communities", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to view your communities" });
    }

    // Get user's display name
    const user = await User.findById(req.session.userID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const communities = await Community.find({
      members: user.displayName,
    });

    res.json(communities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
