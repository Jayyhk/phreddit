import React, { useState, useEffect } from "react";
import { validateHyperlinks } from "./Helpers";
import axios from "axios";

const EditCommunityPage = ({
  community,
  communities,
  onEngender,
  onDeleteCommunity,
  onError,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (community) {
      setName(community.name);
      setDescription(community.description);
      // Show placeholders immediately for empty fields when editing
      setShowPlaceholders(true);
    }
  }, [community]);

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await onDeleteCommunity(community._id);
    } catch (err) {
      onError("Failed to delete community. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const validateForm = () => {
    const newErrors = { name: "", description: "" };
    let hasErrors = false;

    if (name.trim() === "") {
      newErrors.name = "Community name is required.";
      hasErrors = true;
    } else if (name.length > 100) {
      newErrors.name = "Community name must be 100 characters or less.";
      hasErrors = true;
    } else {
      // Check if the new name conflicts with any existing community (excluding current community)
      const nameExists = communities.some(
        (c) =>
          c.name.toLowerCase() === name.trim().toLowerCase() &&
          c._id !== community._id
      );
      if (nameExists) {
        newErrors.name = "Community name already taken.";
        hasErrors = true;
      }
    }

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
    if (!validateForm()) {
      return;
    }

    try {
      if (onEngender) {
        await onEngender({
          _id: community._id,
          name: name.trim(),
          description: description.trim(),
        });
      }
    } catch (err) {
      console.error("Failed to update community:", err);
      const errorMsg =
        err.response?.data?.error ||
        "Failed to update community. Please try again.";
      onError(errorMsg);
    }
  };

  return (
    <div id="create_community_page">
      <div id="create_community_header">Edit Community</div>
      <div id="create_community_name_container">
        <div id="create_community_name">Community Name (required)</div>
        <input
          id="create_community_name_input"
          type="text"
          placeholder={
            showPlaceholders ? "Enter Community Name (Max 100 characters)" : ""
          }
          value={name}
          onChange={(e) => {
            setName(e.target.value);
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
          placeholder={
            showPlaceholders
              ? "Enter Community Description (Max 500 characters)"
              : ""
          }
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
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
      <div
        style={{ display: "flex", gap: "10px", justifyContent: "flex-start" }}
      >
        <button
          className="button_style button_hover"
          id="engender"
          onClick={handleSubmit}
        >
          Update Community
        </button>
        <button
          className="button_style button_hover"
          id="delete_community"
          onClick={handleDelete}
        >
          Delete Community
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-dialog">
          <div className="dialog-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this community? This action cannot
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
  );
};

export default EditCommunityPage;
