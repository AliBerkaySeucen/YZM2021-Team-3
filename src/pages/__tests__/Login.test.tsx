/**
 * Frontend Component Tests for Login Component
 * Tests user authentication form rendering and validation
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Login from '../Login';
import { MemoryProvider } from '../../context/MemoryContext';
import axios from 'axios';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders login form with email and password fields', () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Login />
        </MemoryProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  test('validates email format', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Login />
        </MemoryProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(emailInput).toBeInvalid();
    });
  });

  test('submits form with valid credentials', async () => {
    const mockResponse = {
      data: {
        access_token: 'fake-token',
      }
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <MemoryProvider>
          <Login />
        </MemoryProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.any(Object) // FormData is hard to match exactly
      );
    });
  });

  test('displays error on login failure', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { detail: 'Invalid credentials' } },
    });

    render(
      <BrowserRouter>
        <MemoryProvider>
          <Login />
        </MemoryProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const loginButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'wrong@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  test('has link to signup page', () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Login />
        </MemoryProvider>
      </BrowserRouter>
    );

    const signupButton = screen.getByRole('button', { name: /sign up/i });
    expect(signupButton).toBeInTheDocument();
    
    fireEvent.click(signupButton);
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});
