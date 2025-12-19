export interface Memory {
  id: string;
  title: string;
  description: string;
  image: string;
  createdAt: string;
  position?: { x: number; y: number };
  tags?: string[];
  date?: string; // Custom date for the memory
}

export interface Connection {
  id: string;
  source: string;
  target: string;
}

export interface AppState {
  memories: Memory[];
  connections: Connection[];
  darkMode?: boolean;
}
