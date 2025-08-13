import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

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
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-4">
        <Link to={`/profile/${username}`} className="btn btn-secondary">← Back to Profile</Link>
      </div>
      <h1 className="text-2xl font-semibold mb-4">{username} is following</h1>
      {loading ? (
        <div>Loading following...</div>
      ) : following.length === 0 ? (
        <div>Not following anyone yet.</div>
      ) : (
        <div className="space-y-3">
          {following.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 bg-surface-color rounded-lg">
              <img
                src={u.profile_image || `https://ui-avatars.com/api/?name=${u.display_name}&background=3b82f6&color=fff`}
                alt={u.display_name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex-1">
                <Link to={`/profile/${u.username}`} className="font-semibold hover:text-primary-color">
                  {u.display_name || u.username}
                </Link>
                {u.bio && <div className="text-sm text-text-secondary">{u.bio}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FollowingPage;


