// Sample data for testing MemoLink
// Run this in browser console to add sample memories

export const sampleMemories = [
  {
    id: '1',
    title: 'Memory 1',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et d.',
    image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=400',
    createdAt: new Date('2024-01-15').toISOString(),
    position: { x: -200, y: -100 }
  },
  {
    id: '2',
    title: 'Memory 2',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et d.',
    image: 'https://images.unsplash.com/photo-1528642474498-1af0c17fd8c3?w=400',
    createdAt: new Date('2024-01-20').toISOString(),
    position: { x: 0, y: -150 }
  },
  {
    id: '3',
    title: 'Memory 3',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et d.',
    image: 'https://images.unsplash.com/photo-1542037104857-ffbb0b9155fb?w=400',
    createdAt: new Date('2024-02-01').toISOString(),
    position: { x: 200, y: -100 }
  },
  {
    id: '4',
    title: 'Memory 4',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et d.',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=400',
    createdAt: new Date('2024-02-10').toISOString(),
    position: { x: -100, y: 50 }
  },
  {
    id: '5',
    title: 'Memory 5',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et d.',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    createdAt: new Date('2024-02-15').toISOString(),
    position: { x: 100, y: 100 }
  },
  {
    id: '6',
    title: 'Memory 6',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et d.',
    image: 'https://images.unsplash.com/photo-1533122250115-6bb28e9a48c3?w=400',
    createdAt: new Date('2024-03-01').toISOString(),
    position: { x: 300, y: 50 }
  }
];

export const sampleConnections = [
  { id: '1-2', source: '1', target: '2' },
  { id: '2-3', source: '2', target: '3' },
  { id: '1-4', source: '1', target: '4' },
  { id: '3-5', source: '3', target: '5' },
  { id: '4-5', source: '4', target: '5' },
  { id: '5-6', source: '5', target: '6' }
];

// Function to load sample data
// Usage: Open browser console and run: loadSampleData()
export const loadSampleData = () => {
  const data = {
    memories: sampleMemories,
    connections: sampleConnections
  };
  localStorage.setItem('memolink_data', JSON.stringify(data));
  window.location.reload();
};

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as any).loadSampleData = loadSampleData;
}
