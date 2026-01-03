import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Memory, Connection, AppState } from '../types';
import apiService from '../services/api';

interface MemoryContextType {
  memories: Memory[];
  connections: Connection[];
  darkMode: boolean;
  loading: boolean;
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => Promise<void>;
  updateMemory: (id: string, updates: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  updateMemoryPosition: (id: string, position: { x: number; y: number }) => Promise<void>;
  addConnection: (source: string, target: string) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  toggleDarkMode: () => void;
  refreshData: () => Promise<void>;
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

export const MemoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from cache immediately for instant display
  const [memories, setMemories] = useState<Memory[]>(() => {
    const cacheKey = getCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data: AppState = JSON.parse(cached);
        return data.memories || [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [connections, setConnections] = useState<Connection[]>(() => {
    const cacheKey = getCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data: AppState = JSON.parse(cached);
        return data.connections || [];
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const cacheKey = getCacheKey();
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data: AppState = JSON.parse(cached);
        return data.darkMode || false;
      } catch {
        return false;
      }
    }
    return false;
  });
  const [loading, setLoading] = useState<boolean>(false);

  // Load data from backend or fallback to localStorage
  const refreshData = async () => {
    const token = localStorage.getItem('memolink_token');
    
    if (token) {
      // Data already loaded from cache in initial state, just fetch updates in background
      try {
        const cacheKey = getCacheKey();
        const cached = localStorage.getItem(cacheKey);
        
        // Only show loading if we don't have cached data
        if (!cached) {
          setLoading(true);
        }
        
        // Fetch fresh data in background (silent update)
        const [memoriesResponse, connectionsData] = await Promise.all([
          apiService.getMemories(),
          apiService.getConnections()
        ]);
        
        // Extract memories array from response
        const memoriesData = memoriesResponse.memories || [];
        
        // Update state with fresh data from server
        setMemories(memoriesData);
        setConnections(connectionsData);
        
        // Cache the fresh data with user-specific key
        const dataToSave: AppState = {
          memories: memoriesData,
          connections: connectionsData,
          darkMode
        };
        localStorage.setItem(cacheKey, JSON.stringify(dataToSave));
      } catch (error) {
        console.error('Error loading data from API:', error);
        // Keep showing cached data - no problem
      } finally {
        setLoading(false);
      }
    } else {
      // Load from localStorage (offline mode)
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const cacheKey = getCacheKey();
    const stored = localStorage.getItem(cacheKey);
    if (stored) {
      const data: AppState = JSON.parse(stored);
      setMemories(data.memories || []);
      setConnections(data.connections || []);
      setDarkMode(data.darkMode || false);
    }
  };

  // Initial data load
  useEffect(() => {
    refreshData();
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
        // Replace temp memory with real one from server
        setMemories(prev => prev.map(m => m.id === tempId ? newMemory : m));
      } catch (error) {
        console.error('Error creating memory:', error);
        // Rollback optimistic update on error
        setMemories(prev => prev.filter(m => m.id !== tempId));
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
      } catch (error) {
        console.error('Error updating memory:', error);
        // Rollback on error
        setMemories(previousMemories);
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
      } catch (error) {
        console.error('Error deleting memory:', error);
        // Rollback on error
        setMemories(previousMemories);
        setConnections(previousConnections);
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
      } catch (error) {
        console.error('Error creating connection:', error);
        // Rollback optimistic update on error
        setConnections(prev => prev.filter(c => c.id !== tempId));
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
      } catch (error) {
        console.error('Error deleting connection:', error);
        // Rollback on error
        setConnections(previousConnections);
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
        addMemory,
        updateMemory,
        deleteMemory,
        updateMemoryPosition,
        addConnection,
        deleteConnection,
        toggleDarkMode,
        refreshData,
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
