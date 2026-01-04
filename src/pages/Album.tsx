import React, { useState, useEffect, useRef } from 'react';
import { useMemory } from '../context/MemoryContext';
import './Album.css';

const Album: React.FC = () => {
  const { memories, connections, updateMemory, deleteMemory, loadMoreMemories, hasMore, loading } = useMemory();
  const [selectedMemory, setSelectedMemory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isExpandedView, setIsExpandedView] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sortOption, setSortOption] = useState<string>('date-newest');
  const [currentPage, setCurrentPage] = useState(1);
  const memoriesPerPage = 12;
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container || loading || !hasMore) return;
      
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user scrolls to 80% of the content
      if (scrollTop + clientHeight >= scrollHeight * 0.8) {
        loadMoreMemories();
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, loadMoreMemories]);

  const openMemory = (id: string) => {
    const memory = memories.find(m => m.id === id);
    if (memory) {
      setSelectedMemory(id);
      setEditTitle(memory.title);
      setEditDescription(memory.description);
      setEditTags(memory.tags || []);
      setIsEditMode(false);
    }
  };

  const closeMemory = () => {
    setSelectedMemory(null);
    setIsEditMode(false);
    setIsExpandedView(false);
    setShowDeleteConfirm(false);
  };

  const handleNextMemory = () => {
    const currentIndex = filteredMemories.findIndex(m => m.id === selectedMemory);
    if (currentIndex < filteredMemories.length - 1) {
      openMemory(filteredMemories[currentIndex + 1].id);
    }
  };

  const handlePrevMemory = () => {
    const currentIndex = filteredMemories.findIndex(m => m.id === selectedMemory);
    if (currentIndex > 0) {
      openMemory(filteredMemories[currentIndex - 1].id);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
  };

  const handleSaveEdit = () => {
    if (selectedMemory) {
      updateMemory(selectedMemory, {
        title: editTitle,
        description: editDescription,
        tags: editTags,
      });
      setIsEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    const memory = memories.find(m => m.id === selectedMemory);
    if (memory) {
      setEditTitle(memory.title);
      setEditDescription(memory.description);
      setEditTags(memory.tags || []);
    }
    setIsEditMode(false);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(tag => tag !== tagToRemove));
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedMemory) {
      deleteMemory(selectedMemory);
      closeMemory();
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Get all unique tags
  const allTags = Array.from(new Set(memories.flatMap(m => m.tags || [])));

  // Get connected memories for the selected memory
  const getConnectedMemories = (memoryId: string) => {
    const outgoingConnections = connections
      .filter(c => c.source === memoryId)
      .map(c => memories.find(m => m.id === c.target))
      .filter(m => m !== undefined);
    
    const incomingConnections = connections
      .filter(c => c.target === memoryId)
      .map(c => memories.find(m => m.id === c.source))
      .filter(m => m !== undefined);
    
    return { outgoing: outgoingConnections, incoming: incomingConnections };
  };

  // Sort and filter memories
  const sortedAndFilteredMemories = React.useMemo(() => {
    // First, filter memories
    let result = memories.filter(memory => {
      const matchesSearch = 
        memory.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (memory.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTag = !selectedTag || (memory.tags || []).includes(selectedTag);
      
      return matchesSearch && matchesTag;
    });

    // Then, sort memories
    result.sort((a, b) => {
      switch (sortOption) {
        case 'date-newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date-oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'title-az':
          return a.title.localeCompare(b.title);
        case 'title-za':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });

    return result;
  }, [memories, searchQuery, selectedTag, sortOption]);

  // Reset to page 1 when filters or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag, sortOption]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedAndFilteredMemories.length / memoriesPerPage);
  const startIndex = (currentPage - 1) * memoriesPerPage;
  const endIndex = startIndex + memoriesPerPage;
  const currentMemories = sortedAndFilteredMemories.slice(startIndex, endIndex);
  
  // Keep filteredMemories for backward compatibility with popup navigation
  const filteredMemories = sortedAndFilteredMemories;

  const selectedMemoryData = memories.find(m => m.id === selectedMemory);

  return (
    <div className="album">
      <h1 className="page-title">Your Album</h1>

      {/* Search and Filter Bar */}
      <div className="album-controls">
        <div className="search-sort-row">
          <div className="search-container">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input
              type="text"
              className="search-input"
              placeholder="Search memories by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="sort-container">
            <svg className="sort-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M7 12h10M11 18h2"></path>
            </svg>
            <select 
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="date-newest">Date (Newest First)</option>
              <option value="date-oldest">Date (Oldest First)</option>
              <option value="title-az">Title (A-Z)</option>
              <option value="title-za">Title (Z-A)</option>
            </select>
          </div>
        </div>

        {allTags.length > 0 && (
          <div className="tag-filter">
            <button
              className={`tag-filter-btn ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag('')}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter-btn ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="album-grid" ref={scrollContainerRef} style={{ maxHeight: '70vh', overflowY: 'auto' }}>
        {currentMemories.length > 0 ? (
          currentMemories.map((memory, index) => (
            <div key={memory.id} className="memory-card" onClick={() => openMemory(memory.id)}>
              <img 
                src={memory.image} 
                alt={memory.title} 
                className="memory-image"
                loading="lazy"
                decoding="async"
                style={{ contentVisibility: 'auto' }}
              />
              <div className="memory-info">
                <h3 className="memory-title">{memory.title}</h3>
                <p className="memory-description">
                  {memory.description || ''}
                </p>
                {memory.tags && memory.tags.length > 0 && (
                  <div className="memory-tags">
                    {memory.tags.map(tag => (
                      <span key={tag} className="memory-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-memories">
            <p>{searchQuery || selectedTag ? 'No memories found matching your search.' : 'No memories yet. Start adding some!'}</p>
          </div>
        )}
        
        {loading && (
          <div className="loading-more" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            Loading more memories...
          </div>
        )}
        
        {!hasMore && memories.length > 0 && (
          <div className="no-more-data" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
            All memories loaded
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="pagination-controls">
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            title="First page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </button>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Previous
          </button>
          
          <div className="pagination-info">
            <div className="page-numbers">
              {currentPage > 3 && (
                <>
                  <button className="page-number" onClick={() => setCurrentPage(1)}>1</button>
                  {currentPage > 4 && <span className="page-ellipsis">...</span>}
                </>
              )}
              
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === currentPage || 
                  page === currentPage - 1 || 
                  page === currentPage + 1 ||
                  page === currentPage - 2 ||
                  page === currentPage + 2
                )
                .map(page => (
                  <button
                    key={page}
                    className={`page-number ${page === currentPage ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
              
              {currentPage < totalPages - 2 && (
                <>
                  {currentPage < totalPages - 3 && <span className="page-ellipsis">...</span>}
                  <button className="page-number" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                </>
              )}
            </div>
            <span className="pagination-count">({sortedAndFilteredMemories.length} {sortedAndFilteredMemories.length === 1 ? 'memory' : 'memories'})</span>
          </div>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          
          <button 
            className="pagination-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            title="Last page"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </button>
        </div>
      )}

      {selectedMemoryData && (
        <div className="memory-popup-overlay" onClick={closeMemory}>
          <div className="memory-popup-content" onClick={e => e.stopPropagation()}>
            <button className="popup-close-btn" onClick={closeMemory}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            {filteredMemories.findIndex(m => m.id === selectedMemory) > 0 && (
              <button className="popup-nav-btn prev-btn" onClick={handlePrevMemory}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
              </button>
            )}

            {filteredMemories.findIndex(m => m.id === selectedMemory) < filteredMemories.length - 1 && (
              <button className="popup-nav-btn next-btn" onClick={handleNextMemory}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            )}

            <div className="popup-image-container">
              <img 
                src={selectedMemoryData.image} 
                alt={selectedMemoryData.title} 
                className="popup-image"
                loading="eager"
                decoding="async"
              />
              <button 
                className="expand-image-btn" 
                onClick={() => setIsExpandedView(true)}
                title="View full size"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <polyline points="9 21 3 21 3 15"></polyline>
                  <line x1="21" y1="3" x2="14" y2="10"></line>
                  <line x1="3" y1="21" x2="10" y2="14"></line>
                </svg>
              </button>
            </div>
            <div className="popup-info">
              {!isEditMode ? (
                <>
                  <h2 className="popup-title">{selectedMemoryData.title}</h2>
                  <p className="popup-description">{selectedMemoryData.description}</p>
                  
                  {selectedMemoryData.tags && selectedMemoryData.tags.length > 0 && (
                    <div className="popup-tags">
                      {selectedMemoryData.tags.map(tag => (
                        <span key={tag} className="popup-tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="popup-date">
                    {selectedMemoryData.date ? (
                      <>Memory Date: {new Date(selectedMemoryData.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</>
                    ) : (
                      <>Added: {new Date(selectedMemoryData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}</>
                    )}
                  </div>

                  {/* Connections Section */}
                  {(() => {
                    const connectedMemories = getConnectedMemories(selectedMemoryData.id);
                    const hasConnections = connectedMemories.outgoing.length > 0 || connectedMemories.incoming.length > 0;
                    
                    return hasConnections && (
                      <div className="popup-connections">
                        <h3 className="connections-title">Connections</h3>
                        
                        {connectedMemories.outgoing.length > 0 && (
                          <div className="connection-group">
                            <div className="connection-group-header">
                              <svg className="connection-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                                <polyline points="12 5 19 12 12 19"></polyline>
                              </svg>
                              <span className="connection-label">Outgoing Links ({connectedMemories.outgoing.length})</span>
                            </div>
                            <div className="connection-list">
                              {connectedMemories.outgoing.map(memory => (
                                <div key={memory!.id} className="connection-item" onClick={(e) => {
                                  e.stopPropagation();
                                  openMemory(memory!.id);
                                }}>
                                  <img src={memory!.image} alt={memory!.title} className="connection-thumbnail" />
                                  <span className="connection-name">{memory!.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {connectedMemories.incoming.length > 0 && (
                          <div className="connection-group">
                            <div className="connection-group-header">
                              <svg className="connection-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                              </svg>
                              <span className="connection-label">Incoming Links ({connectedMemories.incoming.length})</span>
                            </div>
                            <div className="connection-list">
                              {connectedMemories.incoming.map(memory => (
                                <div key={memory!.id} className="connection-item" onClick={(e) => {
                                  e.stopPropagation();
                                  openMemory(memory!.id);
                                }}>
                                  <img src={memory!.image} alt={memory!.title} className="connection-thumbnail" />
                                  <span className="connection-name">{memory!.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  <div className="popup-actions">
                    <button className="edit-btn" onClick={handleEdit}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                      </svg>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={handleDelete}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    className="edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                  />
                  <textarea
                    className="edit-textarea"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    rows={6}
                  />
                  
                  <div className="edit-tags-section">
                    <label className="edit-label">Tags:</label>
                    <div className="edit-tags-list">
                      {editTags.map(tag => (
                        <span key={tag} className="edit-tag">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="remove-tag-btn">×</button>
                        </span>
                      ))}
                    </div>
                    <div className="add-tag-input">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                        placeholder="Add a tag..."
                      />
                      <button onClick={handleAddTag} className="add-tag-btn">Add</button>
                    </div>
                  </div>

                  <div className="popup-actions">
                    <button className="save-btn" onClick={handleSaveEdit}>Save</button>
                    <button className="cancel-btn" onClick={handleCancelEdit}>Cancel</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && selectedMemoryData && (
        <div className="delete-confirm-overlay" onClick={cancelDelete}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2 className="delete-confirm-title">Delete Memory?</h2>
            <p className="delete-confirm-message">
              Are you sure you want to delete "<strong>{selectedMemoryData.title}</strong>"?
              {(() => {
                const connectedMemories = getConnectedMemories(selectedMemoryData.id);
                const totalConnections = connectedMemories.outgoing.length + connectedMemories.incoming.length;
                return totalConnections > 0 && (
                  <span className="delete-warning">
                    <br /><br />
                    ⚠️ This memory has {totalConnections} connection{totalConnections > 1 ? 's' : ''} that will also be removed.
                  </span>
                );
              })()}
            </p>
            <div className="delete-confirm-actions">
              <button className="delete-confirm-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="delete-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {isExpandedView && selectedMemoryData && (
        <div className="expanded-image-overlay" onClick={() => setIsExpandedView(false)}>
          <button className="expanded-close-btn" onClick={() => setIsExpandedView(false)}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <img 
            src={selectedMemoryData.image} 
            alt={selectedMemoryData.title} 
            className="expanded-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Album;
