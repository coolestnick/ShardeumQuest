import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { useWallet } from '../context/WalletContext';

function Profile() {
  const { account, token, refreshUserData } = useWallet();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [editing, setEditing] = useState(false);

  const achievements = [
    { id: 1, name: 'DeFi Novice', description: 'Complete your first quest', requiredXP: 100 },
    { id: 2, name: 'Token Scholar', description: 'Earn 500 XP', requiredXP: 500 },
    { id: 3, name: 'Liquidity Expert', description: 'Earn 1000 XP', requiredXP: 1000 },
    { id: 4, name: 'DeFi Master', description: 'Complete all quests', requiredXP: 2000 }
  ];

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }
    if (account) {
      fetchProfile();
    }
    // eslint-disable-next-line 
  }, [account, navigate]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/public/users/profile/${account}`);
      setProfile(response.data);
      setUsername(response.data.username || '');
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Create a basic profile structure using wallet data
      const basicProfile = {
        walletAddress: account,
        username: '',
        totalXP: 0,
        completedQuests: [],
        achievements: [],
        registeredAt: new Date(),
        lastActiveAt: new Date()
      };
      setProfile(basicProfile);
      setUsername('');
    } finally {
      setLoading(false);
    }
  };

  const updateUsername = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/public/users/profile/${account}`,
        { username }
      );
      setEditing(false);
      // First fetch local profile
      await fetchProfile();
      // Then refresh user data in WalletContext to update Navbar
      if (refreshUserData) {
        console.log('Refreshing user data in WalletContext...');
        await refreshUserData();
      }
      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('Username update completed');
      }, 500);
    } catch (error) {
      console.error('Error updating username:', error);
      
      // Handle specific error types
      if (error.response?.status === 429) {
        alert('Too many requests. Please wait a moment and try again.');
      } else if (error.response?.status === 401) {
        alert('Authentication expired. Please reconnect your wallet.');
      } else {
        alert(error.response?.data?.error || 'Failed to update username');
      }
    }
  };

  const hasAchievement = (achievementId) => {
    if (!profile) return false;
    return profile.achievements.some(a => a.achievementId === achievementId);
  };

  if (loading) {
    return <div className="container loading">Loading profile...</div>;
  }

  if (!account) {
    return <div className="container error">Please connect your wallet to view your profile</div>;
  }


  if (!profile) {
    return <div className="container error">Profile not found</div>;
  }

  return (
    <div className="container">
      <div className="profile-section">
        <div className="profile-header">
          <div>
            <h1>Your Profile</h1>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              {profile.walletAddress.slice(0, 6)}...{profile.walletAddress.slice(-4)}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ color: '#00d2ff' }}>{profile.totalXP} XP</h2>
            <p>{profile.completedQuests.length} Quests Completed</p>
          </div>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <h3>Username</h3>
          {editing ? (
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '0.5rem',
                  borderRadius: '4px',
                  flex: 1
                }}
              />
              <button onClick={updateUsername} className="connect-btn">Save</button>
              <button onClick={() => setEditing(false)} className="connect-btn">Cancel</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <span>{profile.username || 'Not set'}</span>
              <button onClick={() => setEditing(true)} className="connect-btn">Edit</button>
            </div>
          )}
        </div>
      </div>

      <div className="profile-section">
        <h2>Achievements</h2>
        <div className="achievement-grid">
          {achievements.map(achievement => (
            <div
              key={achievement.id}
              className={`achievement-badge ${hasAchievement(achievement.id) ? 'unlocked' : ''}`}
            >
              <h4>{achievement.name}</h4>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {achievement.description}
              </p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                {achievement.requiredXP} XP
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-section">
        <h2>Quest History</h2>
        {profile.completedQuests.length === 0 ? (
          <p>No quests completed yet</p>
        ) : (
          <div style={{ marginTop: '1rem' }}>
            {profile.completedQuests.map((quest, index) => (
              <div key={index} style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                marginBottom: '0.5rem',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Quest #{quest.questId}</span>
                <span className="xp-badge">{quest.xpEarned} XP</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;