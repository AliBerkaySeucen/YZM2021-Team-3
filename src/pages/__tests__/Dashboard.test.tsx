/**
 * Frontend Component Tests for Dashboard Component
 * Tests main dashboard rendering and memory management
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from '../Dashboard';
import { MemoryProvider } from '../../context/MemoryContext';
import axios from 'axios';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Dashboard Component', () => {
  const mockMemories = [
    {
      id: '1',
      title: 'Test Memory 1',
      description: 'Description 1',
      image: 'image1.jpg',
      tags: ['tag1', 'tag2'],
      created_at: '2024-12-01',
    },
    {
      id: '2',
      title: 'Test Memory 2',
      description: 'Description 2',
      image: 'image2.jpg',
      tags: ['tag3'],
      created_at: '2024-12-02',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
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

  test('renders dashboard with memories', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Dashboard />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByAltText(/Test Memory 1/i)).toBeInTheDocument();
      expect(screen.getByAltText(/Test Memory 2/i)).toBeInTheDocument();
    });
  });

  test('displays "Add Memory" button', () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Dashboard />
        </MemoryProvider>
      </BrowserRouter>
    );

    const addButton = screen.getByText(/add new memory/i);
    expect(addButton).toBeInTheDocument();
  });

  test('opens memory modal when clicking Add Memory', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Dashboard />
        </MemoryProvider>
      </BrowserRouter>
    );

    const addButton = screen.getByText(/add new memory/i);
    fireEvent.click(addButton);

    await waitFor(() => {
      // Modal should open
      expect(screen.getByPlaceholderText(/Enter your memory's title/i)).toBeInTheDocument();
    });
  });

  test('fetches memories from API on mount', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Dashboard />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/memories')
      );
    });
  });

  test('displays empty state when no memories', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({ data: [] });

    render(
      <BrowserRouter>
        <MemoryProvider>
          <Dashboard />
        </MemoryProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no memories/i)).toBeInTheDocument();
    });
  });


});
