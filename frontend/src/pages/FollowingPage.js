import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import '../Styling/FollowingPage.css';
const FollowingPage = () => {
  const { username } = useParams();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFollowing = async () => {
      try {
        const response = await axios.get(`/api/users/${username}/following`);
        setFollowing(response.data || []);
      } catch (e) {
        setFollowing([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowing();
  }, [username]);

  return (
    <div className="following-page">
      <div className="following-header">
        <Link to={`/profile/${username}`} className="back-btn">← Back to Profile</Link>
        <h1 className="page-title">{username} is Following</h1>
      </div>

      {loading ? (
        <div className="loading">Loading following...</div>
      ) : following.length === 0 ? (
        <div className="empty">Not following anyone yet.</div>
      ) : (
        <div className="following-list">
          {following.map((u) => (
            <div key={u.id} className="following-card">
              <img
                src={
                  u.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username)}&background=3b82f6&color=fff&size=80`
                }
                alt={u.display_name || u.username}
                className="following-avatar"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name || u.username)}&background=3b82f6&color=fff&size=80`;
                }}
              />
              <div className="following-info">
                <Link to={`/profile/${u.username}`} className="following-name">
                  {u.display_name || u.username}
                </Link>
                {u.bio && <p className="following-bio">{u.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowingPage;
