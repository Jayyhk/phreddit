import React from "react";
import { formatTimeDelta, parseHyperlinks } from "./Helpers";

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

const Comment = ({ comment, onReply }) => {
  return (
    <div className="comment_container">
      <div className="comment_container_header">
        <span className="comment_author">{comment.commentedBy}</span>
        <span className="cdot"> ⋅ </span>
        <span className="comment_date">
          {formatTimeDelta(comment.commentedDate)}
        </span>
      </div>
      <div
        className="comment_content"
        dangerouslySetInnerHTML={{ __html: parseHyperlinks(comment.content) }}
      ></div>
      <button
        className="reply"
        onClick={() => onReply && onReply(comment._id)}
        style={{ cursor: "pointer" }}
      >
        Reply
      </button>
      {comment.replies && comment.replies.length > 0 && (
        <div className="replies" style={{ marginLeft: "30px" }}>
          {comment.replies.map((reply) => (
            <Comment key={reply._id} comment={reply} onReply={onReply} />
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
}) => {
  const viewString = post.views === 1 ? "View" : "Views";
  const commentCount = comments.length;
  const commentString = commentCount === 1 ? "Comment" : "Comments";
  const nestedComments = nestComments(comments, post.commentIDs);

  return (
    <div>
      <div id="postpage_header">
        <div id="postpage_headertop">
          <span id="postpage_community">
            {community ? community.name : "Unknown Community"}
          </span>
          <span className="cdot"> ⋅ </span>
          <span id="postpage_date">{formatTimeDelta(post.postedDate)}</span>
        </div>
        <div id="postpage_author">Posted by: {post.postedBy}</div>
        <div id="postpage_title">{post.title}</div>
        <div id="postpage_linkflair">
          {post.linkFlairID ? getLinkFlairContent(post.linkFlairID) : ""}
        </div>
        <div
          id="postpage_content"
          dangerouslySetInnerHTML={{ __html: parseHyperlinks(post.content) }}
        ></div>
        <div id="postpage_footer">
          <span className="view_count">
            {post.views} {viewString}
          </span>
          <span className="comment_count">
            {commentCount} {commentString}
          </span>
        </div>
        <button
          className="button_style button_hover"
          id="comment_adder"
          onClick={() => onAddComment && onAddComment(post._id)}
        >
          Add a Comment
        </button>
      </div>
      <div id="comment_section">
        {nestedComments &&
          nestedComments.length > 0 &&
          nestedComments.map((comment) => (
            <Comment key={comment._id} comment={comment} onReply={onReply} />
          ))}
      </div>
    </div>
  );
};

export default Post;
