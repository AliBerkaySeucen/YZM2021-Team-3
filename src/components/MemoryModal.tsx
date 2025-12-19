import React, { useState, useRef } from 'react';
import { useMemory } from '../context/MemoryContext';
import './MemoryModal.css';

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MemoryModal: React.FC<MemoryModalProps> = ({ isOpen, onClose }) => {
  const { addMemory } = useMemory();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [memoryDate, setMemoryDate] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'close' | 'cancel' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setShowCamera(true);
      
      // Wait for next tick to ensure video element is rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(err => {
            console.error('Video play error:', err);
          });
        }
      }, 100);
    } catch (error) {
      console.error('Kamera erişim hatası:', error);
      alert('Kamera erişimi reddedildi. Lütfen tarayıcı ayarlarınızdan kamera iznini kontrol edin.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      const width = video.videoWidth || video.clientWidth;
      const height = video.videoHeight || video.clientHeight;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip the canvas horizontally to mirror the captured image
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        
        // Draw the video frame to canvas
        ctx.drawImage(video, 0, 0, width, height);
        
        // Convert to base64 image
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setImage(imageData);
        stopCamera();
      }
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!image) {
      alert('Please add an image');
      return;
    }

    addMemory({
      title: title.trim(),
      description: description.trim(),
      image,
      tags,
      date: memoryDate || undefined,
      position: {
        x: Math.random() * 400 - 200,
        y: Math.random() * 300 - 150,
      },
    });

    // Reset form
    setTitle('');
    setDescription('');
    setImage('');
    setTags([]);
    setNewTag('');
    setMemoryDate('');
    onClose();
  };

  const hasUnsavedChanges = () => {
    return title.trim() !== '' || description.trim() !== '' || image !== '' || tags.length > 0 || memoryDate !== '';
  };

  const confirmDiscard = () => {
    stopCamera();
    setTitle('');
    setDescription('');
    setImage('');
    setTags([]);
    setNewTag('');
    setMemoryDate('');
    setShowConfirmDialog(false);
    setPendingAction(null);
    onClose();
  };

  const cancelDiscard = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges()) {
      setPendingAction('cancel');
      setShowConfirmDialog(true);
    } else {
      stopCamera();
      setTitle('');
      setDescription('');
      setImage('');
      setTags([]);
      setNewTag('');
      setMemoryDate('');
      onClose();
    }
  };

  const handleOverlayClick = () => {
    if (hasUnsavedChanges()) {
      setPendingAction('close');
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-layout">
          <div className="modal-left">
            {!showCamera ? (
              <div className="image-upload-area">
                {image ? (
                  <img src={image} alt="Preview" className="image-preview" />
                ) : (
                  <>
                    <div className="upload-icon">+</div>
                    <div className="upload-text">Fotoğraf Ekle</div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
                
                {!image && (
                  <div className="upload-options">
                    <button
                      type="button"
                      className="upload-option-btn"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>Dosya Seç</span>
                    </button>
                    <button
                      type="button"
                      className="upload-option-btn camera-btn"
                      onClick={startCamera}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                      </svg>
                      <span>Fotoğraf Çek</span>
                    </button>
                  </div>
                )}

                {image && (
                  <button
                    type="button"
                    className="change-photo-btn"
                    onClick={() => setImage('')}
                  >
                    Fotoğrafı Değiştir
                  </button>
                )}
              </div>
            ) : (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-video"
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="camera-controls">
                  <button
                    type="button"
                    className="camera-control-btn cancel"
                    onClick={stopCamera}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    <span>İptal</span>
                  </button>
                  <button
                    type="button"
                    className="camera-control-btn capture"
                    onClick={capturePhoto}
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="12" r="10"></circle>
                    </svg>
                  </button>
                  <div style={{ width: '80px' }}></div>
                </div>
              </div>
            )}
          </div>

          <div className="modal-right">
            <input
              type="text"
              className="memory-input"
              placeholder="Enter your memory's title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />

            <textarea
              className="memory-textarea"
              placeholder="Enter your memory's details"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
            />

            <div className="form-row-horizontal">
              <div className="form-group-modal">
                <label className="form-label-modal">Tags (Optional)</label>
                <div className="tags-list">
                  {tags.map(tag => (
                    <span key={tag} className="modal-tag">
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(tag)} className="remove-modal-tag-btn">×</button>
                    </span>
                  ))}
                </div>
                <div className="add-modal-tag-input">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add a tag..."
                  />
                  <button type="button" onClick={handleAddTag} className="add-modal-tag-btn">Add</button>
                </div>
              </div>

              <div className="form-group-modal">
                <label className="form-label-modal">Memory Date (Optional)</label>
                <input
                  type="date"
                  className="memory-date-input"
                  value={memoryDate}
                  onChange={e => setMemoryDate(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={handleCancel}>
                Cancel
              </button>
              <button className="btn-add" onClick={handleSubmit}>
                Add Memory
              </button>
            </div>
          </div>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="confirm-dialog">
            <h3 className="confirm-dialog-title">Unsaved Changes</h3>
            <p className="confirm-dialog-message">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="confirm-dialog-actions">
              <button className="confirm-dialog-btn cancel" onClick={cancelDiscard}>
                Keep Editing
              </button>
              <button className="confirm-dialog-btn discard" onClick={confirmDiscard}>
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryModal;
