import React, { useState, useEffect } from "react";
import { validateHyperlinks } from "./Helpers";

const EditPostPage = ({
  post,
  communities,
  linkFlairs,
  currentUser,
  onSubmit,
  onDeletePost,
  onError,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCommunityID, setSelectedCommunityID] = useState("");
  const [selectedLinkFlairID, setSelectedLinkFlairID] = useState("");
  const [newLinkFlair, setNewLinkFlair] = useState("");
  const [showPlaceholders, setShowPlaceholders] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    content: "",
    community: "",
    linkFlair: "",
  });

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setContent(post.content);
      // Find the community ID from the communities list
      const community = communities.find((c) => c.postIDs.includes(post._id));
      if (community) {
        setSelectedCommunityID(community._id);
      }
      setSelectedLinkFlairID(post.linkFlairID || "");
      setShowPlaceholders(true);
    }
  }, [post, communities]);

  // Sort communities to show joined ones first
  const sortedCommunities = [...communities].sort((a, b) => {
    const aIsMember = a.members.includes(currentUser.displayName);
    const bIsMember = b.members.includes(currentUser.displayName);
    if (aIsMember && !bIsMember) return -1;
    if (!aIsMember && bIsMember) return 1;
    return a.name.localeCompare(b.name);
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      title: "",
      content: "",
      community: "",
      linkFlair: "",
    };

    if (title.trim() === "") {
      newErrors.title = "Post title is required.";
      valid = false;
    } else if (title.trim().length > 100) {
      newErrors.title = "Post title must be 100 characters or less.";
      valid = false;
    }

    if (content.trim() === "") {
      newErrors.content = "Post content is required.";
      valid = false;
    } else {
      const linkError = validateHyperlinks(content);
      if (linkError) {
        newErrors.content = linkError;
        valid = false;
      }
    }

    if (!selectedCommunityID) {
      newErrors.community = "Community is required.";
      valid = false;
    }

    if (selectedLinkFlairID && newLinkFlair.trim() !== "") {
      newErrors.linkFlair = "At most one link flair can be applied to a post.";
      valid = false;
    }

    if (newLinkFlair.trim() !== "" && newLinkFlair.trim().length > 30) {
      newErrors.linkFlair = "Link flair must be 30 characters or less.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (onSubmit) {
        const success = await onSubmit({
          _id: post._id,
          title: title.trim(),
          content: content.trim(),
          communityID: selectedCommunityID,
          linkFlairID: selectedLinkFlairID || null,
          newLinkFlair: newLinkFlair.trim() || null,
        });

        if (!success) {
          onError("Failed to update post. Please try again.");
        }
      }
    } catch (err) {
      console.error("Failed to update post:", err);
      const errorMsg =
        err.response?.data?.error || "Failed to update post. Please try again.";
      onError(errorMsg);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    try {
      await onDeletePost(post._id);
    } catch (err) {
      onError("Failed to delete post. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div id="create_post_page">
      <div id="create_post_header">Edit Post</div>
      <div id="choose_community_container">
        <div id="choose_community">Choose Community (required)</div>
        <select
          id="choose_community_input"
          value={selectedCommunityID}
          onChange={(e) => setSelectedCommunityID(e.target.value)}
          required
        >
          <option value="">Choose a Community...</option>
          {sortedCommunities.map((community) => (
            <option key={community._id} value={community._id}>
              {community.name}
            </option>
          ))}
        </select>
        {errors.community && (
          <div className="create_post_error">{errors.community}</div>
        )}
      </div>
      <div id="create_post_title_container">
        <div id="create_post_title">Title (required)</div>
        <input
          id="create_post_title_input"
          type="text"
          placeholder={
            showPlaceholders ? "Enter Post Title (Max 100 characters)" : ""
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        {errors.title && (
          <div className="create_post_error">{errors.title}</div>
        )}
      </div>
      <div id="create_post_linkflair_container">
        <div id="choose_linkflair_container">
          <div id="choose_linkflair">Choose Link Flair (optional)</div>
          <select
            id="choose_linkflair_input"
            value={selectedLinkFlairID}
            onChange={(e) => setSelectedLinkFlairID(e.target.value)}
          >
            <option value="">Choose a Link Flair...</option>
            {linkFlairs.map((lf) => (
              <option key={lf._id} value={lf._id}>
                {lf.content}
              </option>
            ))}
          </select>
        </div>
        <input
          id="linkflair_input"
          type="text"
          placeholder={
            showPlaceholders ? "Enter Link Flair (Max 30 characters)" : ""
          }
          value={newLinkFlair}
          onChange={(e) => setNewLinkFlair(e.target.value)}
        />
        {errors.linkFlair && (
          <div className="create_post_error">{errors.linkFlair}</div>
        )}
      </div>
      <div id="create_post_content_container">
        <div id="create_post_content">Post Content (required)</div>
        <input
          id="create_post_content_input"
          type="text"
          placeholder={showPlaceholders ? "Enter Post Content" : ""}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        {errors.content && (
          <div className="create_post_error">{errors.content}</div>
        )}
      </div>
      <div
        style={{ display: "flex", gap: "10px", justifyContent: "flex-start" }}
      >
        <button
          className="button_style button_hover"
          id="submit_post"
          onClick={handleSubmit}
        >
          Update Post
        </button>
        <button
          className="button_style button_hover"
          id="delete_post"
          onClick={handleDelete}
        >
          Delete Post
        </button>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-dialog">
          <div className="dialog-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this post? This action cannot be
              undone.
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

export default EditPostPage;
