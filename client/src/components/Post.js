import React, { useState, useEffect } from "react";
import { formatTimeDelta, parseHyperlinks } from "./Helpers";
import axios from "axios";
import ReputationErrorBanner from "./ReputationErrorBanner";

const nestComments = (flatComments, commentIDs) => {
  return commentIDs
    .map((id) => {
      const comment = flatComments.find(
        (c) => c._id.toString() === id.toString()
      );
      if (!comment) return null;
      return {
        ...comment,
        replies: nestComments(flatComments, comment.commentIDs),
      };
    })
    .filter((c) => c !== null);
};

const Comment = ({ comment, onReply, isGuest, onVote, currentUser }) => {
  const voteCount =
    (comment.upvoters?.length || 0) - (comment.downvoters?.length || 0);
  const voteLabel = Math.abs(voteCount) === 1 ? "Vote" : "Votes";
  const hasUpvoted = comment.upvoters?.includes(currentUser?.displayName);
  const hasDownvoted = comment.downvoters?.includes(currentUser?.displayName);

  return (
    <div className="comment_container">
      <div className="comment_container_header">
        <span className="comment_author">{comment.commentedBy}</span>
        <span className="cdot"> ⋅ </span>
        <span className="comment_date">
          {formatTimeDelta(comment.commentedDate)}
        </span>
        <span className="cdot"> ⋅ </span>
        <div
          className="vote-section"
          style={{
            display: "inline-flex",
            alignItems: "center",
          }}
        >
          {!isGuest && (
            <>
              <button
                onClick={() => onVote(comment._id, "upvote")}
                style={{
                  color: hasUpvoted
                    ? "var(--reddit-color)"
                    : "var(--dark-text-color)",
                  fontSize: "12px",
                  padding: "0 2px",
                }}
                className="vote-button"
              >
                ▲
              </button>
            </>
          )}
          <span className="comment_date" style={{ margin: "0 5px" }}>
            {voteCount} {voteLabel}
          </span>
          {!isGuest && (
            <button
              onClick={() => onVote(comment._id, "downvote")}
              style={{
                color: hasDownvoted ? "#0079d3" : "var(--dark-text-color)",
                fontSize: "12px",
                padding: "0 2px",
              }}
              className="vote-button"
            >
              ▼
            </button>
          )}
        </div>
      </div>
      <div
        className="comment_content"
        dangerouslySetInnerHTML={{ __html: parseHyperlinks(comment.content) }}
      ></div>
      {!isGuest && (
        <button
          className="reply"
          onClick={() => onReply && onReply(comment._id)}
          style={{ cursor: "pointer" }}
        >
          Reply
        </button>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies" style={{ marginLeft: "30px" }}>
          {comment.replies.map((reply) => (
            <Comment
              key={reply._id}
              comment={reply}
              onReply={onReply}
              isGuest={isGuest}
              onVote={onVote}
              currentUser={currentUser}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Post = ({
  post,
  community,
  comments,
  onAddComment,
  onReply,
  getLinkFlairContent,
  isGuest,
  onError,
  currentUser,
}) => {
  const [currentPost, setCurrentPost] = useState(post);
  const [currentComments, setCurrentComments] = useState(comments);
  const [currentCommunity, setCurrentCommunity] = useState(community);
  const [isLoading, setIsLoading] = useState(true);
  const [reputationError, setReputationError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch fresh post data
        const postResponse = await axios.get(`/posts/${post._id}`);
        setCurrentPost(postResponse.data);

        // Fetch fresh comments
        const commentsResponse = await axios.get(
          `/posts/${post._id}/comments/all`
        );
        setCurrentComments(commentsResponse.data);

        // Fetch fresh community data
        const communityResponse = await axios.get(
          `/communities/${community._id}`
        );
        setCurrentCommunity(communityResponse.data);
      } catch (err) {
        console.error("Failed to fetch post data:", err);
        onError("Failed to load post data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [post._id, community._id, onError]);

  // Add effect to clear reputation error after 3 seconds
  useEffect(() => {
    if (reputationError) {
      const timer = setTimeout(() => {
        setReputationError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reputationError]);

  const handleVote = async (id, type) => {
    if (!currentUser) {
      onError("You must be logged in to vote");
      return;
    }
    try {
      const response = await axios.post(`/posts/${id}/${type}`, {
        username: currentUser.displayName,
      });
      setCurrentPost(response.data);
      setReputationError("");
    } catch (err) {
      console.error("Failed to vote:", err);
      const errorMsg =
        err.response?.data?.error || "Failed to vote. Please try again.";
      if (errorMsg.includes("Insufficient reputation")) {
        setReputationError("You need at least 50 reputation points to vote");
      } else {
        onError(errorMsg);
      }
    }
  };

  const handleCommentVote = async (id, type) => {
    if (!currentUser) {
      onError("You must be logged in to vote");
      return;
    }
    try {
      const response = await axios.post(`/comments/${id}/${type}`, {
        username: currentUser.displayName,
      });
      setCurrentComments((prev) =>
        prev.map((c) => (c._id === id ? response.data : c))
      );
      setReputationError("");
    } catch (err) {
      console.error("Failed to vote on comment:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to vote on comment. Please try again.";
      if (errorMsg.includes("Insufficient reputation")) {
        setReputationError("You need at least 50 reputation points to vote");
      } else {
        onError(errorMsg);
      }
    }
  };

  if (isLoading) {
    return <div></div>;
  }

  if (!currentPost) {
    onError("Post not found");
    return null;
  }

  if (!currentCommunity) {
    onError("Community not found");
    return null;
  }

  const viewString = currentPost.views === 1 ? "View" : "Views";
  const commentCount = currentComments.length;
  const commentString = commentCount === 1 ? "Comment" : "Comments";
  const nestedComments = nestComments(currentComments, currentPost.commentIDs);
  const hasUpvoted = currentPost.upvoters.includes(currentUser?.displayName);
  const hasDownvoted = currentPost.downvoters.includes(
    currentUser?.displayName
  );

  return (
    <div>
      <ReputationErrorBanner error={reputationError} />
      <div id="postpage_header">
        <div id="postpage_headertop">
          <span id="postpage_community">
            {currentCommunity ? currentCommunity.name : "Unknown Community"}
          </span>
          <span className="cdot"> ⋅ </span>
          <span id="postpage_date">
            {formatTimeDelta(currentPost.postedDate)}
          </span>
        </div>
        <div id="postpage_author">Posted by: {currentPost.postedBy}</div>
        <div id="postpage_title">{currentPost.title}</div>
        <div id="postpage_linkflair">
          {currentPost.linkFlairID
            ? getLinkFlairContent(currentPost.linkFlairID)
            : ""}
        </div>
        <div
          id="postpage_content"
          dangerouslySetInnerHTML={{
            __html: parseHyperlinks(currentPost.content),
          }}
        ></div>
        <div id="postpage_footer">
          <div className="vote-section">
            {!isGuest && (
              <button
                onClick={() => handleVote(currentPost._id, "upvote")}
                style={{
                  color: hasUpvoted ? "var(--reddit-color)" : "inherit",
                }}
                className="vote-button"
              >
                ▲
              </button>
            )}
            <span className="view_count">
              {currentPost.upvoters.length - currentPost.downvoters.length}{" "}
              {Math.abs(
                currentPost.upvoters.length - currentPost.downvoters.length
              ) === 1
                ? "Vote"
                : "Votes"}
            </span>
            {!isGuest && (
              <button
                onClick={() => handleVote(currentPost._id, "downvote")}
                style={{
                  color: hasDownvoted ? "#0079d3" : "inherit",
                }}
                className="vote-button"
              >
                ▼
              </button>
            )}
          </div>
          <span className="view_count">
            {currentPost.views} {viewString}
          </span>
          <span className="comment_count">
            {currentPost.commentIDs?.length > 0
              ? commentCount > 0 && `${commentCount} ${commentString}`
              : `0 ${commentString}`}
          </span>
          {!isGuest && (
            <button
              className="button_style button_hover"
              style={{ marginLeft: "20px", padding: "2px 10px" }}
              onClick={() => onAddComment && onAddComment(currentPost._id)}
            >
              Add Comment
            </button>
          )}
        </div>
      </div>
      <div id="comment_section">
        {nestedComments.map((comment) => (
          <Comment
            key={comment._id}
            comment={comment}
            onReply={onReply}
            isGuest={isGuest}
            onVote={handleCommentVote}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
};

export default Post;
