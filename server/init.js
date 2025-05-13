// The initial data must contain the user profile for admin. The
// email address, display name, and password for an admin user must be
// provided as the command-line arguments to server/init.js. You must
// use these credentials to create a user profile for admin in the
// database
// TODO: Create a user profile for admin in the database

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const CommunityModel = require("./models/communities");
const PostModel = require("./models/posts");
const CommentModel = require("./models/comments");
const LinkFlairModel = require("./models/linkflairs");
const UserModel = require("./models/user");

let userArgs = process.argv.slice(2);

if (process.argv.length !== 5) {
  console.error(
    "Usage: node init.js <admin_email> <admin_display_name> <admin_password>"
  );
  process.exit(1);
}

const [adminEmail, adminDisplayName, adminPassword] = userArgs;

async function initializeDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/phreddit", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");

    // Clear existing data
    await Promise.all([
      UserModel.deleteMany({}),
      CommunityModel.deleteMany({}),
      PostModel.deleteMany({}),
      CommentModel.deleteMany({}),
      LinkFlairModel.deleteMany({}),
    ]);
    console.log("Cleared existing data");

    // Create admin user
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
    const admin = await UserModel.create({
      email: adminEmail,
      displayName: adminDisplayName,
      passwordHash: adminPasswordHash,
      firstName: "Admin",
      lastName: "User",
      isAdmin: true,
      reputation: 1000,
    });
    console.log("Created admin user");

    // Create sample users
    const users = await UserModel.create([
      {
        email: "john@example.com",
        displayName: "john_doe",
        passwordHash: await bcrypt.hash("password123", 10),
        firstName: "John",
        lastName: "Doe",
        reputation: 500,
      },
      {
        email: "jane@example.com",
        displayName: "jane_smith",
        passwordHash: await bcrypt.hash("password123", 10),
        firstName: "Jane",
        lastName: "Smith",
        reputation: 750,
      },
      {
        email: "bob@example.com",
        displayName: "bob_wilson",
        passwordHash: await bcrypt.hash("password123", 10),
        firstName: "Bob",
        lastName: "Wilson",
        reputation: 300,
      },
      {
        email: "alice@example.com",
        displayName: "alice_dev",
        passwordHash: await bcrypt.hash("password123", 10),
        firstName: "Alice",
        lastName: "Developer",
        reputation: 1200,
      },
      {
        email: "charlie@example.com",
        displayName: "charlie_tech",
        passwordHash: await bcrypt.hash("password123", 10),
        firstName: "Charlie",
        lastName: "Tech",
        reputation: 450,
      },
      {
        email: "diana@example.com",
        displayName: "diana_science",
        passwordHash: await bcrypt.hash("password123", 10),
        firstName: "Diana",
        lastName: "Science",
        reputation: 800,
      },
    ]);
    console.log("Created sample users");

    // Create link flairs
    const flairs = await LinkFlairModel.create([
      { content: "Discussion" },
      { content: "Question" },
      { content: "News" },
      { content: "Meta" },
      { content: "Tutorial" },
      { content: "Showcase" },
    ]);
    console.log("Created link flairs");

    // Create communities
    const communities = await CommunityModel.create([
      {
        name: "Technology",
        description: "Discuss the latest in tech",
        creator: users[0].displayName,
        members: [
          users[0].displayName,
          users[1].displayName,
          users[3].displayName,
          admin.displayName,
        ],
      },
      {
        name: "Science",
        description: "Scientific discussions and discoveries",
        creator: users[5].displayName,
        members: [
          users[5].displayName,
          users[2].displayName,
          users[4].displayName,
        ],
      },
      {
        name: "Programming",
        description: "Programming help and discussions",
        creator: admin.displayName,
        members: [
          admin.displayName,
          users[0].displayName,
          users[2].displayName,
          users[3].displayName,
        ],
      },
      {
        name: "Web Development",
        description: "Frontend and backend development discussions",
        creator: users[3].displayName,
        members: [
          users[3].displayName,
          users[1].displayName,
          users[4].displayName,
        ],
      },
      {
        name: "Data Science",
        description: "Machine learning, AI, and data analysis",
        creator: users[5].displayName,
        members: [
          users[5].displayName,
          users[2].displayName,
          admin.displayName,
        ],
      },
    ]);
    console.log("Created communities");

    // Create posts
    const posts = await PostModel.create([
      {
        title: "New JavaScript Framework Released",
        content:
          "A new framework has been released that promises to revolutionize web development...",
        postedBy: users[0].displayName,
        communityID: communities[0]._id,
        linkFlairID: flairs[2]._id,
        upvoters: [
          users[1].displayName,
          admin.displayName,
          users[3].displayName,
        ],
        downvoters: [users[4].displayName],
        views: 1250,
      },
      {
        title: "Help with React Hooks",
        content:
          "I'm having trouble understanding the useEffect hook. Can someone explain...",
        postedBy: users[1].displayName,
        communityID: communities[2]._id,
        linkFlairID: flairs[1]._id,
        upvoters: [users[0].displayName, users[3].displayName],
        downvoters: [],
        views: 850,
      },
      {
        title: "Latest Scientific Discovery",
        content: "Scientists have made a breakthrough in quantum computing...",
        postedBy: admin.displayName,
        communityID: communities[1]._id,
        linkFlairID: flairs[2]._id,
        upvoters: [
          users[0].displayName,
          users[1].displayName,
          users[5].displayName,
        ],
        downvoters: [],
        views: 2100,
      },
      {
        title: "My First Full-Stack Project",
        content:
          "I just completed my first full-stack project using React and Node.js. Here's what I learned...",
        postedBy: users[3].displayName,
        communityID: communities[3]._id,
        linkFlairID: flairs[4]._id,
        upvoters: [
          users[0].displayName,
          users[1].displayName,
          users[4].displayName,
        ],
        downvoters: [],
        views: 750,
      },
      {
        title: "Understanding Machine Learning Basics",
        content:
          "A comprehensive guide to getting started with machine learning...",
        postedBy: users[5].displayName,
        communityID: communities[4]._id,
        linkFlairID: flairs[4]._id,
        upvoters: [
          admin.displayName,
          users[2].displayName,
          users[4].displayName,
        ],
        downvoters: [],
        views: 1500,
      },
      {
        title: "Showcase: My Portfolio Website",
        content:
          "I built my portfolio website using modern web technologies...",
        postedBy: users[4].displayName,
        communityID: communities[3]._id,
        linkFlairID: flairs[5]._id,
        upvoters: [users[3].displayName, users[1].displayName],
        downvoters: [],
        views: 600,
      },
    ]);
    console.log("Created posts");

    // Create comments (including nested replies)
    const comments = await CommentModel.create([
      // First post comments
      {
        content: "This is really interesting! Thanks for sharing.",
        commentedBy: users[1].displayName,
        upvoters: [users[0].displayName, users[3].displayName],
        downvoters: [],
      },
      {
        content: "I've been using this framework for a while now, it's great!",
        commentedBy: admin.displayName,
        upvoters: [users[0].displayName, users[1].displayName],
        downvoters: [],
      },
      // Second post comments
      {
        content: "Here's a detailed explanation of useEffect...",
        commentedBy: users[0].displayName,
        upvoters: [users[1].displayName, users[3].displayName],
        downvoters: [],
      },
      {
        content: "Thanks for the explanation! This really helps.",
        commentedBy: users[1].displayName,
        upvoters: [users[0].displayName],
        downvoters: [],
      },
      // Third post comments
      {
        content:
          "This is groundbreaking! Can't wait to see more research in this area.",
        commentedBy: users[5].displayName,
        upvoters: [admin.displayName, users[2].displayName],
        downvoters: [],
      },
      {
        content: "I have some questions about the methodology...",
        commentedBy: users[2].displayName,
        upvoters: [users[5].displayName],
        downvoters: [],
      },
      // Fourth post comments
      {
        content: "Great job! What was the most challenging part?",
        commentedBy: users[4].displayName,
        upvoters: [users[3].displayName],
        downvoters: [],
      },
      {
        content:
          "The authentication system was definitely the trickiest part to implement.",
        commentedBy: users[3].displayName,
        upvoters: [users[4].displayName, users[1].displayName],
        downvoters: [],
      },
      // Fifth post comments
      {
        content:
          "This is exactly what I needed! Do you have any recommended resources?",
        commentedBy: users[2].displayName,
        upvoters: [users[5].displayName, admin.displayName],
        downvoters: [],
      },
      {
        content:
          "I'll share some great learning materials in a follow-up post.",
        commentedBy: users[5].displayName,
        upvoters: [users[2].displayName],
        downvoters: [],
      },
    ]);
    console.log("Created comments");

    // Create reply comments
    const replies = await CommentModel.create([
      {
        content: "I agree! The documentation is excellent.",
        commentedBy: users[3].displayName,
        upvoters: [users[1].displayName],
        downvoters: [],
      },
      {
        content: "Have you tried the new features in version 2.0?",
        commentedBy: users[4].displayName,
        upvoters: [admin.displayName],
        downvoters: [],
      },
      {
        content: "Could you elaborate on the performance improvements?",
        commentedBy: users[2].displayName,
        upvoters: [users[0].displayName],
        downvoters: [],
      },
    ]);
    console.log("Created reply comments");

    // Add replies to comments
    comments[0].commentIDs.push(replies[0]._id);
    comments[1].commentIDs.push(replies[1]._id);
    comments[2].commentIDs.push(replies[2]._id);
    await Promise.all(comments.map((comment) => comment.save()));
    console.log("Added replies to comments");

    // Add comments to posts
    posts[0].commentIDs.push(comments[0]._id, comments[1]._id);
    posts[1].commentIDs.push(comments[2]._id, comments[3]._id);
    posts[2].commentIDs.push(comments[4]._id, comments[5]._id);
    posts[3].commentIDs.push(comments[6]._id, comments[7]._id);
    posts[4].commentIDs.push(comments[8]._id, comments[9]._id);
    await Promise.all(posts.map((post) => post.save()));
    console.log("Added comments to posts");

    // Add posts to communities
    communities[0].postIDs.push(posts[0]._id);
    communities[1].postIDs.push(posts[2]._id);
    communities[2].postIDs.push(posts[1]._id);
    communities[3].postIDs.push(posts[3]._id, posts[5]._id);
    communities[4].postIDs.push(posts[4]._id);
    await Promise.all(communities.map((community) => community.save()));
    console.log("Added posts to communities");

    console.log("Database initialization completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing database:", error);
    process.exit(1);
  }
}

initializeDatabase();
