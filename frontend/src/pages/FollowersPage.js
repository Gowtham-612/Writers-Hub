import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../Styling/FollowerPage.css';

const FollowersPage = () => {
  const { username } = useParams();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const response = await axios.get(`/api/users/${username}/followers`);
        setFollowers(response.data || []);
      } catch (e) {
        setFollowers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowers();
  }, [username]);

  return (
    <div className="followers-page">
      <div className="followers-header">
        <Link to={`/profile/${username}`} className="back-btn">← Back to Profile</Link>
        <h1 className="page-title">Followers of {username}</h1>
      </div>

      {loading ? (
        <div className="loading">Loading followers...</div>
      ) : followers.length === 0 ? (
        <div className="empty">No followers yet.</div>
      ) : (
        <div className="followers-list">
          {followers.map((follower) => (
            <div key={follower.id} className="follower-card">
              <img
                src={
                  follower.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.display_name || follower.username)}&background=3b82f6&color=fff&size=80`
                }
                alt={follower.display_name || follower.username}
                className="follower-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(follower.display_name || follower.username)}&background=3b82f6&color=fff&size=80`;
                }}
              />
              <div className="follower-info">
                <Link to={`/profile/${follower.username}`} className="follower-name">
                  {follower.display_name || follower.username}
                </Link>
                {follower.bio && <p className="follower-bio">{follower.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowersPage;
