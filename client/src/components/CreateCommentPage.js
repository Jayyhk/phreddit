import React, { useState } from "react";
import { validateHyperlinks } from "./Helpers";

const CreateCommentPage = ({ onSubmit, currentUser, onError }) => {
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({ content: "" });

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
          content: content.trim(),
          commentedBy: currentUser.displayName,
        });
      }
    } catch (err) {
      console.error("Failed to submit comment:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to submit comment. Please try again.";
      onError(errorMsg);
      return;
    }
  };

  return (
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
      <div style={{ marginTop: "20px" }}>
        <button
          className="button_style button_hover"
          id="post_comment"
          onClick={handleSubmit}
        >
          Submit Comment
        </button>
      </div>
    </div>
  );
};

export default CreateCommentPage;
