import React, { useState } from "react";
import { validateHyperlinks } from "./Helpers";

const CreatePostPage = ({ communities, linkFlairs, onSubmit, currentUser }) => {
  const [communityID, setCommunityID] = useState("");
  const [title, setTitle] = useState("");
  const [selectedLinkFlairID, setSelectedLinkFlairID] = useState("");
  const [linkFlairInput, setLinkFlairInput] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState({
    community: "",
    title: "",
    linkFlair: "",
    content: "",
  });

  // Sort communities to show joined ones first
  const sortedCommunities = [...communities].sort((a, b) => {
    const aIsMember = a.members.includes(currentUser.displayName);
    const bIsMember = b.members.includes(currentUser.displayName);
    if (aIsMember && !bIsMember) return -1;
    if (!aIsMember && bIsMember) return 1;
    return a.name.localeCompare(b.name);
  });

  const handleSubmit = () => {
    let valid = true;
    const newErrors = {
      community: "",
      title: "",
      linkFlair: "",
      content: "",
    };

    if (!communityID) {
      newErrors.community = "Community is required.";
      valid = false;
    }
    if (title.trim() === "") {
      newErrors.title = "Post title is required.";
      valid = false;
    } else if (title.trim().length > 100) {
      newErrors.title = "Post title must be 100 characters or less.";
      valid = false;
    }
    if (selectedLinkFlairID && linkFlairInput.trim() !== "") {
      newErrors.linkFlair = "At most one link flair can be applied to a post.";
      valid = false;
    }
    if (linkFlairInput.trim() !== "" && linkFlairInput.trim().length > 30) {
      newErrors.linkFlair = "Link flair must be 30 characters or less.";
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

    setErrors(newErrors);
    if (!valid) return;

    if (onSubmit) {
      onSubmit({
        communityID,
        title: title.trim(),
        content: content.trim(),
        postedBy: currentUser.displayName,
        selectedLinkFlairID: selectedLinkFlairID || null,
        newLinkFlair: linkFlairInput.trim() || null,
      });
    }
  };

  return (
    <div id="create_post_page">
      <div id="create_post_header">Create New Post</div>
      <div id="choose_community_container">
        <div id="choose_community">Choose Community (required)</div>
        <select
          id="choose_community_input"
          value={communityID}
          onChange={(e) => setCommunityID(e.target.value)}
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
          placeholder="Enter Post Title (Max 100 characters)"
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
          placeholder="Enter Link Flair (Max 30 characters)"
          value={linkFlairInput}
          onChange={(e) => setLinkFlairInput(e.target.value)}
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
          placeholder="Enter Post Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        {errors.content && (
          <div className="create_post_error">{errors.content}</div>
        )}
      </div>
      <button
        className="button_style button_hover"
        id="submit_post"
        onClick={handleSubmit}
      >
        Submit Post
      </button>
    </div>
  );
};

export default CreatePostPage;
