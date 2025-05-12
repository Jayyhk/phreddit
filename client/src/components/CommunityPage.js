import React, { useState, useEffect } from "react";
import { formatTimeDelta, parseHyperlinks } from "./Helpers";
import axios from "axios";

const CommunityPage = ({
  community,
  posts,
  onPostClick,
  onSortChange,
  getCommentCount,
  getLinkFlairContent,
  onError,
  currentUser,
  onCommunitiesUpdate,
}) => {
  const [isJoining, setIsJoining] = useState(false);
  const [currentCommunity, setCurrentCommunity] = useState(community);
  const [currentPosts, setCurrentPosts] = useState(posts);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch fresh community data
        const communityResponse = await axios.get(
          `/communities/${community._id}`
        );
        setCurrentCommunity(communityResponse.data);

        // Fetch fresh posts for this community
        const postsResponse = await axios.get(
          `/communities/${community._id}/posts`
        );
        setCurrentPosts(postsResponse.data);
      } catch (err) {
        console.error("Failed to fetch community data:", err);
        onError("Failed to load community data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [community._id, onError]);

  const postCount = currentCommunity.postIDs.length;
  const memberCount = currentCommunity.members.length;
  const isMember =
    currentUser &&
    !currentUser.guest &&
    currentCommunity.members.includes(currentUser.displayName);

  const handleSortChange = (sortType) => {
    try {
      onSortChange && onSortChange(sortType);
    } catch (err) {
      console.error("Failed to sort posts:", err);
      const errorMsg =
        err.response?.data?.error || "Failed to sort posts. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  const handlePostClick = (postId) => {
    try {
      onPostClick && onPostClick(postId);
    } catch (err) {
      console.error("Failed to load post:", err);
      const errorMsg =
        err.response?.data?.error || "Failed to load post. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  const handleJoinLeave = async () => {
    setIsJoining(true);
    try {
      await axios.post(
        `/communities/${currentCommunity._id}/${isMember ? "leave" : "join"}`,
        { username: currentUser.displayName }
      );

      // Fetch fresh community data after join/leave
      const communityResponse = await axios.get(
        `/communities/${currentCommunity._id}`
      );

      // Add isMember flag to the community data
      const updatedCommunity = {
        ...communityResponse.data,
        isMember: !isMember, // Toggle the membership status
      };

      setCurrentCommunity(updatedCommunity);

      // Update the communities list in the parent component
      onCommunitiesUpdate((prev) =>
        prev.map((c) => (c._id === currentCommunity._id ? updatedCommunity : c))
      );
    } catch (err) {
      console.error("Failed to join/leave community:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to join/leave community. Please try again.";
      onError(errorMsg);
    } finally {
      setIsJoining(false);
    }
  };

  if (isLoading) {
    return <div></div>;
  }

  return (
    <div>
      <div id="community_header">
        <div id="community_header_top">
          <h2>{currentCommunity.name}</h2>
          <div id="community_sort_buttons">
            <button
              className="button_style button_hover sort_button"
              id="community_newest"
              onClick={() => handleSortChange("newest")}
            >
              Newest
            </button>
            <button
              className="button_style button_hover sort_button"
              id="community_oldest"
              onClick={() => handleSortChange("oldest")}
            >
              Oldest
            </button>
            <button
              className="button_style button_hover sort_button"
              id="community_active"
              onClick={() => handleSortChange("active")}
            >
              Active
            </button>
          </div>
        </div>
        <div id="community_description">{currentCommunity.description}</div>
        <div
          id="community_stats"
          style={{
            marginBottom: "10px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: "bold",
              color: "var(--dark-text-color)",
              marginRight: "15px",
            }}
          >
            <span className="community_stat_label">Posts:</span> {postCount}
          </span>
          <span
            style={{
              fontWeight: "bold",
              color: "var(--dark-text-color)",
              marginRight: "15px",
            }}
          >
            <span className="community_stat_label">Members:</span> {memberCount}
          </span>
          {currentUser && !currentUser.guest && (
            <button
              className="button_style button_hover"
              onClick={handleJoinLeave}
              disabled={isJoining}
              style={{ padding: "2px 10px" }}
            >
              {isJoining
                ? "Processing..."
                : isMember
                ? "Leave Community"
                : "Join Community"}
            </button>
          )}
        </div>
      </div>
      <div>
        {currentPosts.map((post) => {
          const viewString = post.views === 1 ? "View" : "Views";
          const commentCount = getCommentCount(post._id);
          const commentString = commentCount === 1 ? "Comment" : "Comments";
          const voteCount = post.upvoters.length - post.downvoters.length;
          const voteString = Math.abs(voteCount) === 1 ? "Vote" : "Votes";

          return (
            <div
              key={post._id}
              className="post"
              onClick={() => handlePostClick(post._id)}
              style={{ cursor: "pointer" }}
            >
              <div className="post_header">
                <span className="post_author">{post.postedBy}</span>
                <span className="cdot"> ⋅ </span>
                <span className="post_date">
                  {formatTimeDelta(post.postedDate)}
                </span>
              </div>
              <div className="post_title">{post.title}</div>
              <div className="post_linkflair">
                {post.linkFlairID ? getLinkFlairContent(post.linkFlairID) : ""}
              </div>
              <div
                className="post_content"
                dangerouslySetInnerHTML={{
                  __html:
                    post.content.length <= 80
                      ? parseHyperlinks(post.content)
                      : parseHyperlinks(post.content.substring(0, 80) + "..."),
                }}
              />
              <div className="post_footer">
                <span className="view_count">
                  {post.upvoters.length - post.downvoters.length}{" "}
                  {post.upvoters.length - post.downvoters.length === 1
                    ? "Vote"
                    : "Votes"}
                </span>
                <span className="view_count">
                  {post.views} {viewString}
                </span>
                <span className="comment_count">
                  {commentCount} {commentString}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityPage;
