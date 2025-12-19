import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  MarkerType,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMemory } from '../context/MemoryContext';
import MemoryModal from '../components/MemoryModal';
import './MemoryGraph.css';
import './Album.css';

const MemoryGraph: React.FC = () => {
  const { memories, connections, addConnection, deleteConnection, deleteMemory, updateMemoryPosition } = useMemory();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNodeForConnect, setSelectedNodeForConnect] = useState<string | null>(null);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ nodes: string[], edges: string[] } | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Convert memories to nodes
  useEffect(() => {
    const newNodes: Node[] = memories.map(memory => ({
      id: memory.id,
      type: 'default',
      position: memory.position || { x: Math.random() * 400, y: Math.random() * 300 },
      data: {
        label: (
          <div className="node-content">
            <img 
              src={memory.image} 
              alt={memory.title} 
              className="node-image" 
              loading="lazy"
              decoding="async"
              style={{ contentVisibility: 'auto' }}
            />
          </div>
        ),
      },
      selectable: true,
      draggable: true,
      connectable: false,
      style: {
        background: '#3B82F6',
        border: '3px solid #60A5FA',
        borderRadius: '12px',
        padding: 0,
        width: 120,
        height: 90,
      },
    }));
    setNodes(newNodes);
  }, [memories, setNodes]);

  // Convert connections to edges
  useEffect(() => {
    const newEdges: Edge[] = connections.map(conn => ({
      id: conn.id,
      source: conn.source,
      target: conn.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#A855F7', strokeWidth: 3 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#A855F7',
      },
    }));
    setEdges(newEdges);
  }, [connections, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addConnection(params.source, params.target);
      }
    },
    [addConnection]
  );

  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      updateMemoryPosition(node.id, node.position);
    },
    [updateMemoryPosition]
  );

  const handleNodeClick = useCallback(
    (_: any, node: Node) => {
      if (isConnectMode) {
        if (!selectedNodeForConnect) {
          setSelectedNodeForConnect(node.id);
        } else {
          if (selectedNodeForConnect !== node.id) {
            addConnection(selectedNodeForConnect, node.id);
          }
          setSelectedNodeForConnect(null);
          setIsConnectMode(false);
        }
      } else {
        setSelectedMemoryId(node.id);
      }
    },
    [isConnectMode, selectedNodeForConnect, addConnection]
  );

  const handleDelete = () => {
    const selectedNodes = nodes.filter((node: any) => node.selected);
    const selectedEdges = edges.filter((edge: any) => edge.selected);

    if (selectedNodes.length === 0 && selectedEdges.length === 0) {
      return;
    }

    setDeleteTarget({
      nodes: selectedNodes.map(n => n.id),
      edges: selectedEdges.map(e => e.id)
    });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteTarget.edges.forEach(edgeId => deleteConnection(edgeId));
      deleteTarget.nodes.forEach(nodeId => deleteMemory(nodeId));
      setDeleteTarget(null);
      setShowDeleteConfirm(false);
    }
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
    setShowDeleteConfirm(false);
  };

  const handleZoomIn = () => {
    reactFlowInstance?.zoomIn();
  };

  const handleZoomOut = () => {
    reactFlowInstance?.zoomOut();
  };

  const handleFitView = () => {
    reactFlowInstance?.fitView();
  };

  // Get connected memories for a given memory
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

  const toggleFullscreen = () => {
    const element = document.querySelector('.memory-graph-page') as HTMLElement;
    
    if (!document.fullscreenElement) {
      element.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  return (
    <div className="memory-graph-page">
      <div className="graph-header">
        <div className="graph-header-content">
          <h1 className="graph-title">İnteraktif Graf Haritası</h1>
          <p className="graph-subtitle">Haritada gezinin, yakınlaştırın ve düğümleri yönetin</p>
        </div>
        
        <div className="graph-toolbar">
          <button 
            className="toolbar-btn btn-add" 
            onClick={() => setIsModalOpen(true)}
            title="Add new memory node"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Düğüm Ekle</span>
          </button>
          <button
            className={`toolbar-btn btn-connect ${isConnectMode ? 'active' : ''}`}
            onClick={() => {
              setIsConnectMode(!isConnectMode);
              setSelectedNodeForConnect(null);
            }}
            title="Drag from one node to another to connect"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
            </svg>
            <span>Bağlantı Ekle</span>
          </button>
          <button 
            className="toolbar-btn btn-delete" 
            onClick={handleDelete}
            title="Delete selected items"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span>Sil</span>
          </button>
          <button 
            className="toolbar-btn btn-fullscreen" 
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
            )}
            <span>{isFullscreen ? 'Çıkış' : 'Tam Ekran'}</span>
          </button>
        </div>
      </div>

      <div className="graph-container">
        <div className="graph-wrapper">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeDragStop={onNodeDragStop}
            onNodeClick={handleNodeClick}
            onInit={setReactFlowInstance}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} color="#334155" />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <div className="custom-controls">
          <button className="control-btn" onClick={handleZoomIn} title="Zoom in">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button className="control-btn" onClick={handleZoomOut} title="Zoom out">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          <button className="control-btn" onClick={handleFitView} title="Fit view">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
          </button>
        </div>

        <div className="zoom-indicator">
          Zoom: {reactFlowInstance ? Math.round(reactFlowInstance.getZoom() * 100) : 100}%
        </div>

        {isConnectMode && (
          <div className="connect-mode-hint">
            <span className="hint-icon">💡</span>
            <span className="hint-text">
              Connection Mode: Drag from one node's edge to another node to create a connection. Click the button again to exit.
            </span>
          </div>
        )}
      </div>

      <MemoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      {selectedMemoryId && memories.find(m => m.id === selectedMemoryId) && (
        <div className="memory-popup-overlay" onClick={() => setSelectedMemoryId(null)}>
          <div className="memory-popup-content" onClick={e => e.stopPropagation()}>
            <button className="popup-close-btn" onClick={() => setSelectedMemoryId(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="popup-image-container">
              <img 
                src={memories.find(m => m.id === selectedMemoryId)!.image} 
                alt={memories.find(m => m.id === selectedMemoryId)!.title} 
                className="popup-image" 
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="popup-info">
              <h2 className="popup-title">{memories.find(m => m.id === selectedMemoryId)!.title}</h2>
              <p className="popup-description">{memories.find(m => m.id === selectedMemoryId)!.description}</p>
              
              {memories.find(m => m.id === selectedMemoryId)!.tags && memories.find(m => m.id === selectedMemoryId)!.tags!.length > 0 && (
                <div className="popup-tags">
                  {memories.find(m => m.id === selectedMemoryId)!.tags!.map(tag => (
                    <span key={tag} className="popup-tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="popup-date">
                {memories.find(m => m.id === selectedMemoryId)!.date ? (
                  <>Memory Date: {new Date(memories.find(m => m.id === selectedMemoryId)!.date!).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</>
                ) : (
                  <>Added: {new Date(memories.find(m => m.id === selectedMemoryId)!.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</>
                )}
              </div>

              {/* Connections Section */}
              {(() => {
                const connectedMemories = getConnectedMemories(selectedMemoryId);
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
                              setSelectedMemoryId(memory!.id);
                            }}>
                              <img 
                                src={memory!.image} 
                                alt={memory!.title} 
                                className="connection-thumbnail" 
                                loading="lazy"
                                decoding="async"
                              />
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
                              setSelectedMemoryId(memory!.id);
                            }}>
                              <img 
                                src={memory!.image} 
                                alt={memory!.title} 
                                className="connection-thumbnail" 
                                loading="lazy"
                                decoding="async"
                              />
                              <span className="connection-name">{memory!.title}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && deleteTarget && (
        <div className="delete-confirm-overlay" onClick={cancelDelete}>
          <div className="delete-confirm-dialog" onClick={e => e.stopPropagation()}>
            <div className="delete-confirm-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <h2 className="delete-confirm-title">Delete Selected Items?</h2>
            <p className="delete-confirm-message">
              {(() => {
                const nodeCount = deleteTarget.nodes.length;
                const edgeCount = deleteTarget.edges.length;
                const totalCount = nodeCount + edgeCount;
                
                if (nodeCount > 0 && edgeCount > 0) {
                  return `Are you sure you want to delete ${nodeCount} memor${nodeCount > 1 ? 'ies' : 'y'} and ${edgeCount} connection${edgeCount > 1 ? 's' : ''}?`;
                } else if (nodeCount > 0) {
                  return `Are you sure you want to delete ${nodeCount} memor${nodeCount > 1 ? 'ies' : 'y'}?`;
                } else {
                  return `Are you sure you want to delete ${edgeCount} connection${edgeCount > 1 ? 's' : ''}?`;
                }
              })()}
              {deleteTarget.nodes.length > 0 && (
                <span className="delete-warning">
                  <br /><br />
                  ⚠️ Deleting memories will also remove all their connections.
                </span>
              )}
            </p>
            <div className="delete-confirm-actions">
              <button className="delete-confirm-cancel" onClick={cancelDelete}>Cancel</button>
              <button className="delete-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryGraph;
