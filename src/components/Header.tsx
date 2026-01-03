import React, { useState, useEffect } from 'react';
import PremiumModal from './PremiumModal';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import './Header.css';

const Header: React.FC = () => {
  // Initialize from localStorage to prevent flashing
  const cachedUser = JSON.parse(localStorage.getItem('memolink_current_user') || '{}');
  const [isPremium, setIsPremium] = useState(cachedUser.is_premium || false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      try {
        const user = await apiService.getCurrentUser();
        setIsPremium(user.is_premium || false);
      } catch (error) {
        console.error('Error checking premium status:', error);
      }
    };
    checkPremiumStatus();
  }, []);

  const handleUpgrade = async () => {
    try {
      await apiService.upgradeToPremium();
      setIsPremium(true);
      setShowPremiumModal(false);
      toast.success('Welcome to Premium! Enjoy unlimited memories!');
      
      // Refresh user data
      const updatedUser = await apiService.getCurrentUser();
      localStorage.setItem('memolink_current_user', JSON.stringify(updatedUser));
    } catch (error) {
      toast.error('Failed to upgrade to premium');
      console.error('Upgrade error:', error);
    }
  };

  return (
    <>
      <header className="app-header">
        <h1>MemoLink</h1>
        {!isPremium && (
          <button className="go-premium-btn" onClick={() => setShowPremiumModal(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Go Premium
          </button>
        )}
      </header>
      <PremiumModal 
        isOpen={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};

export default Header;

