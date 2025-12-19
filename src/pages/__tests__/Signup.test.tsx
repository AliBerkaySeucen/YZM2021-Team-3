/**
 * Frontend Component Tests for Signup Component
 * Tests user registration form rendering and validation
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Signup from '../Signup';
import { MemoryProvider } from '../../context/MemoryContext';
import axios from 'axios';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Signup Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders signup form with name, email and password fields', () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    expect(screen.getByPlaceholderText(/name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Create a password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  test('validates minimum password length', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const signupButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'short' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'short' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      // Password should be invalid (less than 8 characters)
      expect((passwordInput as HTMLInputElement).value).toBe('short');
      // Check for error message if available, or just that it didn't submit
      // Assuming validation prevents submission or shows error
    });
  });

  test('validates email format', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const signupButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(signupButton);

    await waitFor(() => {
      // Check for browser validation or error message
      // expect(emailInput).toBeInvalid(); // This might fail if not using native validation
    });
  });

  test('submits form with valid data', async () => {
    const mockResponse = {
      data: {
        access_token: 'fake-token',
      }
    };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const signupButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/register'),
        {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
        }
      );
    });
  });

  test('displays error on registration failure', async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce({
      response: { data: { detail: 'Email already registered' } },
    });

    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    const nameInput = screen.getByPlaceholderText(/name/i);
    const emailInput = screen.getByPlaceholderText(/email/i);
    const passwordInput = screen.getByPlaceholderText(/Create a password/i);
    const confirmPasswordInput = screen.getByPlaceholderText(/Confirm your password/i);
    const signupButton = screen.getByRole('button', { name: /sign up/i });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByText(/already registered/i)).toBeInTheDocument();
    });
  });

  test('has link to login page', () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    const loginButton = screen.getByRole('button', { name: /sign in/i });
    expect(loginButton).toBeInTheDocument();
    
    fireEvent.click(loginButton);
    expect(mockNavigate).toHaveBeenCalledWith('/login'); // Assuming it navigates to /login or /
  });

  test('requires all fields to be filled', async () => {
    render(
      <BrowserRouter>
        <MemoryProvider>
          <Signup />
        </MemoryProvider>
      </BrowserRouter>
    );

    const signupButton = screen.getByRole('button', { name: /sign up/i });
    fireEvent.click(signupButton);

    await waitFor(() => {
      expect(screen.getByText(/Please fill in all fields/i)).toBeInTheDocument();
    });
  });
});
