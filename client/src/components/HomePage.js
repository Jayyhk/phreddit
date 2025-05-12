import React, { useState, useEffect } from "react";
import { formatTimeDelta, parseHyperlinks } from "./Helpers";

const HomePage = ({
  posts,
  communities,
  onPostClick,
  onSortChange,
  getCommentCount,
  getLinkFlairContent,
  searchQuery,
  currentUser,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, [posts, communities]);

  const postCount = posts.length;
  const postsLabel = postCount === 1 ? "Post" : "Posts";
  const resultsLabel = postCount === 1 ? "result" : "results";

  // Sort posts into user's communities and other communities
  const userCommunities = communities.filter((c) => c.isMember);
  const userCommunityIds = userCommunities.map((c) => c._id);

  const userCommunityPosts = posts.filter((post) => {
    const community = communities.find((c) => c.postIDs.includes(post._id));
    return community && userCommunityIds.includes(community._id);
  });

  const otherPosts = posts.filter((post) => {
    const community = communities.find((c) => c.postIDs.includes(post._id));
    return !community || !userCommunityIds.includes(community._id);
  });

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

  const renderPost = (post) => {
    const community = communities.find((c) => c.postIDs.includes(post._id));
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
          <span className="post_community">
            {community ? community.name : "Unknown Community"}
          </span>
          <span className="cdot"> ⋅ </span>
          <span className="post_author">{post.postedBy}</span>
          <span className="cdot"> ⋅ </span>
          <span className="post_date">{formatTimeDelta(post.postedDate)}</span>
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
  };

  if (isLoading) {
    return <div></div>;
  }

  return (
    <div>
      <div id="home_header">
        <div id="home_header_top">
          <h2>
            {searchQuery
              ? postCount > 0
                ? `Results for: ${searchQuery}`
                : `No results found for: ${searchQuery}`
              : "All Posts"}
          </h2>
          <div id="home_sort_buttons">
            <button
              className="button_style button_hover sort_button"
              id="home_newest"
              onClick={() => handleSortChange("newest")}
            >
              Newest
            </button>
            <button
              className="button_style button_hover sort_button"
              id="home_oldest"
              onClick={() => handleSortChange("oldest")}
            >
              Oldest
            </button>
            <button
              className="button_style button_hover sort_button"
              id="home_active"
              onClick={() => handleSortChange("active")}
            >
              Active
            </button>
          </div>
        </div>
        <div id="x_posts">
          {searchQuery
            ? `${postCount} ${resultsLabel}`
            : `${postCount} ${postsLabel}`}
        </div>
      </div>
      <div>
        {!searchQuery &&
          !currentUser?.guest &&
          userCommunityPosts.length > 0 && (
            <div className="posts-section">
              <h3 className="section-header">Joined Communities</h3>
              {userCommunityPosts.map(renderPost)}
            </div>
          )}
        {!searchQuery && !currentUser?.guest && otherPosts.length > 0 && (
          <div className="posts-section">
            <h3 className="section-header">Other Communities</h3>
            {otherPosts.map(renderPost)}
          </div>
        )}
        {!searchQuery && currentUser?.guest && (
          <div className="posts-section">{posts.map(renderPost)}</div>
        )}
        {searchQuery && (
          <>
            {!currentUser?.guest && (
              <>
                <div className="posts-section">
                  <h3 className="section-header">Joined Communities</h3>
                  {userCommunityPosts.length > 0 ? (
                    userCommunityPosts.map(renderPost)
                  ) : (
                    <div className="no-posts">
                      No posts from your joined communities.
                    </div>
                  )}
                </div>
                <div className="posts-section">
                  <h3 className="section-header">Other Communities</h3>
                  {otherPosts.length > 0 ? (
                    otherPosts.map(renderPost)
                  ) : (
                    <div className="no-posts">
                      No posts from other communities.
                    </div>
                  )}
                </div>
              </>
            )}
            {currentUser?.guest && (
              <div className="posts-section">{posts.map(renderPost)}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
