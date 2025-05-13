import React, { useState, useEffect } from "react";
import axios from "axios";

const UserProfilePage = ({
  currentUser,
  onError,
  onEditCommunity,
  onEditPost,
  onEditComment,
  onCommunitiesUpdate,
}) => {
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState(
    currentUser?.isAdmin ? "users" : "posts"
  );
  const [userCommunities, setUserCommunities] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Reset content when switching users
  useEffect(() => {
    setUserCommunities([]);
    setUserPosts([]);
    setUserComments([]);
    setIsLoading(true);
  }, [selectedUser]);

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
          `/users/${encodeURIComponent(
            selectedUser ? selectedUser.displayName : currentUser.displayName
          )}`
        );
        setUserData(response.data);

        // If user is admin and no user is selected, fetch all users
        if (currentUser.isAdmin && !selectedUser) {
          try {
            const usersResponse = await axios.get("/users");
            setAllUsers(usersResponse.data);
          } catch (err) {
            console.error("Failed to fetch users:", err);
            if (err.response?.status === 403) {
              onError("Admin access required to view all users");
            } else {
              onError("Failed to fetch users. Please try again.");
            }
          }
        }
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

        const targetUser = selectedUser || currentUser;
        const [communitiesRes, postsRes, commentsRes] = await Promise.all([
          axios.get(
            `/users/${encodeURIComponent(targetUser.displayName)}/communities`
          ),
          axios.get(
            `/users/${encodeURIComponent(targetUser.displayName)}/posts`
          ),
          axios.get(
            `/users/${encodeURIComponent(targetUser.displayName)}/comments`
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
  }, [currentUser, onError, selectedUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteUser = (user) => {
    setUserToDelete(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    try {
      await axios.delete(`/users/${userToDelete._id}`);
      // Refresh the users list
      const usersResponse = await axios.get("/users");
      setAllUsers(usersResponse.data);
      // Refresh the communities list
      onCommunitiesUpdate();
      setShowDeleteConfirm(false);
      setUserToDelete(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      onError(
        err.response?.data?.error || "Failed to delete user. Please try again."
      );
    }
  };

  const handleViewUserProfile = (user) => {
    setIsLoading(true);
    setSelectedUser(user);
    setActiveTab("posts"); // Default to posts tab when viewing another user
  };

  const handleBackToAdminView = () => {
    setIsLoading(true);
    setSelectedUser(null);
    setActiveTab("users");
  };

  if (isLoading) {
    return <div></div>;
  }

  if (!userData) {
    return <div></div>;
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>{userData?.displayName || "Loading..."}</h1>
        <div className="profile-info">
          <p>Email: {userData?.email || "Loading..."}</p>
          <p>
            Member since:{" "}
            {userData?.createdAt
              ? formatDate(userData.createdAt)
              : "Loading..."}
          </p>
          <p>Reputation: {userData?.reputation || 0}</p>
          {selectedUser && (
            <button
              className="button_style button_hover"
              onClick={handleBackToAdminView}
              style={{ marginTop: "10px" }}
            >
              Back to Admin View
            </button>
          )}
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          {currentUser.isAdmin && !selectedUser && (
            <button
              className={activeTab === "users" ? "active" : ""}
              onClick={() => setActiveTab("users")}
            >
              Users
            </button>
          )}
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
          {!activeTab && <div className="no-tab-selected"></div>}
          {activeTab === "users" && currentUser.isAdmin && !selectedUser && (
            <div className="users-listing">
              {allUsers.length === 0 ? (
                <div className="no-posts">
                  <p>No users found in the system.</p>
                  <p>Users will appear here once they create accounts.</p>
                </div>
              ) : (
                allUsers.map((user) => (
                  <div key={user._id} className="listing-item">
                    <div
                      className="user-info"
                      onClick={() => handleViewUserProfile(user)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="user-name">{user.displayName}</span>
                      <span className="user-email">{user.email}</span>
                      <span className="user-reputation">
                        Reputation: {user.reputation}
                      </span>
                      <span className="user-role">
                        {user.isAdmin ? "Admin" : "User"}
                      </span>
                      <span className="user-joined">
                        Joined: {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <button
                      className="button_style button_hover"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(user);
                      }}
                    >
                      Delete User
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

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
                      {comment.postTitle} -{" "}
                      {comment.content.length > 20
                        ? `${comment.content.substring(0, 20)}...`
                        : comment.content}
                    </span>
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
              Are you sure you want to delete user {userToDelete?.displayName}?
              This will also delete all their communities, posts, and comments.
              This action cannot be undone.
            </p>
            <div className="dialog-buttons">
              <button onClick={confirmDeleteUser}>Delete</button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setUserToDelete(null);
                }}
              >
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
