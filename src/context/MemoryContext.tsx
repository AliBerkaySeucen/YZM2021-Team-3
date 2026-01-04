import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Memory, Connection, AppState } from '../types';
import apiService from '../services/api';
import { toast } from 'react-toastify';

interface MemoryContextType {
  memories: Memory[];
  connections: Connection[];
  darkMode: boolean;
  loading: boolean;
  hasMore: boolean;
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  updateMemoryPosition: (id: string, position: { x: number; y: number }) => Promise<void>;
  addConnection: (source: string, target: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  toggleDarkMode: () => void;
  refreshData: () => Promise<void>;
  loadMoreMemories: () => Promise<void>;
  clearAllData: () => void;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

const STORAGE_KEY = 'memolink_data';
const getCacheKey = () => {
  const token = localStorage.getItem('memolink_token');
  if (token) {
    // Extract user ID from token (basic decoding)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return `${STORAGE_KEY}_${payload.sub || 'user'}`;
    } catch {
      return STORAGE_KEY;
    }
  }
  return STORAGE_KEY;
};

// Helper function to load cached data and reduce duplication
const loadFromCache = <T,>(key: keyof AppState, defaultValue: T): T => {
  const cacheKey = getCacheKey();
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    try {
      const data: AppState = JSON.parse(cached);
      return (data[key] as T) || defaultValue;
    } catch {
      return defaultValue;
    }
  }
  return defaultValue;
};


