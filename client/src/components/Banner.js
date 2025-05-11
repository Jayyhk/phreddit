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

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && searchText.trim() !== "") {
      try {
        onSearch && onSearch(searchText);
      } catch (err) {
        console.error("Failed to perform search:", err);
        const errorMsg =
          err.response?.data?.error ||
          "Failed to perform search. Please try again.";
        onError(errorMsg);
        return;
      }
    }
  };

  const handleCreatePost = () => {
    if (!isLoggedIn) {
      onError("Please log in to create a post");
      return;
    }
    try {
      onCreatePost && onCreatePost();
    } catch (err) {
      console.error("Failed to create post:", err);
      const errorMsg =
        err.response?.data?.error || "Failed to create post. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  const handleLogout = async () => {
    try {
      await onLogout();
    } catch (err) {
      console.error("Failed to logout:", err);
      const errorMsg =
        err.response?.data?.error || "Failed to logout. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  const createPostClass = `button_style button_hover ${
    isCreatePostActive ? "button_active" : ""
  } ${!isLoggedIn ? "button_disabled" : ""}`;

  return (
    <div id="banner">
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
