import React, { useState } from "react";
import { validateHyperlinks } from "./Helpers";

const CreateCommunityPage = ({
  onEngender,
  currentUser,
  communities,
  onError,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    description: "",
  });

  const validateForm = () => {
    const newErrors = { name: "", description: "" };
    let hasErrors = false;

    // Validate name
    if (name.trim() === "") {
      newErrors.name = "Community name is required.";
      hasErrors = true;
    } else if (name.length > 100) {
      newErrors.name = "Community name must be 100 characters or less.";
      hasErrors = true;
    } else if (
      communities.some(
        (c) => c.name.toLowerCase() === name.trim().toLowerCase()
      )
    ) {
      newErrors.name =
        "A community with this name already exists. Please choose a different name.";
      hasErrors = true;
    }

    // Validate description
    if (description.trim() === "") {
      newErrors.description = "Community description is required.";
      hasErrors = true;
    } else if (description.length > 500) {
      newErrors.description =
        "Community description must be 500 characters or less.";
      hasErrors = true;
    } else {
      const linkError = validateHyperlinks(description);
      if (linkError) {
        newErrors.description = linkError;
        hasErrors = true;
      }
    }

    setErrors(newErrors);
    return !hasErrors;
  };

  const handleSubmit = async () => {
    // Validate all fields first
    if (!validateForm()) {
      return;
    }

    try {
      // Try to create community
      if (onEngender) {
        const success = await onEngender({
          name: name.trim(),
          description: description.trim(),
          members: [currentUser.displayName],
        });

        // If API call failed, show generic error
        if (!success) {
          const errorMsg = "Failed to create community. Please try again.";
          onError(errorMsg);
          return;
        }
      }
    } catch (err) {
      console.error("Failed to create community:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to create community. Please try again.";
      onError(errorMsg);
      return;
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
          onChange={(e) => {
            setName(e.target.value);
            // Clear name error when user starts typing
            if (errors.name) {
              setErrors((prev) => ({ ...prev, name: "" }));
            }
          }}
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
          onChange={(e) => {
            setDescription(e.target.value);
            // Clear description error when user starts typing
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: "" }));
            }
          }}
          required
        />
        {errors.description && (
          <div className="create_community_error">{errors.description}</div>
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
