import React, { useState, useEffect } from "react";
import { validateHyperlinks } from "./Helpers";

const EditCommentPage = ({
  comment,
  onSubmit,
  currentUser,
  onError,
  onDeleteComment,
}) => {
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({ content: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (comment) {
      setContent(comment.content);
    }
  }, [comment]);

  const handleSubmit = () => {
    let valid = true;
    const newErrors = { content: "" };

    if (content.trim() === "") {
      newErrors.content = "Comment content is required.";
      valid = false;
    } else if (content.trim().length > 500) {
      newErrors.content = "Comment content must not exceed 500 characters.";
      valid = false;
    } else {
      const linkError = validateHyperlinks(content);
      if (linkError) {
        newErrors.content = linkError;
        valid = false;
      }
    }

    setErrors(newErrors);
    if (!valid) return;

    try {
      if (onSubmit) {
        onSubmit({
          _id: comment._id,
          content: content.trim(),
          commentedBy: currentUser.displayName,
        });
      }
    } catch (err) {
      console.error("Failed to update comment:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to update comment. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      if (onDeleteComment) {
        await onDeleteComment(comment._id);
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to delete comment. Please try again.";
      onError(errorMsg);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="create-comment-container">
      <h1
        style={{ fontSize: "24px", color: "#FF4500" }}
        className="create-comment-header"
      >
        Edit Comment
      </h1>
      <div id="create_comment_page">
        <div id="create_comment_content_container">
          <div id="create_comment_content">Comment Content (required)</div>
          <input
            id="create_comment_content_input"
            type="text"
            placeholder="Enter Comment Content (Max 500 characters)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          {errors.content && (
            <div className="create_comment_error">{errors.content}</div>
          )}
        </div>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            gap: "10px",
            justifyContent: "flex-start",
          }}
        >
          <button
            className="button_style button_hover"
            id="update_comment"
            onClick={handleSubmit}
          >
            Update Comment
          </button>
          <button
            className="button_style button_hover"
            id="delete_comment"
            onClick={handleDelete}
          >
            Delete Comment
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-dialog">
            <div className="dialog-content">
              <h3>Confirm Delete</h3>
              <p>
                Are you sure you want to delete this comment? This action cannot
                be undone.
              </p>
              <div className="dialog-buttons">
                <button onClick={confirmDelete}>Delete</button>
                <button onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditCommentPage;