export const MemoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from cache for instant display on page switches
  const [memories, setMemories] = useState<Memory[]>(() => loadFromCache('memories', []));
  const [connections, setConnections] = useState<Connection[]>(() => loadFromCache('connections', []));
  const [darkMode, setDarkMode] = useState<boolean>(() => loadFromCache('darkMode', false));
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);

  // Load data from backend or use cache if already loaded
  const refreshData = async (forceRefresh: boolean = false) => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Eğer daha önce yüklendiyse ve force refresh değilse, cache kullan
      if (dataLoaded && !forceRefresh && memories.length > 0) {
        return;
      }
      
      try {
        setLoading(true);
        
        // İlk yüklemede son 40 memory'yi getir
        const [memoriesResponse, connectionsData] = await Promise.all([
          apiService.getMemories(40, 0),
          apiService.getConnections()
        ]);
        
        const memoriesData = memoriesResponse.memories || [];
        const totalCount = memoriesResponse.totalCount || 0;
        
        // Update state with fresh data from server
        setMemories(memoriesData);
        setConnections(connectionsData);
        setHasMore(memoriesData.length < totalCount);
        setDataLoaded(true);
        
        // Cache the fresh data with user-specific key
        const cacheKey = getCacheKey();
        const dataToSave: AppState = {
          memories: memoriesData,
          connections: connectionsData,
          darkMode
        };
        localStorage.setItem(cacheKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error loading data from API:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Load more memories for infinite scroll
  const loadMoreMemories = async () => {
    if (!hasMore || loading) return;
    
    const token = localStorage.getItem('memolink_token');
    if (!token) return;
    
    try {
      setLoading(true);
      const offset = memories.length;
      const response = await apiService.getMemories(40, offset);
      const moreMemories = response.memories || [];
      const totalCount = response.totalCount || 0;
      
      if (moreMemories.length > 0) {
        setMemories(prev => [...prev, ...moreMemories]);
        const newTotal = memories.length + moreMemories.length;
        setHasMore(newTotal < totalCount);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more memories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load - only if not already loaded from cache
  useEffect(() => {
    const token = localStorage.getItem('memolink_token');
    if (token && !dataLoaded) {
      refreshData();
    }
    // eslint-disable-next-line
  }, []);

  // Save to localStorage whenever data changes (backup)
  useEffect(() => {
    const token = localStorage.getItem('memolink_token');
    if (token) {
      // Only cache when logged in
      const cacheKey = getCacheKey();
      const data: AppState = { memories, connections, darkMode };
      localStorage.setItem(cacheKey, JSON.stringify(data));
    }
  }, [memories, connections, darkMode]);

  // Apply dark mode to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  const addMemory = async (memory: Omit<Memory, 'id' | 'createdAt'>) => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Optimistic update: Create temporary memory immediately for instant UI feedback
      const tempId = `temp-${Date.now()}`;
      const optimisticMemory: Memory = {
        ...memory,
        id: tempId,
        createdAt: new Date().toISOString(),
        tags: memory.tags || [],
      };
      setMemories(prev => [...prev, optimisticMemory]);
      
      // API call in background - sync real data
      try {
        const newMemory = await apiService.createMemory({
          title: memory.title,
          description: memory.description,
          image: memory.image,
          tags: memory.tags,
          date: memory.date,
          position: memory.position
        });
        
        if (!newMemory || !newMemory.id) {
          console.error('[CONTEXT] Invalid memory returned from API');
          throw new Error('Invalid memory object returned from server');
        }
        
        // Replace temp memory with real one from server
        setMemories(prev => prev.map(m => m.id === tempId ? newMemory : m));
        toast.success('Memory added successfully!');
      } catch (error) {
        console.error('Error creating memory:', error);
        // Rollback optimistic update on error
        setMemories(prev => prev.filter(m => m.id !== tempId));
        toast.error('Failed to add memory. Please try again.');
        throw error;
      }
    } else {
      // Offline mode - use localStorage
      const newMemory: Memory = {
        ...memory,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        tags: memory.tags || [],
      };
      setMemories(prev => [...prev, newMemory]);
    }
  };

  const updateMemory = async (id: string, updates: Partial<Memory>) => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Optimistic update: Update UI immediately
      const previousMemories = memories;
      setMemories(prev =>
        prev.map(m => (m.id === id ? { ...m, ...updates } : m))
      );
      
      // API call in background
      try {
        const updatedMemory = await apiService.updateMemory(id, updates);
        // Update with real data from server
        setMemories(prev =>
          prev.map(m => (m.id === id ? updatedMemory : m))
        );
        toast.success('Memory updated successfully!');
      } catch (error) {
        console.error('Error updating memory:', error);
        // Rollback on error
        setMemories(previousMemories);
        toast.error('Failed to update memory. Please try again.');
        throw error;
      }
    } else {
      // Offline mode
      setMemories(prev =>
        prev.map(m => (m.id === id ? { ...m, ...updates } : m))
      );
    }
  };

  const deleteMemory = async (id: string) => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Optimistic update: Remove from UI immediately
      const previousMemories = memories;
      const previousConnections = connections;
      setMemories(prev => prev.filter(m => m.id !== id));
      setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
      
      // API call in background
      try {
        await apiService.deleteMemory(id);
        toast.success('Memory deleted successfully!');
      } catch (error) {
        console.error('Error deleting memory:', error);
        // Rollback on error
        setMemories(previousMemories);
        setConnections(previousConnections);
        toast.error('Failed to delete memory. Please try again.');
        throw error;
      }
    } else {
      // Offline mode
      setMemories(prev => prev.filter(m => m.id !== id));
      setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
    }
  };

  const updateMemoryPosition = async (id: string, position: { x: number; y: number }) => {
    const token = localStorage.getItem('memolink_token');
    
    // Always update UI immediately for smooth dragging
    setMemories(prev =>
      prev.map(m => (m.id === id ? { ...m, position } : m))
    );
    
    if (token) {
      // API call in background - fire and forget for smooth UX
      apiService.updateMemory(id, { position }).catch(error => {
        console.error('Error updating position (background):', error);
        // Don't rollback position updates - user expects smooth dragging
      });
    } else {
      // Offline mode
      setMemories(prev =>
        prev.map(m => (m.id === id ? { ...m, position } : m))
      );
    }
  };

  const addConnection = async (source: string, target: string) => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Optimistic update: Add connection immediately for instant animation
      const tempId = `temp-conn-${Date.now()}-${Math.random()}`;
      const optimisticConnection: Connection = {
        id: tempId,
        source,
        target,
      };
      
      // Check if connection already exists
      const exists = connections.some(c => 
        (c.source === source && c.target === target) || 
        (c.source === target && c.target === source)
      );
      
      if (exists) {
        return; // Don't add duplicate
      }
      
      setConnections(prev => [...prev, optimisticConnection]);
      
      // API call in background
      try {
        const newConnection = await apiService.createConnection(source, target);
        // Replace temp connection with real one
        setConnections(prev => prev.map(c => c.id === tempId ? newConnection : c));
        toast.success('Connection created!');
      } catch (error) {
        console.error('Error creating connection:', error);
        // Rollback optimistic update on error
        setConnections(prev => prev.filter(c => c.id !== tempId));
        toast.error('Failed to create connection.');
        throw error;
      }
    } else {
      // Offline mode
      const newConnection: Connection = {
        id: `connection-${Date.now()}-${Math.random()}`,
        source,
        target,
      };
      setConnections(prev => {
        const exists = prev.some(c => 
          (c.source === source && c.target === target) || 
          (c.source === target && c.target === source)
        );
        if (exists) {
          return prev;
        }
        return [...prev, newConnection];
      });
    }
  };

  const deleteConnection = async (id: string) => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Optimistic update: Remove from UI immediately
      const previousConnections = connections;
      setConnections(prev => prev.filter(c => c.id !== id));
      
      // API call in background
      try {
        await apiService.deleteConnection(id);
        toast.success('Connection deleted!');
      } catch (error) {
        console.error('Error deleting connection:', error);
        // Rollback on error
        setConnections(previousConnections);
        toast.error('Failed to delete connection.');
        throw error;
      }
    } else {
      // Offline mode
      setConnections(prev => prev.filter(c => c.id !== id));
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const clearAllData = () => {
    setMemories([]);
    setConnections([]);
    setDataLoaded(false);
    setHasMore(true);
    // Remove user-specific cache on logout
    const cacheKey = getCacheKey();
    localStorage.removeItem(cacheKey);
    // Also remove old non-user-specific cache if exists
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <MemoryContext.Provider
      value={{
        memories,
        connections,
        darkMode,
        loading,
        hasMore,
        addMemory,
        updateMemory,
        deleteMemory,
        updateMemoryPosition,
        addConnection,
        deleteConnection,
        toggleDarkMode,
        refreshData,
        loadMoreMemories,
        clearAllData,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error('useMemory must be used within MemoryProvider');
  }
  return context;
};
