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
    if (await User.exists({ email })) {
      return res
        .status(400)
        .json({ field: "email", error: "Email already taken." });
    }
    if (await User.exists({ displayName })) {
      return res
        .status(400)
        .json({ field: "displayName", error: "Display name already taken." });
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

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name: name.trim() });
    if (existingCommunity) {
      return res.status(400).json({ error: "Community name already taken" });
    }

    // Get user's display name
    const user = await User.findById(req.session.userID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const newCommunity = new Community({
      name: name.trim(),
      description: description.trim(),
      creator: user.displayName,
      members: [user.displayName], // Creator is automatically a member
    });

    const savedCommunity = await newCommunity.save();
    res.status(201).json(savedCommunity);
  } catch (err) {
    console.error("Error creating community:", err);
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

// upvotePost(postID, username)
router.post("/posts/:id/upvote", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Get user's reputation
    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enough reputation
    if (user.reputation < 50) {
      return res.status(403).json({ error: "Insufficient reputation to vote" });
    }

    // Check if user has already upvoted
    if (post.upvoters.includes(username)) {
      // Remove upvote
      post.upvoters = post.upvoters.filter((voter) => voter !== username);
      // Decrease poster's reputation
      const poster = await User.findOne({ displayName: post.postedBy });
      if (poster) {
        poster.reputation -= 5;
        await poster.save();
      }
    } else {
      // Remove from downvoters if they downvoted
      if (post.downvoters.includes(username)) {
        post.downvoters = post.downvoters.filter((voter) => voter !== username);
        // Increase poster's reputation (undo downvote penalty)
        const poster = await User.findOne({ displayName: post.postedBy });
        if (poster) {
          poster.reputation += 10;
          await poster.save();
        }
      }
      // Add upvote
      post.upvoters.push(username);
      // Increase poster's reputation
      const poster = await User.findOne({ displayName: post.postedBy });
      if (poster) {
        poster.reputation += 5;
        await poster.save();
      }
    }

    const savedPost = await post.save();
    res.json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// downvotePost(postID, username)
router.post("/posts/:id/downvote", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Get user's reputation
    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enough reputation
    if (user.reputation < 50) {
      return res.status(403).json({ error: "Insufficient reputation to vote" });
    }

    // Check if user has already downvoted
    if (post.downvoters.includes(username)) {
      // Remove downvote
      post.downvoters = post.downvoters.filter((voter) => voter !== username);
      // Increase poster's reputation (undo downvote penalty)
      const poster = await User.findOne({ displayName: post.postedBy });
      if (poster) {
        poster.reputation += 10;
        await poster.save();
      }
    } else {
      // Remove from upvoters if they upvoted
      if (post.upvoters.includes(username)) {
        post.upvoters = post.upvoters.filter((voter) => voter !== username);
        // Decrease poster's reputation (undo upvote bonus)
        const poster = await User.findOne({ displayName: post.postedBy });
        if (poster) {
          poster.reputation -= 5;
          await poster.save();
        }
      }
      // Add downvote
      post.downvoters.push(username);
      // Decrease poster's reputation
      const poster = await User.findOne({ displayName: post.postedBy });
      if (poster) {
        poster.reputation -= 10;
        await poster.save();
      }
    }

    const savedPost = await post.save();
    res.json(savedPost);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// upvoteComment(commentID, username)
router.post("/comments/:id/upvote", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Get user's reputation
    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enough reputation
    if (user.reputation < 50) {
      return res.status(403).json({ error: "Insufficient reputation to vote" });
    }

    // Check if user has already upvoted
    if (comment.upvoters.includes(username)) {
      // Remove upvote
      comment.upvoters = comment.upvoters.filter((voter) => voter !== username);
      // Decrease commenter's reputation
      const commenter = await User.findOne({
        displayName: comment.commentedBy,
      });
      if (commenter) {
        commenter.reputation -= 5;
        await commenter.save();
      }
    } else {
      // Remove from downvoters if they downvoted
      if (comment.downvoters.includes(username)) {
        comment.downvoters = comment.downvoters.filter(
          (voter) => voter !== username
        );
        // Increase commenter's reputation (undo downvote penalty)
        const commenter = await User.findOne({
          displayName: comment.commentedBy,
        });
        if (commenter) {
          commenter.reputation += 10;
          await commenter.save();
        }
      }
      // Add upvote
      comment.upvoters.push(username);
      // Increase commenter's reputation
      const commenter = await User.findOne({
        displayName: comment.commentedBy,
      });
      if (commenter) {
        commenter.reputation += 5;
        await commenter.save();
      }
    }

    const savedComment = await comment.save();
    res.json(savedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// downvoteComment(commentID, username)
router.post("/comments/:id/downvote", async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Get user's reputation
    const user = await User.findOne({ displayName: username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enough reputation
    if (user.reputation < 50) {
      return res.status(403).json({ error: "Insufficient reputation to vote" });
    }

    // Check if user has already downvoted
    if (comment.downvoters.includes(username)) {
      // Remove downvote
      comment.downvoters = comment.downvoters.filter(
        (voter) => voter !== username
      );
      // Increase commenter's reputation (undo downvote penalty)
      const commenter = await User.findOne({
        displayName: comment.commentedBy,
      });
      if (commenter) {
        commenter.reputation += 10;
        await commenter.save();
      }
    } else {
      // Remove from upvoters if they upvoted
      if (comment.upvoters.includes(username)) {
        comment.upvoters = comment.upvoters.filter(
          (voter) => voter !== username
        );
        // Decrease commenter's reputation (undo upvote bonus)
        const commenter = await User.findOne({
          displayName: comment.commentedBy,
        });
        if (commenter) {
          commenter.reputation -= 5;
          await commenter.save();
        }
      }
      // Add downvote
      comment.downvoters.push(username);
      // Decrease commenter's reputation
      const commenter = await User.findOne({
        displayName: comment.commentedBy,
      });
      if (commenter) {
        commenter.reputation -= 10;
        await commenter.save();
      }
    }

    const savedComment = await comment.save();
    res.json(savedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile data
router.get("/users/:username", async (req, res) => {
  try {
    if (!req.session.userID) {
      console.log("No session userID found");
      return res
        .status(401)
        .json({ error: "Must be logged in to view profile" });
    }

    // First find the user by session ID to ensure they're logged in
    const sessionUser = await User.findById(req.session.userID);
    if (!sessionUser) {
      console.log("Session user not found");
      return res.status(401).json({ error: "User session invalid" });
    }

    // Then find the requested user profile
    const user = await User.findOne({ displayName: req.params.username });

    if (!user) {
      console.log("Requested user not found");
      return res.status(404).json({ error: "User not found" });
    }

    // Allow users to view their own profile or admins to view any profile
    if (user._id.toString() !== req.session.userID && !sessionUser.isAdmin) {
      console.log("User trying to view another user's profile");
      return res
        .status(403)
        .json({ error: "Cannot view other users' profiles" });
    }

    res.json({
      displayName: user.displayName,
      email: user.email,
      createdAt: user.createdAt,
      reputation: user.reputation,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's communities
router.get("/users/:username/communities", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to view profile" });
    }

    const sessionUser = await User.findById(req.session.userID);
    if (!sessionUser) {
      return res.status(401).json({ error: "User session invalid" });
    }

    const user = await User.findOne({ displayName: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Allow users to view their own communities or admins to view any user's communities
    if (user._id.toString() !== req.session.userID && !sessionUser.isAdmin) {
      return res
        .status(403)
        .json({ error: "Cannot view other users' communities" });
    }

    const communities = await Community.find({ creator: user.displayName });
    res.json(communities);
  } catch (err) {
    console.error("Error fetching user communities:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's posts
router.get("/users/:username/posts", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to view profile" });
    }

    const sessionUser = await User.findById(req.session.userID);
    if (!sessionUser) {
      return res.status(401).json({ error: "User session invalid" });
    }

    const user = await User.findOne({ displayName: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Allow users to view their own posts or admins to view any user's posts
    if (user._id.toString() !== req.session.userID && !sessionUser.isAdmin) {
      return res.status(403).json({ error: "Cannot view other users' posts" });
    }

    const posts = await Post.find({ postedBy: user.displayName });
    res.json(posts);
  } catch (err) {
    console.error("Error fetching user posts:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get user's comments
router.get("/users/:username/comments", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to view profile" });
    }

    const sessionUser = await User.findById(req.session.userID);
    if (!sessionUser) {
      return res.status(401).json({ error: "User session invalid" });
    }

    const user = await User.findOne({ displayName: req.params.username });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Allow users to view their own comments or admins to view any user's comments
    if (user._id.toString() !== req.session.userID && !sessionUser.isAdmin) {
      return res
        .status(403)
        .json({ error: "Cannot view other users' comments" });
    }

    const comments = await Comment.find({ commentedBy: user.displayName });

    // Get post titles for each comment
    const commentsWithPostTitles = await Promise.all(
      comments.map(async (comment) => {
        // Find the post that contains this comment
        const posts = await Post.find();
        let postTitle = "Unknown Post";

        for (const post of posts) {
          async function findComment(commentIds) {
            for (const cid of commentIds) {
              if (cid.toString() === comment._id.toString()) {
                return true;
              }
              const childComment = await Comment.findById(cid);
              if (childComment && childComment.commentIDs.length > 0) {
                if (await findComment(childComment.commentIDs)) {
                  return true;
                }
              }
            }
            return false;
          }

          if (await findComment(post.commentIDs)) {
            postTitle = post.title;
            break;
          }
        }

        return {
          ...comment.toObject(),
          postTitle,
        };
      })
    );

    res.json(commentsWithPostTitles);
  } catch (err) {
    console.error("Error fetching user comments:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a post and all its comments recursively
router.delete("/posts/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Helper to recursively delete comments
    async function deleteComments(commentIds) {
      for (const cid of commentIds) {
        const comment = await Comment.findById(cid);
        if (comment) {
          await deleteComments(comment.commentIDs);
          await Comment.findByIdAndDelete(cid);
        }
      }
    }

    // Delete all comments for this post
    await deleteComments(post.commentIDs);

    // Remove post from its community's postIDs
    await Community.updateMany(
      { postIDs: post._id },
      { $pull: { postIDs: post._id } }
    );

    // Delete the post
    await Post.findByIdAndDelete(post._id);

    res.json({ message: "Post and all associated comments deleted." });
  } catch (err) {
    console.error("Error deleting post:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a community and all its posts and comments
router.delete("/communities/:id", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to delete a community" });
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

    // Allow both the creator and admin users to delete the community
    if (community.creator !== user.displayName && !user.isAdmin) {
      return res.status(403).json({
        error: "Only the community creator or an admin can delete it",
      });
    }

    // Helper to recursively delete comments
    async function deleteComments(commentIds) {
      for (const cid of commentIds) {
        const comment = await Comment.findById(cid);
        if (comment) {
          await deleteComments(comment.commentIDs);
          await Comment.findByIdAndDelete(cid);
        }
      }
    }

    // Delete all posts and their comments
    for (const postId of community.postIDs) {
      const post = await Post.findById(postId);
      if (post) {
        await deleteComments(post.commentIDs);
        await Post.findByIdAndDelete(postId);
      }
    }

    // Delete the community
    await Community.findByIdAndDelete(community._id);

    res.json({
      message:
        "Community and all associated posts and comments deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting community:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a comment and all its replies recursively
router.delete("/comments/:id", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res
        .status(401)
        .json({ error: "Must be logged in to delete a comment" });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Get user's display name
    const user = await User.findById(req.session.userID);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // Allow both the comment author and admin users to delete the comment
    if (comment.commentedBy !== user.displayName && !user.isAdmin) {
      return res
        .status(403)
        .json({ error: "Only the comment author or an admin can delete it" });
    }

    // Helper to recursively delete replies
    async function deleteReplies(commentIds) {
      for (const cid of commentIds) {
        const reply = await Comment.findById(cid);
        if (reply) {
          await deleteReplies(reply.commentIDs);
          await Comment.findByIdAndDelete(cid);
        }
      }
    }

    // Delete all replies first
    await deleteReplies(comment.commentIDs);

    // Remove comment from its parent (either post or another comment)
    const posts = await Post.find();
    for (const post of posts) {
      if (post.commentIDs.includes(comment._id)) {
        post.commentIDs = post.commentIDs.filter(
          (id) => id.toString() !== comment._id.toString()
        );
        await post.save();
        break;
      }
    }

    // Check if it's a reply to another comment
    const allComments = await Comment.find();
    for (const parentComment of allComments) {
      if (parentComment.commentIDs.includes(comment._id)) {
        parentComment.commentIDs = parentComment.commentIDs.filter(
          (id) => id.toString() !== comment._id.toString()
        );
        await parentComment.save();
        break;
      }
    }

    // Finally delete the comment itself
    await Comment.findByIdAndDelete(comment._id);

    res.json({ message: "Comment and all replies deleted successfully" });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all users (admin only)
router.get("/users", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res.status(401).json({ error: "Must be logged in" });
    }

    const user = await User.findById(req.session.userID);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Find all non-admin users, excluding password hash
    const users = await User.find({ isAdmin: false }, { passwordHash: 0 });
    res.json(users);
  } catch (err) {
    console.error("Failed to fetch users:", err);
    res.status(500).json({ error: err.message });
  }
});

// Delete user (admin only)
router.delete("/users/:id", async (req, res) => {
  try {
    if (!req.session.userID) {
      return res.status(401).json({ error: "Must be logged in" });
    }

    // Check if requester is admin
    const adminUser = await User.findById(req.session.userID);
    if (!adminUser || !adminUser.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    // Find user to delete
    const userToDelete = await User.findById(req.params.id);
    if (!userToDelete) {
      return res.status(404).json({ error: "User not found" });
    }

    // Don't allow deleting admin users
    if (userToDelete.isAdmin) {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    // 1. Remove user from all communities they've joined
    const joinedCommunities = await Community.find({
      members: userToDelete.displayName,
    });
    for (const community of joinedCommunities) {
      community.members = community.members.filter(
        (member) => member !== userToDelete.displayName
      );
      await community.save();
    }

    // 2. Delete all communities created by the user
    const userCommunities = await Community.find({
      creator: userToDelete.displayName,
    });
    for (const community of userCommunities) {
      // Use existing community deletion endpoint logic
      const communityId = community._id;

      // Helper to recursively delete comments (reused from community deletion)
      async function deleteComments(commentIds) {
        for (const cid of commentIds) {
          const comment = await Comment.findById(cid);
          if (comment) {
            await deleteComments(comment.commentIDs);
            await Comment.findByIdAndDelete(cid);
          }
        }
      }

      // Delete all posts and their comments
      for (const postId of community.postIDs) {
        const post = await Post.findById(postId);
        if (post) {
          await deleteComments(post.commentIDs);
          await Post.findByIdAndDelete(postId);
        }
      }

      // Delete the community
      await Community.findByIdAndDelete(communityId);
    }

    // 3. Delete any remaining posts by the user (in case they were in other communities)
    const remainingPosts = await Post.find({
      postedBy: userToDelete.displayName,
    });
    for (const post of remainingPosts) {
      // Use existing post deletion endpoint logic
      const postId = post._id;

      // Helper to recursively delete comments (reused from post deletion)
      async function deleteComments(commentIds) {
        for (const cid of commentIds) {
          const comment = await Comment.findById(cid);
          if (comment) {
            await deleteComments(comment.commentIDs);
            await Comment.findByIdAndDelete(cid);
          }
        }
      }

      // Delete all comments for this post
      await deleteComments(post.commentIDs);

      // Remove post from its community's postIDs
      await Community.updateMany(
        { postIDs: postId },
        { $pull: { postIDs: postId } }
      );

      // Delete the post
      await Post.findByIdAndDelete(postId);
    }

    // 4. Delete any remaining comments by the user
    const userComments = await Comment.find({
      commentedBy: userToDelete.displayName,
    });
    for (const comment of userComments) {
      // Use existing comment deletion endpoint logic
      const commentId = comment._id;

      // Helper to recursively delete replies (reused from comment deletion)
      async function deleteReplies(commentIds) {
        for (const cid of commentIds) {
          const reply = await Comment.findById(cid);
          if (reply) {
            await deleteReplies(reply.commentIDs);
            await Comment.findByIdAndDelete(cid);
          }
        }
      }

      // Delete all replies first
      await deleteReplies(comment.commentIDs);

      // Remove comment from its parent (either post or another comment)
      const posts = await Post.find();
      for (const post of posts) {
        if (post.commentIDs.includes(commentId)) {
          post.commentIDs = post.commentIDs.filter(
            (id) => id.toString() !== commentId.toString()
          );
          await post.save();
          break;
        }
      }

      // Check if it's a reply to another comment
      const allComments = await Comment.find();
      for (const parentComment of allComments) {
        if (parentComment.commentIDs.includes(commentId)) {
          parentComment.commentIDs = parentComment.commentIDs.filter(
            (id) => id.toString() !== commentId.toString()
          );
          await parentComment.save();
          break;
        }
      }

      // Finally delete the comment itself
      await Comment.findByIdAndDelete(commentId);
    }

    // 5. Finally delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User and all associated data deleted successfully" });
  } catch (err) {
    console.error("Failed to delete user:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
