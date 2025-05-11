import React, { useState } from "react";

const Banner = ({
  onTitleClick,
  onSearch,
  onCreatePost,
  isCreatePostActive,
  onLogout,
  isLoggedIn,
  currentUser,
  onError,
}) => {
  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchText.trim() !== "") {
      try {
        onSearch && onSearch(searchText);
        setError("");
      } catch (err) {
        setError("Failed to perform search. Please try again.");
        onError();
      }
    }
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      setError("Please log in to create a post");
      return;
    }
    try {
      onCreatePost && onCreatePost();
      setError("");
    } catch (err) {
      setError("Failed to create post. Please try again.");
      onError();
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
      setError("");
    } catch (err) {
      setError("Failed to logout. Please try again.");
      onError();
    }
  };

  const createPostClass = `button_style button_hover ${
    isCreatePostActive ? "button_active" : ""
  } ${!isLoggedIn ? "button_disabled" : ""}`;

  return (
    <div id="banner">
      {error && (
        <div className="banner-error">
          {error}
          <button
            className="button_style button_hover"
            onClick={() => {
              setError("");
              onError();
            }}
          >
            Return to Welcome Page
          </button>
        </div>
      )}
      <a
        id="banner_title"
        href="#/"
        style={{ cursor: "pointer" }}
        onClick={(e) => {
          e.preventDefault();
          onTitleClick();
        }}
      >
        phreddit
      </a>
      <input
        id="banner_search"
        type="text"
        placeholder="Search Phreddit..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        onKeyPress={handleKeyPress}
      />
      <div className="banner-buttons">
        <button
          id="banner_create"
          className={createPostClass}
          onClick={handleCreatePost}
          disabled={!isLoggedIn}
        >
          Create Post
        </button>
        <button
          id="banner_profile"
          className="button_style button_hover"
          disabled={!isLoggedIn}
        >
          {isLoggedIn ? currentUser?.displayName || "Profile" : "Guest"}
        </button>
        {isLoggedIn && (
          <button
            id="banner_logout"
            className="button_style button_hover"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
};

export default Banner;
