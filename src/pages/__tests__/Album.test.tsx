/**
 * Frontend Component Tests for Album Component
 * Tests memory grid/album view functionality
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Album from '../Album';
import { MemoryProvider } from '../../context/MemoryContext';
import axios from 'axios';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Album Component', () => {
  const mockMemories = [
    {
      id: '1',
      title: 'Memory 1',
      description: 'Description 1',
      image: 'https://example.com/image1.jpg',
      tags: ['vacation', 'summer'],
      date: '2024-12-01',
      created_at: '2024-12-01',
    },
    {
      id: '2',
      title: 'Memory 2',
      description: 'Description 2',
      image: 'https://example.com/image2.jpg',
      tags: ['work', 'project'],
      date: '2024-12-02',
      created_at: '2024-12-02',
    },
    {
      id: '3',
      title: 'Memory 3',
      description: 'Description 3',
      image: 'https://example.com/image3.jpg',
      tags: ['vacation', 'winter'],
      date: '2024-12-03',
      created_at: '2024-12-03',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('memolink_token', 'fake-token');
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/memories')) {
        return Promise.resolve({ data: mockMemories });
      }
      if (url.includes('/connections')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: [] });
    });
  });

  test('renders album grid with memories', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Memory 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory 2/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory 3/i)).toBeInTheDocument();
    });
  });

  test('displays memory images', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(3);
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
    });
  });

  test('filters memories by tag', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Memory 1/i)).toBeInTheDocument();
    });

    // Click on vacation tag
    const vacationTag = screen.getByRole('button', { name: 'vacation' });
    fireEvent.click(vacationTag);

    await waitFor(() => {
      expect(screen.getByText(/Memory 1/i)).toBeInTheDocument();
      expect(screen.getByText(/Memory 3/i)).toBeInTheDocument();
      expect(screen.queryByText(/Memory 2/i)).not.toBeInTheDocument();
    });
  });

  test('sorts memories by date', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Memory 1/i)).toBeInTheDocument();
    });

    const sortSelect = screen.getByRole('combobox');
    fireEvent.change(sortSelect, { target: { value: 'date-oldest' } });

    await waitFor(() => {
      const memoryTitles = screen.getAllByText(/Memory \d/);
      // Verify sorted order (Memory 3 is oldest in mock data? No, Memory 1 is 2024-12-01, Memory 3 is 2024-12-03)
      // Wait, mock data:
      // Memory 1: 2024-12-01
      // Memory 2: 2024-12-02
      // Memory 3: 2024-12-03
      // Oldest first -> Memory 1 should be first.
      // Newest first (default) -> Memory 3 should be first.
      
      // If I change to date-oldest, Memory 1 should be first.
      expect(memoryTitles[0]).toHaveTextContent('Memory 1');
    });
  });

  test('opens memory detail on click', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Memory 1/i)).toBeInTheDocument();
    });

    const memory1 = screen.getByText(/Memory 1/i);
    fireEvent.click(memory1);

    await waitFor(() => {
      // Should show memory details or navigate
      const descriptions = screen.getAllByText(/Description 1/i);
      expect(descriptions.length).toBeGreaterThan(0);
      // Check if modal is open by looking for something specific to the detail view
      expect(screen.getByText(/Memory Date:/i)).toBeInTheDocument();
    });
  });

  test('displays memory tags as badges', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('vacation').length).toBeGreaterThan(0);
      expect(screen.getAllByText('summer').length).toBeGreaterThan(0);
      expect(screen.getAllByText('work').length).toBeGreaterThan(0);
      expect(screen.getAllByText('project').length).toBeGreaterThan(0);
    });
  });



  test('displays empty state when no memories', async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({ data: [] });
    });

    render(
      <BrowserRouter>
        <MemoryProvider>
          <Album />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No memories yet/i)).toBeInTheDocument();
    });
  });
});
