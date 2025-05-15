// src/App.js
import React, { useState, useEffect } from "react";
import axios from "./axios";

import "./stylesheets/App.css";
import "./stylesheets/index.css";

import Banner from "./components/Banner";
import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import CommunityPage from "./components/CommunityPage";
import Post from "./components/Post";
import CreateCommunityPage from "./components/CreateCommunityPage";
import CreatePostPage from "./components/CreatePostPage";
import CreateCommentPage from "./components/CreateCommentPage";
import WelcomePage from "./components/WelcomePage";
import CreateAccountPage from "./components/CreateAccountPage";
import ErrorBanner from "./components/ErrorBanner";
import UserProfilePage from "./components/UserProfilePage";
import EditCommunityPage from "./components/EditCommunityPage";
import EditPostPage from "./components/EditPostPage";
import EditCommentPage from "./components/EditCommentPage";

axios.defaults.baseURL = "http://localhost:8000";

function App() {
  /* ------------------------------------------------------------------
   *  AUTH & VIEW STATE
   * ---------------------------------------------------------------- */
  const [currentUser, setCurrentUser] = useState(null);
  const [viewState, setViewState] = useState({ page: "login" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const handleCancelRegister = () => setViewState({ page: "login" });

  /* ------------------------------------------------------------------
   *  CHECK SESSION ON PAGE LOAD
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const bootstrap = async () => {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setIsLoading(false);
        return;
      } // no token → show login
      try {
        const { data } = await axios.get("/me"); // token auto-attached
        if (data.user) {
          setCurrentUser(data.user);
          setViewState({ page: "home" });
        }
      } catch {
        /* token is invalid/expired – ignore */
      }
      setIsLoading(false);
    };
    bootstrap();
  }, []);

  /* ------------------------------------------------------------------
   *  ERROR HANDLING HELPERS
   * ---------------------------------------------------------------- */
  const handleError = (msg = "") => setError(msg);

  const handleErrorRedirect = () => {
    setError("");
    setCurrentUser(null);
    setInitialLoadDone(false); // force re-hydration after logout
    setViewState({ page: "login" });
  };

  // clear banner on every view change
  useEffect(() => setError(""), [viewState.page]);

  /* ------------------------------------------------------------------
   *  APP-WIDE DATA STATE
   * ---------------------------------------------------------------- */
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
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  /* ------------------------------------------------------------------
   *  ONE-TIME BULK FETCH AFTER LOGIN
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!currentUser || initialLoadDone) return;

    const fetchInitialData = async () => {
      try {
        const [communitiesRes, postsRes, flairsRes] = await Promise.all([
          axios.get("/communities"),
          axios.get("/posts"),
          axios.get("/linkflairs"),
        ]);
        setCommunities(communitiesRes.data);
        setPosts(postsRes.data);
        setLinkFlairs(flairsRes.data);
        setInitialLoadDone(true);
        setViewState({ page: "home" });
      } catch (err) {
        console.error("Initial fetch failed:", err);
        handleError("Failed to load initial data. Please refresh.");
      }
    };
    fetchInitialData();
  }, [currentUser, initialLoadDone]);

  /* ------------------------------------------------------------------
   *  SMALL REFRESH HELPERS
   * ---------------------------------------------------------------- */
  // refresh the list of communities in the side-bar
  const refreshCommunities = async () => {
    try {
      const { data } = await axios.get("/communities");
      setCommunities(data);
    } catch (err) {
      console.error("Failed to refresh communities:", err);
      handleError();
    }
  };

  // ---------- NEW helper: refresh the comment count for ONE post ------
  const refreshCommentCount = async (postID) => {
    try {
      const { data } = await axios.get(`/posts/${postID}/comments/count`);
      setCommentCounts((cc) => ({ ...cc, [postID]: data.count }));
    } catch (err) {
      console.error("Failed to refresh comment count:", err);
      // no banner here; silent failure is OK
    }
  };

  /* ------------------------------------------------------------------
   *  KEEP COMMENT COUNTS & LATEST DATES IN SYNC
   * ---------------------------------------------------------------- */
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
          handleError();
        })
    );
  }, [posts, currentUser]);

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
          handleError();
        })
    );
  }, [posts, currentUser]);

  /* ------------------------------------------------------------------
   *  LOAD ONE POST & ITS COMMENTS WHEN NEEDED
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (viewState.page !== "post") return;

    const pid = viewState.postID;
    axios
      .get(`/posts/${pid}`)
      .then((r) => setCurrentPost(r.data))
      .catch((err) => {
        console.error("Failed to fetch post:", err);
        handleError();
      });

    axios
      .get(`/posts/${pid}/comments/all`)
      .then((r) => setCurrentComments(r.data))
      .catch((err) => {
        console.error("Failed to fetch comments:", err);
        handleError();
      });

    const comm = communities.find((c) =>
      c.postIDs.map((id) => id.toString()).includes(pid)
    );
    setCurrentCommunity(comm || null);
  }, [viewState, communities]);

  /* ------------------------------------------------------------------
   *  PERFORM GLOBAL SEARCH
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (viewState.page !== "search") return;
    axios
      .get(`/search?query=${encodeURIComponent(viewState.query)}`)
      .then((r) => setSearchResults(r.data))
      .catch((err) => {
        console.error("Search failed:", err);
        handleError();
      });
  }, [viewState]);

  /* ------------------------------------------------------------------
   *  AUTH HELPERS
   * ---------------------------------------------------------------- */
  const handleLogin = async () => {
    try {
      const res = await axios.get("/me");
      setCurrentUser(res.data.user);
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
      sessionStorage.removeItem("token"); // Then remove token
      setCurrentUser(null);
      setViewState({ page: "login" });
      setInitialLoadDone(false);
    } catch (err) {
      console.error("Logout failed:", err);
      handleError(
        err.response?.data?.error || "Failed to logout. Please try again."
      );
    }
  };

  const handleGuest = () => {
    setCurrentUser({ displayName: "Guest", guest: true });
    setInitialLoadDone(false);
    setViewState({ page: "home" });
  };

  const handleRegisterNav = () => setViewState({ page: "register" });
  const handleRegistered = () => setViewState({ page: "login" });

  /* ------------------------------------------------------------------
   *  LIGHTWEIGHT HELPERS USED BY CHILD COMPONENTS
   * ---------------------------------------------------------------- */
  const renderView = (page, params = {}) => {
    if (["home", "community", "search"].includes(page)) setSortType("newest");

    if (page === "profile") {
      // force refresh of profile view (quick trick)
      setViewState({ page: "home" });
      setTimeout(() => {
        setViewState({ page: "profile" });
        window.scrollTo(0, 0);
      }, 0);
      return;
    }
    setViewState({ page, ...params });
    window.scrollTo(0, 0);
  };

  const sortPosts = (arr, type) => {
    if (type === "newest")
      return [...arr].sort(
        (a, b) => new Date(b.postedDate) - new Date(a.postedDate)
      );

    if (type === "latestComment")
      return [...arr].sort(
        (a, b) => (latestDates[b._id] || 0) - (latestDates[a._id] || 0)
      );

    // votes
    return [...arr].sort(
      (a, b) =>
        b.upvoters.length -
        b.downvoters.length -
        (a.upvoters.length - a.downvoters.length)
    );
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
        console.error("Failed updating views:", e);
      }
    }
    renderView("post", { postID });
  };

  const getCommentCount = (pid) =>
    commentCounts.hasOwnProperty(pid) ? commentCounts[pid] : null;

  const getLinkFlairContent = (flairID) => {
    const lf = linkFlairs.find((l) => l._id === flairID);
    return lf ? lf.content : "";
  };

  /* ------------------------------------------------------------------
   *  MAIN ROUTER
   * ---------------------------------------------------------------- */
  let mainContent;
  switch (viewState.page) {
    /* -------------------- HOME -------------------- */
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
          onError={handleError}
        />
      );
      break;

    /* ------------------ COMMUNITY ----------------- */
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
          onError={handleError}
          currentUser={currentUser}
          onCommunitiesUpdate={setCommunities}
        />
      ) : (
        <div>Community not found.</div>
      );
      break;
    }

    /* --------------------- POST -------------------- */
    case "post": {
      const { postID } = viewState;
      const post = posts.find((p) => p._id === postID);
      const community = communities.find((c) => c.postIDs.includes(postID));
      mainContent = post ? (
        <Post
          post={post}
          community={community}
          comments={currentComments}
          onAddComment={() =>
            renderView("create-comment", { postID: post._id })
          }
          onReply={(cid) =>
            renderView("create-comment", {
              postID: post._id,
              replyCommentID: cid,
            })
          }
          getLinkFlairContent={getLinkFlairContent}
          isGuest={currentUser?.guest}
          onError={handleError}
          currentUser={currentUser}
        />
      ) : (
        <div>Post not found.</div>
      );
      break;
    }

    /* -------------- CREATE / EDIT COMMUNITY -------- */
    case "create-community":
      if (viewState.community) {
        mainContent = (
          <EditCommunityPage
            community={viewState.community}
            communities={communities}
            onEngender={async (data) => {
              try {
                await axios.put(`/communities/${data._id}`, data);
                const { data: comms } = await axios.get("/communities");
                setCommunities(comms);
                renderView("profile");
                return true;
              } catch (e) {
                console.error("Failed to update community:", e);
                return false;
              }
            }}
            onDeleteCommunity={async (id) => {
              try {
                await axios.delete(`/communities/${id}`);
                const { data: comms } = await axios.get("/communities");
                setCommunities(comms);
                renderView("profile");
              } catch (err) {
                handleError(
                  err.response?.data?.error ||
                    "Failed to delete community. Please try again."
                );
              }
            }}
            onError={handleError}
          />
        );
      } else {
        mainContent = (
          <CreateCommunityPage
            currentUser={currentUser}
            communities={communities}
            onEngender={async (data) => {
              try {
                const r = await axios.post("/communities", data);
                const { data: comms } = await axios.get("/communities");
                setCommunities(comms);
                renderView("community", { communityID: r.data._id });
                return true;
              } catch (e) {
                console.error("Failed to create community:", e);
                return false;
              }
            }}
            onError={handleError}
          />
        );
      }
      break;

    /* ---------------- CREATE / EDIT POST ----------- */
    case "create-post":
      if (viewState.post) {
        mainContent = (
          <EditPostPage
            post={viewState.post}
            communities={communities}
            linkFlairs={linkFlairs}
            currentUser={currentUser}
            onSubmit={async (data) => {
              try {
                const r = await axios.put(`/posts/${data._id}`, data);
                setPosts((prev) =>
                  prev.map((p) => (p._id === data._id ? r.data : p))
                );
                renderView("profile");
                return true;
              } catch (e) {
                console.error("Failed to update post:", e);
                return false;
              }
            }}
            onDeletePost={async (id) => {
              try {
                await axios.delete(`/posts/${id}`);
                const { data: ps } = await axios.get("/posts");
                setPosts(ps);
                renderView("profile");
              } catch (err) {
                handleError(
                  err.response?.data?.error ||
                    "Failed to delete post. Please try again."
                );
              }
            }}
            onError={handleError}
          />
        );
      } else {
        mainContent = (
          <CreatePostPage
            communities={communities}
            linkFlairs={linkFlairs}
            currentUser={currentUser}
            onSubmit={async (data) => {
              try {
                const community = communities.find(
                  (c) => c._id === data.communityID
                );
                if (!community) throw new Error("Community not found");

                let flairID = data.selectedLinkFlairID;
                if (!flairID && data.newLinkFlair) {
                  const { data: lf } = await axios.post("/linkflairs", {
                    content: data.newLinkFlair,
                  });
                  flairID = lf._id;
                  setLinkFlairs((prev) => [lf, ...prev]);
                }

                const postPayload = {
                  title: data.title,
                  content: data.content,
                  postedBy: data.postedBy,
                  ...(flairID && { linkFlairID: flairID }),
                };

                const { data: newPost } = await axios.post(
                  "/posts",
                  postPayload
                );

                await axios.post(`/communities/${community._id}/add-post`, {
                  postID: newPost._id,
                });

                setPosts((prev) => [newPost, ...prev]);
                setCommunities((prev) =>
                  prev.map((c) =>
                    c._id === community._id
                      ? { ...c, postIDs: [newPost._id, ...c.postIDs] }
                      : c
                  )
                );

                renderView("post", { postID: newPost._id });
              } catch (err) {
                console.error("Failed to create post:", err);
                handleError(
                  err.response?.data?.error ||
                    "Failed to create post. Please try again."
                );
              }
            }}
            onError={handleError}
          />
        );
      }
      break;

    /* --------------- CREATE / EDIT COMMENT --------- */
    case "create-comment":
      if (viewState.comment) {
        /* ---------- EDIT EXISTING COMMENT ---------- */
        mainContent = (
          <EditCommentPage
            comment={viewState.comment}
            currentUser={currentUser}
            onSubmit={async (data) => {
              try {
                await axios.put(`/comments/${data._id}`, {
                  content: data.content,
                  commentedBy: data.commentedBy,
                });
                renderView("profile");
                return true;
              } catch (e) {
                console.error("Failed to update comment:", e);
                return false;
              }
            }}
            /* ---------- NEW LOGIC ⇣ refresh count after delete ---------- */
            onDeleteComment={async (id) => {
              try {
                // find the owning post BEFORE we delete the comment
                const { data } = await axios.get(`/comments/${id}/post`);
                const postID = data.postID;

                await axios.delete(`/comments/${id}`);

                if (postID) {
                  await refreshCommentCount(postID);
                }
                renderView("profile");
              } catch (err) {
                handleError(
                  err.response?.data?.error ||
                    "Failed to delete comment. Please try again."
                );
              }
            }}
            onError={handleError}
          />
        );
      } else {
        /* ---------- CREATE NEW COMMENT (or reply) ---- */
        mainContent = (
          <CreateCommentPage
            currentUser={currentUser}
            onSubmit={async (data) => {
              try {
                const { data: newComment } = await axios.post("/comments", {
                  content: data.content,
                  commentedBy: data.commentedBy,
                });

                if (viewState.replyCommentID) {
                  await axios.post(
                    `/comments/${viewState.replyCommentID}/add-reply`,
                    { replyCommentID: newComment._id }
                  );
                } else {
                  await axios.post(`/posts/${viewState.postID}/add-comment`, {
                    commentID: newComment._id,
                  });
                }

                // optimistic local update
                setCommentCounts((cc) => ({
                  ...cc,
                  [viewState.postID]: (cc[viewState.postID] || 0) + 1,
                }));

                // refresh "latest comment" date
                try {
                  const ld = await axios.get(
                    `/posts/${viewState.postID}/latest-comment-date`
                  );
                  setLatestDates((prev) => ({
                    ...prev,
                    [viewState.postID]: new Date(ld.data.latestCommentDate),
                  }));
                } catch (err) {
                  console.error("Failed to refresh latest date:", err);
                }

                renderView("post", { postID: viewState.postID });
              } catch (err) {
                console.error("Failed to add comment:", err);
                handleError(
                  err.response?.data?.error ||
                    "Failed to add comment. Please try again."
                );
              }
            }}
            onError={handleError}
          />
        );
      }
      break;

    /* --------------------- SEARCH ------------------ */
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
          currentUser={currentUser}
          onError={handleError}
        />
      );
      break;

    /* -------------------- PROFILE ------------------ */
    case "profile":
      mainContent = (
        <UserProfilePage
          currentUser={currentUser}
          onError={handleError}
          onCommunitiesUpdate={refreshCommunities}
          onEditPost={(post) => renderView("create-post", { post })}
          onEditComment={(comment) => renderView("create-comment", { comment })}
          onEditCommunity={(community) =>
            renderView("create-community", { community })
          }
        />
      );
      break;

    /* -------------------- DEFAULT ------------------ */
    default:
      mainContent = <div>Invalid view</div>;
  }

  const activeCommunityID =
    viewState.page === "community" ? viewState.communityID : null;

  /* ------------------------------------------------------------------
   *  AUTHENTICATION FLOW RENDER GUARDS
   * ---------------------------------------------------------------- */
  if (isLoading) return <div></div>;

  if (!currentUser) {
    if (viewState.page === "register") {
      return (
        <>
          <ErrorBanner error={error} onError={() => handleError()} />
          <CreateAccountPage
            onRegistered={handleRegistered}
            onCancel={handleCancelRegister}
            onError={handleError}
          />
        </>
      );
    }
    return (
      <>
        <ErrorBanner error={error} onError={() => handleError()} />
        <WelcomePage
          onLogin={handleLogin}
          onRegister={handleRegisterNav}
          onGuest={handleGuest}
          onError={handleError}
        />
      </>
    );
  }

  /* ------------------------------------------------------------------
   *  MAIN LAYOUT
   * ---------------------------------------------------------------- */
  return (
    <div id="wrapper">
      <ErrorBanner error={error} onError={handleErrorRedirect} />

      <Banner
        onTitleClick={handleErrorRedirect}
        onSearch={(q) => renderView("search", { query: q })}
        onCreatePost={() => renderView("create-post")}
        isCreatePostActive={viewState.page === "create-post" && !viewState.post}
        onLogout={handleLogout}
        isLoggedIn={!!currentUser && !currentUser.guest}
        currentUser={currentUser}
        onError={handleError}
        onProfileClick={() => renderView("profile")}
        isProfileActive={viewState.page === "profile"}
      />

      <Navbar
        communities={communities}
        onHomeClick={() => {
          refreshCommunities();
          renderView("home");
        }}
        onCreateCommunity={() => renderView("create-community")}
        onCommunityClick={(cid) => {
          refreshCommunities();
          renderView("community", { communityID: cid });
        }}
        isHomeActive={viewState.page === "home"}
        isCreateCommunityActive={
          viewState.page === "create-community" && !viewState.community
        }
        activeCommunityID={activeCommunityID}
        isLoggedIn={!!currentUser && !currentUser.guest}
        currentUser={currentUser}
        onError={handleError}
      />

      <div id="main">{mainContent}</div>
    </div>
  );
}

export default App;
