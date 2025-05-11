// src/App.js
import React, { useState, useEffect } from "react";
import axios from "axios";

import "./stylesheets/App.css";
import "./stylesheets/index.css";

import Banner from "./components/Banner";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import CommunityPage from "./components/CommunityPage";
import PostPage from "./components/Post";
import CreateCommunityPage from "./components/CreateCommunityPage";
import CreatePostPage from "./components/CreatePostPage";
import CreateCommentPage from "./components/CreateCommentPage";
import WelcomePage from "./components/WelcomePage";
import CreateAccountPage from "./components/CreateAccountPage";

axios.defaults.baseURL = "http://localhost:8000";
axios.defaults.withCredentials = true; // send session cookie

function App() {
  // --- AUTH & VIEW STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [viewState, setViewState] = useState({ page: "login" });
  const handleCancelRegister = () => setViewState({ page: "login" });

  // --- APP DATA STATE ---
  const [sortType, setSortType] = useState("newest");
  const [communities, setCommunities] = useState([]);
  const [posts, setPosts] = useState([]);
  const [linkFlairs, setLinkFlairs] = useState([]);
  const [commentCounts, setCommentCounts] = useState({});
  const [latestDates, setLatestDates] = useState({});
  const [currentPost, setCurrentPost] = useState(null);
  const [currentComments, setCurrentComments] = useState([]);
  const [currentCommunity, setCurrentCommunity] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  // --- FETCH ALL COMMUNITIES/POSTS/FLAIRS WHEN AUTHED ---
  useEffect(() => {
    if (!currentUser) return;
    axios
      .get("/communities")
      .then((r) => {
        setCommunities(r.data);
      })
      .catch((err) => {
        console.error("Failed to fetch communities:", err);
        setCurrentUser(null); // Return to welcome page
      });
    axios
      .get("/posts")
      .then((r) => setPosts(r.data))
      .catch((err) => {
        console.error("Failed to fetch posts:", err);
        setCurrentUser(null); // Return to welcome page
      });
    axios
      .get("/linkflairs")
      .then((r) => setLinkFlairs(r.data))
      .catch((err) => {
        console.error("Failed to fetch link flairs:", err);
        setCurrentUser(null); // Return to welcome page
      });
  }, [currentUser]);

  // --- UPDATE COMMENT COUNTS WHEN posts CHANGES ---
  useEffect(() => {
    if (!currentUser) return;
    posts.forEach((post) =>
      axios
        .get(`/posts/${post._id}/comments/count`)
        .then((r) =>
          setCommentCounts((cc) => ({ ...cc, [post._id]: r.data.count }))
        )
        .catch((err) => {
          console.error("Failed to fetch comment count:", err);
          setCurrentUser(null); // Return to welcome page
        })
    );
  }, [posts, currentUser]);

  // --- UPDATE LATEST COMMENT DATES ---
  useEffect(() => {
    if (!currentUser) return;
    posts.forEach((post) =>
      axios
        .get(`/posts/${post._id}/latest-comment-date`)
        .then((r) =>
          setLatestDates((ld) => ({
            ...ld,
            [post._id]: new Date(r.data.latestCommentDate),
          }))
        )
        .catch((err) => {
          console.error("Failed to fetch latest comment date:", err);
          setCurrentUser(null); // Return to welcome page
        })
    );
  }, [posts, currentUser]);

  // --- LOAD A SINGLE POST & ITS COMMENTS ---
  useEffect(() => {
    if (viewState.page === "post") {
      const pid = viewState.postID;
      axios
        .get(`/posts/${pid}`)
        .then((r) => setCurrentPost(r.data))
        .catch((err) => {
          console.error("Failed to fetch post:", err);
          setCurrentUser(null); // Return to welcome page
        });
      axios
        .get(`/posts/${pid}/comments/all`)
        .then((r) => setCurrentComments(r.data))
        .catch((err) => {
          console.error("Failed to fetch comments:", err);
          setCurrentUser(null); // Return to welcome page
        });
      const comm = communities.find((c) =>
        c.postIDs.map((id) => id.toString()).includes(pid)
      );
      setCurrentCommunity(comm || null);
    }
  }, [viewState.page, viewState.postID, communities]);

  // --- PERFORM SEARCH WHEN search VIEW IS ACTIVE ---
  useEffect(() => {
    if (viewState.page === "search") {
      axios
        .get(`/search?query=${encodeURIComponent(viewState.query)}`)
        .then((r) => setSearchResults(r.data))
        .catch((err) => {
          console.error("Failed to search:", err);
          setCurrentUser(null); // Return to welcome page
        });
    }
  }, [viewState.page, viewState.query]);

  // --- AUTH HANDLERS ---
  const handleLogin = async () => {
    try {
      const res = await axios.get("/me");
      setCurrentUser(res.data.user);
      setViewState({ page: "home" });
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/logout");
      setCurrentUser(null);
      setViewState({ page: "login" });
    } catch (err) {
      console.error("Logout failed:", err);
      // Show error toast to user
      const errorMessage =
        err.response?.data?.error || "Failed to logout. Please try again.";
      alert(errorMessage); // Using alert as a simple fallback, could be replaced with a proper toast component
    }
  };

  const handleGuest = () => {
    setCurrentUser({ displayName: "Guest", guest: true });
    setViewState({ page: "home" });
  };

  const handleRegisterNav = () => setViewState({ page: "register" });
  const handleRegistered = () => setViewState({ page: "login" });

  const renderView = (page, params = {}) => {
    if (["home", "community", "search"].includes(page)) setSortType("newest");
    setViewState({ page, ...params });
  };

  const sortPosts = (list, mode) => {
    const sorted = [...list];
    if (mode === "newest") {
      sorted.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else if (mode === "oldest") {
      sorted.sort((a, b) => new Date(a.postedDate) - new Date(b.postedDate));
    } else if (mode === "active") {
      sorted.sort((a, b) => {
        const aDate = latestDates[a._id] || new Date(0);
        const bDate = latestDates[b._id] || new Date(0);
        if (bDate - aDate === 0) {
          return new Date(b.postedDate) - new Date(a.postedDate);
        }
        return bDate - aDate;
      });
    }
    return sorted;
  };

  const handlePostClick = async (postID) => {
    const post = posts.find((p) => p._id === postID);
    if (post) {
      try {
        const r = await axios.put(`/posts/${postID}`, {
          views: post.views + 1,
        });
        const updated = r.data;
        setPosts((prev) => prev.map((p) => (p._id === postID ? updated : p)));
        setCurrentPost(updated);
      } catch (e) {
        console.error("Failed to increment views", e);
      }
    }
    renderView("post", { postID });
  };

  const getCommentCount = (postID) => commentCounts[postID] || 0;
  const getLinkFlairContent = (linkFlairID) => {
    const lf = linkFlairs.find((l) => l._id === linkFlairID);
    return lf ? lf.content : "";
  };

  let mainContent;
  switch (viewState.page) {
    case "home":
      mainContent = (
        <HomePage
          posts={sortPosts(posts, sortType)}
          communities={communities}
          onPostClick={handlePostClick}
          onSortChange={setSortType}
          getCommentCount={getCommentCount}
          getLinkFlairContent={getLinkFlairContent}
          currentUser={currentUser}
        />
      );
      break;

    case "community": {
      const { communityID } = viewState;
      const comm = communities.find((c) => c._id === communityID);
      const commPosts = posts.filter((p) =>
        comm?.postIDs.map((id) => id.toString()).includes(p._id)
      );
      mainContent = comm ? (
        <CommunityPage
          community={comm}
          posts={sortPosts(commPosts, sortType)}
          onPostClick={handlePostClick}
          onSortChange={setSortType}
          getCommentCount={getCommentCount}
          getLinkFlairContent={getLinkFlairContent}
        />
      ) : (
        <div>Community not found.</div>
      );
      break;
    }

    case "post":
      mainContent = currentPost ? (
        <PostPage
          post={currentPost}
          community={currentCommunity}
          comments={currentComments}
          onAddComment={() =>
            renderView("create-comment", { postID: currentPost._id })
          }
          onReply={(cid) =>
            renderView("create-comment", {
              postID: currentPost._id,
              replyCommentID: cid,
            })
          }
          getLinkFlairContent={getLinkFlairContent}
        />
      ) : (
        <div>Loading post…</div>
      );
      break;

    case "create-community":
      mainContent = (
        <CreateCommunityPage
          currentUser={currentUser}
          communities={communities}
          onEngender={async (data) => {
            try {
              const r = await axios.post("/communities", data);
              // Fetch fresh communities list to get proper isMember flags
              const communitiesResponse = await axios.get("/communities");
              setCommunities(communitiesResponse.data);
              renderView("community", { communityID: r.data._id });
              return true;
            } catch (e) {
              console.error("Failed to create community", e);
              return false;
            }
          }}
        />
      );
      break;

    case "create-post":
      mainContent = (
        <CreatePostPage
          communities={communities}
          linkFlairs={linkFlairs}
          currentUser={currentUser}
          onSubmit={async (data) => {
            try {
              // First verify the community exists
              const community = communities.find(
                (c) => c._id === data.communityID
              );
              if (!community) {
                throw new Error("Selected community not found");
              }

              // Create link flair if needed
              let flairID = data.selectedLinkFlairID;
              if (!flairID && data.newLinkFlair) {
                const r1 = await axios.post("/linkflairs", {
                  content: data.newLinkFlair,
                });
                flairID = r1.data._id;
                setLinkFlairs((prev) => [r1.data, ...prev]);
              }

              // Create the post
              const r2 = await axios.post("/posts", {
                title: data.title,
                content: data.content,
                linkFlairID: flairID,
                postedBy: data.postedBy,
              });
              const newPost = r2.data;

              // Add post to community
              await axios.post(`/communities/${data.communityID}/add-post`, {
                postID: newPost._id,
              });

              // Update local state
              setPosts((prev) => [newPost, ...prev]);
              setCommunities((prev) =>
                prev.map((c) =>
                  c._id === data.communityID
                    ? { ...c, postIDs: [newPost._id, ...c.postIDs] }
                    : c
                )
              );

              // Navigate to the new post
              renderView("post", { postID: newPost._id });
            } catch (e) {
              console.error("Failed to create post", e);
              // Show more specific error message
              const errorMessage =
                e.response?.data?.error || e.message || "Failed to create post";
              alert(
                `${errorMessage}. Please try again or return to the welcome page.`
              );
            }
          }}
        />
      );
      break;

    case "create-comment":
      mainContent = (
        <CreateCommentPage
          currentUser={currentUser}
          onSubmit={async (data) => {
            try {
              const r = await axios.post("/comments", {
                content: data.content,
                commentedBy: data.commentedBy,
              });
              const cid = r.data._id;

              if (viewState.replyCommentID) {
                await axios.post(
                  `/comments/${viewState.replyCommentID}/add-reply`,
                  { replyCommentID: cid }
                );
              } else {
                await axios.post(`/posts/${viewState.postID}/add-comment`, {
                  commentID: cid,
                });
              }

              setCommentCounts((cc) => ({
                ...cc,
                [viewState.postID]: (cc[viewState.postID] || 0) + 1,
              }));

              try {
                const ld = await axios.get(
                  `/posts/${viewState.postID}/latest-comment-date`
                );
                setLatestDates((prev) => ({
                  ...prev,
                  [viewState.postID]: new Date(ld.data.latestCommentDate),
                }));
              } catch (e) {
                console.error("Failed to refresh latest date", e);
              }

              renderView("post", { postID: viewState.postID });
            } catch (e) {
              console.error("Failed to add comment", e);
              const errorMessage =
                e.response?.data?.error || e.message || "Failed to add comment";
              alert(
                `${errorMessage}. Please try again or return to the welcome page.`
              );
            }
          }}
        />
      );
      break;

    case "search":
      mainContent = (
        <HomePage
          posts={sortPosts(searchResults, sortType)}
          communities={communities}
          onPostClick={handlePostClick}
          onSortChange={setSortType}
          getCommentCount={getCommentCount}
          getLinkFlairContent={getLinkFlairContent}
          searchQuery={viewState.query}
        />
      );
      break;

    default:
      mainContent = <div>Invalid view</div>;
  }

  const activeCommunityID =
    viewState.page === "community" ? viewState.communityID : null;

  // --- AUTHENTICATION FLOWS ---
  if (!currentUser) {
    if (viewState.page === "register") {
      return (
        <CreateAccountPage
          onRegistered={handleRegistered}
          onCancel={handleCancelRegister}
        />
      );
    }
    return (
      <WelcomePage
        onLogin={handleLogin}
        onRegister={handleRegisterNav}
        onGuest={handleGuest}
      />
    );
  }

  return (
    <div id="wrapper">
      <Banner
        onTitleClick={() => {
          setCurrentUser(null);
          setViewState({ page: "login" });
        }}
        onSearch={(q) => renderView("search", { query: q })}
        onCreatePost={() => renderView("create-post")}
        isCreatePostActive={viewState.page === "create-post"}
        onLogout={handleLogout}
        isLoggedIn={!!currentUser && !currentUser.guest}
        currentUser={currentUser}
      />
      <Navbar
        communities={communities}
        onHomeClick={() => renderView("home")}
        onCreateCommunity={() => renderView("create-community")}
        onCommunityClick={(cid) =>
          renderView("community", { communityID: cid })
        }
        isHomeActive={viewState.page === "home"}
        isCreateCommunityActive={viewState.page === "create-community"}
        activeCommunityID={activeCommunityID}
        isLoggedIn={!!currentUser && !currentUser.guest}
        currentUser={currentUser}
      />
      <div id="main">{mainContent}</div>
    </div>
  );
}

export default App;
