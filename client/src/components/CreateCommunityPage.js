import React, { useState } from "react";
import { validateHyperlinks } from "./Helpers";

const CreateCommunityPage = ({ onEngender }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [username, setUsername] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    description: "",
    username: "",
  });

  const handleSubmit = () => {
    let valid = true;
    const newErrors = { name: "", description: "", username: "" };

    if (name.trim() === "") {
      newErrors.name = "Community name is required.";
      valid = false;
    } else if (name.length > 100) {
      newErrors.name = "Community name must be 100 characters or less.";
      valid = false;
    }

    if (description.trim() === "") {
      newErrors.description = "Community description is required.";
      valid = false;
    } else if (description.length > 500) {
      newErrors.description =
        "Community description must be 500 characters or less.";
      valid = false;
    } else {
      const linkError = validateHyperlinks(description);
      if (linkError) {
        newErrors.description = linkError;
        valid = false;
      }
    }

    if (username.trim() === "") {
      newErrors.username = "Creator username is required.";
      valid = false;
    }

    setErrors(newErrors);
    if (!valid) return;

    if (onEngender) {
      onEngender({
        name: name.trim(),
        description: description.trim(),
        // postIDs: [], // set by DB
        // startDate: new Date(), // set by DB
        members: [username.trim()],
      });
    }
  };

  return (
    <div id="create_community_page">
      <div id="create_community_header">Create a New Community</div>
      <div id="create_community_name_container">
        <div id="create_community_name">Community Name (required)</div>
        <input
          id="create_community_name_input"
          type="text"
          placeholder="Enter Community Name (Max 100 characters)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {errors.name && (
          <div className="create_community_error">{errors.name}</div>
        )}
      </div>
      <div id="create_community_description_container">
        <div id="create_community_description">
          Community Description (required)
        </div>
        <input
          id="create_community_description_input"
          type="text"
          placeholder="Enter Community Description (Max 500 characters)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        {errors.description && (
          <div className="create_community_error">{errors.description}</div>
        )}
      </div>
      <div id="create_community_username_container">
        <div id="create_community_username">Creator Username (required)</div>
        <input
          id="create_community_username_input"
          type="text"
          placeholder="Enter Creator Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {errors.username && (
          <div className="create_community_error">{errors.username}</div>
        )}
      </div>
      <button
        className="button_style button_hover"
        id="engender"
        onClick={handleSubmit}
      >
        Engender Community
      </button>
    </div>
  );
};

export default CreateCommunityPage;
