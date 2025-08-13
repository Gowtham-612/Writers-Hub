import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

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
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-4">
        <Link to={`/profile/${username}`} className="btn btn-secondary">← Back to Profile</Link>
      </div>
      <h1 className="text-2xl font-semibold mb-4">Followers of {username}</h1>
      {loading ? (
        <div>Loading followers...</div>
      ) : followers.length === 0 ? (
        <div>No followers yet.</div>
      ) : (
        <div className="space-y-3">
          {followers.map((follower) => (
            <div key={follower.id} className="flex items-center gap-3 p-3 bg-surface-color rounded-lg">
              <img
                src={follower.profile_image || `https://ui-avatars.com/api/?name=${follower.display_name}&background=3b82f6&color=fff`}
                alt={follower.display_name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <Link to={`/profile/${follower.username}`} className="font-semibold hover:text-primary-color">
                  {follower.display_name || follower.username}
                </Link>
                {follower.bio && <div className="text-sm text-text-secondary">{follower.bio}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowersPage;


