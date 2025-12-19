/**
 * Frontend Component Tests for MemoryModal Component
 * Tests memory creation/editing modal functionality
 * NOTE: MemoryModal now uses MemoryContext internally, no onSave prop needed
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoryModal from '../../components/MemoryModal';
import { MemoryProvider } from '../../context/MemoryContext';

// Mock API service
jest.mock('../../services/api', () => ({
  __esModule: true,
  default: {
    createMemory: jest.fn(),
    updateMemory: jest.fn(),
  },
}));

describe('MemoryModal Component', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithProvider = (props: any) => {
    return render(
      <MemoryProvider>
        <MemoryModal {...props} />
      </MemoryProvider>
    );
  };

  test('renders modal when open', () => {
    renderWithProvider({
      isOpen: true,
      onClose: mockOnClose,
    });

    expect(screen.getByText(/add memory/i)).toBeInTheDocument();
  });

  test('does not render when closed', () => {
    renderWithProvider({
      isOpen: false,
      onClose: mockOnClose,
    });

    expect(screen.queryByText(/add memory/i)).not.toBeInTheDocument();
  });

  test('renders all input fields', () => {
    renderWithProvider({
      isOpen: true,
      onClose: mockOnClose,
    });

    expect(screen.getByPlaceholderText(/enter your memory's title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your memory's details/i)).toBeInTheDocument();
  });

  test('closes modal on cancel button click', () => {
    renderWithProvider({
      isOpen: true,
      onClose: mockOnClose,
    });

    const cancelButton = screen.getByText(/cancel/i);
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});
