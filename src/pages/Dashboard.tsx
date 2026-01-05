import React, { useState, useEffect } from 'react';
import { useMemory } from '../context/MemoryContext';
import { useNavigate } from 'react-router-dom';
import MemoryModal from '../components/MemoryModal';
import PremiumModal from '../components/PremiumModal';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { memories, connections } = useMemory();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Initialize from localStorage to prevent flashing
  const cachedUser = JSON.parse(localStorage.getItem('memolink_current_user') || '{}');
  const [isPremium, setIsPremium] = useState(cachedUser.is_premium || false);
  const [memoryLimit, setMemoryLimit] = useState(cachedUser.memory_limit || 30);

  // Check premium status on mount and update if changed
  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const user = await apiService.getCurrentUser();
        setIsPremium(user.is_premium || false);
        setMemoryLimit(user.memory_limit || 30);
      } catch (error) {
        console.error('Failed to check premium status:', error);
      }
    };
    checkPremiumStatus();
  }, []);

  const handleAddMemoryClick = () => {
    // Check if user has reached limit
    if (!isPremium && memories.length >= memoryLimit) {
      setShowPremiumModal(true);
    } else {
      setIsModalOpen(true);
    }
  };

  const handleUpgrade = async () => {
    try {
      await apiService.upgradeToPremium();
      setIsPremium(true);
      toast.success('Welcome to Premium! Enjoy unlimited memories!');
      setShowPremiumModal(false);
      
      // Update cached user data
      const updatedUser = await apiService.getCurrentUser();
      localStorage.setItem('memolink_current_user', JSON.stringify(updatedUser));
      
      // Refresh page to show updated status
      window.location.reload();
    } catch (error) {
      console.error('Upgrade failed:', error);
      toast.error('Failed to upgrade. Please try again.');
    }
  };

  const isAtLimit = !isPremium && memories.length >= memoryLimit;

  // Get recently added memories (last 4)
  const recentMemories = [...memories]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4);

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="dashboard-grid">
        {/* Recently Added Section */}
        <div className="dashboard-card recently-added">
          <h2 className="card-title">Recently Added</h2>
          <div className="recent-images">
            {recentMemories.length > 0 ? (
              recentMemories.map(memory => (
                <img
                  key={memory.id}
                  src={memory.image}
                  alt={memory.title}
                  className="recent-image"
                  onClick={() => navigate('/album')}
                  loading="lazy"
                  decoding="async"
                  style={{ contentVisibility: 'auto' }}
                />
              ))
            ) : (
              <p className="no-data">No memories yet. Add your first memory!</p>
            )}
          </div>
        </div>

        {/* Your Graph Section */}
        <div className="dashboard-card your-graph">
          <h2 className="card-title">Your Graph</h2>
          <div className="graph-preview" onClick={() => navigate('/graph')}>
            <div className="preview-nodes">
              {memories.slice(0, 10).map((memory, index) => (
                <div
                  key={memory.id}
                  className="preview-node"
                  style={{
                    left: `${(index % 4) * 25 + 10}%`,
                    top: `${Math.floor(index / 4) * 30 + 20}%`,
                  }}
                />
              ))}
            </div>
            {memories.length === 0 && (
              <p className="no-data-graph">No graph data yet</p>
            )}
          </div>
        </div>

        {/* Statistics Section */}
        <div className="dashboard-card statistics">
          <h2 className="card-title">Statistics</h2>
          <div className="stat-item">
            <div className="stat-label">Added Memory</div>
            <div className="stat-value">{memories.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Edge Count</div>
            <div className="stat-value">{connections.length}</div>
          </div>
        </div>

        {/* Add New Memory Section */}
        <div className="dashboard-card add-memory-card" onClick={handleAddMemoryClick}>
          <div className="add-icon">{isAtLimit ? '⭐' : '+'}</div>
          <div className="add-text">{isAtLimit ? 'Go Premium' : 'Add New Memory'}</div>
        </div>
      </div>

      <MemoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <PremiumModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />
    </div>
  );
};

export default Dashboard;
