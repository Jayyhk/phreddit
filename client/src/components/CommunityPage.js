import React, { useState } from "react";
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
  const postCount = community.postIDs.length;
  const memberCount = community.members.length;
  const isMember =
    currentUser &&
    !currentUser.guest &&
    community.members.includes(currentUser.displayName);

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
    if (!currentUser || currentUser.guest) return;

    setIsJoining(true);
    try {
      if (isMember) {
        await axios.post(`/communities/${community._id}/leave`);
        community.members = community.members.filter(
          (m) => m !== currentUser.displayName
        );
      } else {
        await axios.post(`/communities/${community._id}/join`);
        community.members.push(currentUser.displayName);
      }
      // Refresh communities list to update isMember flags
      const response = await axios.get("/communities");
      onCommunitiesUpdate(response.data);
    } catch (err) {
      console.error("Failed to join/leave community:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to join/leave community. Please try again.";
      onError(errorMsg);
      return;
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div>
      <div id="community_header">
        <div id="community_header_top">
          <h2 id="community_name">{community.name}</h2>
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
        <div
          id="community_description"
          dangerouslySetInnerHTML={{
            __html: parseHyperlinks(community.description),
          }}
        />
        <div id="community_date_created">
          Created by {community.creator} {formatTimeDelta(community.startDate)}
        </div>
        <div id="community_stats">
          <div
            className="community_stat"
            style={{ display: "flex", alignItems: "center" }}
          >
            <span className="community_stat_label">Posts:</span> {postCount}
          </div>
          <div
            className="community_stat"
            style={{ display: "flex", alignItems: "center" }}
          >
            <span className="community_stat_label">Members:</span> {memberCount}
            {currentUser && !currentUser.guest && (
              <button
                className="button_style button_hover"
                onClick={handleJoinLeave}
                disabled={isJoining}
                style={{ marginLeft: "20px" }}
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
      </div>
      <div id="community_posts">
        {posts.map((post) => {
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
                <span className="vote-count">
                  {voteCount} {voteString}
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
