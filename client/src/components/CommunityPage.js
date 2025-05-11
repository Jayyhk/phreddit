import React, { useState } from "react";
import { formatTimeDelta, parseHyperlinks } from "./Helpers";

const CommunityPage = ({
  community,
  posts,
  onPostClick,
  onSortChange,
  getCommentCount,
  getLinkFlairContent,
  onError,
}) => {
  const [error, setError] = useState("");
  const postCount = community.postIDs.length;
  const memberCount = community.members.length;

  const handleSortChange = (sortType) => {
    try {
      onSortChange && onSortChange(sortType);
      setError("");
    } catch (err) {
      setError("Failed to sort posts. Please try again.");
      onError();
    }
  };

  const handlePostClick = (postId) => {
    try {
      onPostClick && onPostClick(postId);
      setError("");
    } catch (err) {
      setError("Failed to load post. Please try again.");
      onError();
    }
  };

  return (
    <div>
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
          <div className="community_stat">
            <span className="community_stat_label">Posts:</span> {postCount}
          </div>
          <div className="community_stat">
            <span className="community_stat_label">Members:</span> {memberCount}
          </div>
        </div>
      </div>
      <div id="community_posts">
        {posts.map((post) => {
          const viewString = post.views === 1 ? "View" : "Views";
          const commentCount = getCommentCount(post._id);
          const commentString = commentCount === 1 ? "Comment" : "Comments";

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
