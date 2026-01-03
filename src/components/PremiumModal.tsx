import React from 'react';
import './PremiumModal.css';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose, onUpgrade }) => {
  if (!isOpen) return null;

  return (
    <div className="premium-modal-overlay" onClick={onClose}>
      <div className="premium-modal-content" onClick={e => e.stopPropagation()}>
        <button className="premium-modal-close" onClick={onClose}>×</button>
        
        <div className="premium-header">
          <div className="premium-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <h2 className="premium-title">Upgrade to Premium</h2>
          <p className="premium-subtitle">Unlock unlimited memories and features</p>
        </div>

        <div className="premium-features">
          <div className="premium-feature">
            <div className="feature-icon check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="feature-text">
              <h3>Unlimited Memories</h3>
              <p>Store as many memories as you want without any limits</p>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="feature-text">
              <h3>Priority Support</h3>
              <p>Get faster responses and dedicated assistance</p>
            </div>
          </div>

          <div className="premium-feature">
            <div className="feature-icon check">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="feature-text">
              <h3>Advanced Features</h3>
              <p>Access to premium tools and upcoming features first</p>
            </div>
          </div>
        </div>

        <div className="premium-pricing">
          <div className="price-tag">
            <span className="currency">$</span>
            <span className="amount">9.99</span>
            <span className="period">/month</span>
          </div>
          <p className="price-note">Cancel anytime, no commitments</p>
        </div>

        <div className="premium-actions">
          <button className="btn-cancel-premium" onClick={onClose}>
            Maybe Later
          </button>
          <button className="btn-upgrade-premium" onClick={onUpgrade}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            Go Premium
          </button>
        </div>
      </div>
    </div>
  );
};

export default PremiumModal;
