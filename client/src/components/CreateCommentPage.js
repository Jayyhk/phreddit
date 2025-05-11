import React, { useState } from "react";
import { validateHyperlinks } from "./Helpers";

const CreateCommentPage = ({ onSubmit }) => {
  const [content, setContent] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({ content: "", username: "" });

  const handleSubmit = () => {
    let valid = true;
    const newErrors = { content: "", username: "" };

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

    if (username.trim() === "") {
      newErrors.username = "Creator username is required.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    if (onSubmit) {
      onSubmit({
        content: content.trim(),
        // commentIDs: [], // set by DB
        commentedBy: username.trim(),
        // commentedDate: new Date(), // set by DB
      });
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
      <div id="create_comment_username_container">
        <div id="create_comment_username">Creator Username (required)</div>
        <input
          id="create_comment_username_input"
          type="text"
          placeholder="Enter Creator Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {errors.username && (
          <div className="create_comment_error">{errors.username}</div>
        )}
      </div>
      <button
        className="button_style button_hover"
        id="post_comment"
        onClick={handleSubmit}
      >
        Submit Comment
      </button>
    </div>
  );
};

export default CreateCommentPage;
