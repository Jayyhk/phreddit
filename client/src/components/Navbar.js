import React, { useState, useEffect } from "react";

const Navbar = ({
  communities,
  onHomeClick,
  onCreateCommunity,
  onCommunityClick,
  isHomeActive,
  isCreateCommunityActive,
  activeCommunityID,
  isLoggedIn,
  currentUser,
  onError,
}) => {
  const [sortedCommunities, setSortedCommunities] = useState([]);

  useEffect(() => {
    const sorted = [...communities].sort((a, b) => {
      // If user is logged in, prioritize joined communities
      if (isLoggedIn) {
        if (a.isMember && !b.isMember) return -1;
        if (!a.isMember && b.isMember) return 1;
      }
      // Then sort alphabetically
      return a.name.localeCompare(b.name);
    });
    setSortedCommunities(sorted);
  }, [communities, isLoggedIn, currentUser]);

  const handleCreateCommunity = () => {
    if (!isLoggedIn) {
      onError("Please log in to create a community");
      return;
    }
    try {
      onCreateCommunity();
    } catch (err) {
      console.error("Failed to create community:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to create community. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  const handleCommunityClick = (communityId) => {
    try {
      onCommunityClick(communityId);
    } catch (err) {
      console.error("Failed to load community:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to load community. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  // Group communities into joined and other
  const joinedCommunities = sortedCommunities.filter((c) => c.isMember);
  const otherCommunities = sortedCommunities.filter((c) => !c.isMember);

  return (
    <nav id="navbar">
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
        {isLoggedIn && joinedCommunities.length > 0 && (
          <>
            <li className="community-section-header">Joined Communities</li>
            {joinedCommunities.map((community) => (
              <li key={community._id}>
                <a
                  href="#/"
                  className={`community_link ${
                    community._id === activeCommunityID ? "active" : ""
                  } joined`}
                  onClick={() => handleCommunityClick(community._id)}
                >
                  {community.name}
                </a>
              </li>
            ))}
          </>
        )}
        {isLoggedIn && otherCommunities.length > 0 && (
          <>
            <li className="community-section-header">Other Communities</li>
            {otherCommunities.map((community) => (
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
          </>
        )}
        {!isLoggedIn &&
          sortedCommunities.map((community) => (
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
