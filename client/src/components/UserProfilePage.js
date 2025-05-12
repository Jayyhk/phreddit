import React, { useState, useEffect } from "react";
import axios from "axios";

const UserProfilePage = ({
  currentUser,
  onError,
  onEditCommunity,
  onEditPost,
  onEditComment,
  onCommunitiesUpdate,
  onPostsUpdate,
}) => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("posts");
  const [userCommunities, setUserCommunities] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (!currentUser || !currentUser.displayName) {
          console.error("Current user data:", currentUser);
          onError("Please log in to view your profile");
          return;
        }

        // First verify the session is valid
        try {
          const sessionCheck = await axios.get("/me");
          if (!sessionCheck.data.user) {
            console.error("No valid session found");
            onError("Your session has expired. Please log in again.");
            return;
          }
        } catch (err) {
          console.error("Session check failed:", err);
          onError("Your session has expired. Please log in again.");
          return;
        }

        const response = await axios.get(
          `/users/${encodeURIComponent(currentUser.displayName)}`
        );
        setUserData(response.data);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        if (err.response?.status === 401) {
          onError("Please log in to view your profile");
        } else if (err.response?.status === 403) {
          onError("You can only view your own profile");
        } else if (err.response?.status === 404) {
          onError("User profile not found");
        } else {
          onError(
            err.response?.data?.error ||
              "Failed to load user data. Please try again."
          );
        }
      }
    };

    const fetchUserContent = async () => {
      try {
        if (!currentUser || !currentUser.displayName) {
          return;
        }

        const [communitiesRes, postsRes, commentsRes] = await Promise.all([
          axios.get(
            `/users/${encodeURIComponent(currentUser.displayName)}/communities`
          ),
          axios.get(
            `/users/${encodeURIComponent(currentUser.displayName)}/posts`
          ),
          axios.get(
            `/users/${encodeURIComponent(currentUser.displayName)}/comments`
          ),
        ]);
        setUserCommunities(communitiesRes.data);
        setUserPosts(postsRes.data);
        setUserComments(commentsRes.data);
      } catch (err) {
        console.error("Failed to fetch user content:", err);
        if (err.response?.status === 401) {
          onError("Please log in to view your profile");
        } else if (err.response?.status === 403) {
          onError("You can only view your own content");
        } else if (err.response?.status === 404) {
          onError("User content not found");
        } else {
          onError(
            err.response?.data?.error ||
              "Failed to load user content. Please try again."
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
    fetchUserContent();
  }, [currentUser, onError]);

  const handleDelete = (type, id) => {
    setItemToDelete({ type, id });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === "community") {
        await axios.delete(`/communities/${itemToDelete.id}`);
        // Update local state to remove the deleted community
        setUserCommunities((prev) =>
          prev.filter((c) => c._id !== itemToDelete.id)
        );
        // Refresh the global communities list
        onCommunitiesUpdate();
      } else if (itemToDelete.type === "post") {
        await axios.delete(`/posts/${itemToDelete.id}`);
        // Update local state to remove the deleted post
        setUserPosts((prev) => prev.filter((p) => p._id !== itemToDelete.id));
        // Refresh the global posts list
        onPostsUpdate();
      } else if (itemToDelete.type === "comment") {
        await axios.delete(`/comments/${itemToDelete.id}`);
        // Update local state to remove the deleted comment
        setUserComments((prev) =>
          prev.filter((c) => c._id !== itemToDelete.id)
        );
      }
    } catch (err) {
      console.error(`Failed to delete ${itemToDelete.type}:`, err);
      onError(`Failed to delete ${itemToDelete.type}. Please try again.`);
    } finally {
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return <div></div>;
  }

  if (!userData) {
    return (
      <div className="error-message">
        Unable to load profile data. Please try again.
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{userData.displayName}</h1>
        <div className="profile-info">
          <p>Email: {userData.email}</p>
          <p>Member since: {formatDate(userData.createdAt)}</p>
          <p>Reputation: {userData.reputation}</p>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button
            className={activeTab === "posts" ? "active" : ""}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button
            className={activeTab === "communities" ? "active" : ""}
            onClick={() => setActiveTab("communities")}
          >
            Communities
          </button>
          <button
            className={activeTab === "comments" ? "active" : ""}
            onClick={() => setActiveTab("comments")}
          >
            Comments
          </button>
        </div>

        <div className="profile-listings">
          {activeTab === "posts" && (
            <div className="posts-listing">
              {userPosts.length === 0 ? (
                <p>No posts created yet.</p>
              ) : (
                userPosts.map((post) => (
                  <div
                    key={post._id}
                    className="listing-item"
                    onClick={() => onEditPost(post)}
                  >
                    <span>{post.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete("post", post._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "communities" && (
            <div className="communities-listing">
              {userCommunities.length === 0 ? (
                <p>No communities created yet.</p>
              ) : (
                userCommunities.map((community) => (
                  <div
                    key={community._id}
                    className="listing-item"
                    onClick={() => onEditCommunity(community)}
                  >
                    <span>{community.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete("community", community._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "comments" && (
            <div className="comments-listing">
              {userComments.length === 0 ? (
                <p>No comments created yet.</p>
              ) : (
                userComments.map((comment) => (
                  <div
                    key={comment._id}
                    className="listing-item"
                    onClick={() => onEditComment(comment)}
                  >
                    <span>
                      {comment.postTitle} - {comment.content.substring(0, 20)}
                      ...
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete("comment", comment._id);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="delete-confirm-dialog">
          <div className="dialog-content">
            <h3>Confirm Delete</h3>
            <p>
              Are you sure you want to delete this {itemToDelete?.type}? This
              action cannot be undone.
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

export default UserProfilePage;
