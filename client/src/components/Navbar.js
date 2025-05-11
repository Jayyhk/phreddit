import React, { useState } from "react";

const Navbar = ({
  communities,
  onHomeClick,
  onCreateCommunity,
  onCommunityClick,
  isHomeActive,
  isCreateCommunityActive,
  activeCommunityID,
  isLoggedIn,
}) => {
  const [error, setError] = useState("");

  const handleCreateCommunity = () => {
    if (!isLoggedIn) {
      setError("Please log in to create a community");
      return;
    }
    try {
      onCreateCommunity();
      setError("");
    } catch (err) {
      setError("Failed to create community. Please try again.");
    }
  };

  const handleCommunityClick = (communityId) => {
    try {
      onCommunityClick(communityId);
      setError("");
    } catch (err) {
      setError("Failed to load community. Please try again.");
    }
  };

  return (
    <nav id="navbar">
      {error && (
        <div className="navbar-error">
          {error}
          <button
            className="button_style button_hover"
            onClick={() => {
              setError("");
              onHomeClick();
            }}
          >
            Return to Welcome Page
          </button>
        </div>
      )}
      <div id="home_link_container">
        <a
          id="home_link"
          href="#/"
          className={isHomeActive ? "active" : ""}
          onClick={onHomeClick}
        >
          Home
        </a>
      </div>
      <h2 id="communities_header">Communities</h2>
      <div id="create_community_container">
        <button
          id="create_community_button"
          className={`${isCreateCommunityActive ? "active" : ""} ${
            !isLoggedIn ? "button_disabled" : ""
          }`}
          onClick={handleCreateCommunity}
          disabled={!isLoggedIn}
        >
          Create Community
        </button>
      </div>
      <ul id="community_list">
        {communities.map((community) => (
          <li key={community._id}>
            <a
              href="#/"
              className={`community_link ${
                community._id === activeCommunityID ? "active" : ""
              }`}
              onClick={() => handleCommunityClick(community._id)}
            >
              {community.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;
