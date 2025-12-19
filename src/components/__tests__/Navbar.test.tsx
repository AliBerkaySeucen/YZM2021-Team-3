/**
 * Frontend Component Tests for Navbar Component
 * Tests navigation and user menu functionality
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Navbar from '../../components/Navbar';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/dashboard' }),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  test('renders navigation links', () => {
    localStorage.setItem('memolink_token', 'fake-token');

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    expect(screen.getByTitle('Dashboard')).toBeInTheDocument();
    expect(screen.getByTitle('Album')).toBeInTheDocument();
    expect(screen.getByTitle('Your Graph')).toBeInTheDocument();
    expect(screen.getByTitle('Account')).toBeInTheDocument();
  });

  test('navigates to dashboard on dashboard icon click', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const dashboardLink = screen.getByTitle('Dashboard');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');
  });

  test('highlights active navigation link', () => {
    localStorage.setItem('token', 'fake-token');

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const dashboardLink = screen.getByTitle('Dashboard');
    expect(dashboardLink).toHaveClass('active');
  });

  test('has link to account page', () => {
    localStorage.setItem('token', 'fake-token');

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const accountLink = screen.getByTitle('Account');
    expect(accountLink).toHaveAttribute('href', '/account');
  });

  test('highlights active navigation link', () => {
    localStorage.setItem('token', 'fake-token');

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const dashboardLink = screen.getByTitle('Dashboard');
    expect(dashboardLink).toHaveClass('active');
  });

  test('has link to account page', () => {
    localStorage.setItem('token', 'fake-token');

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const accountLink = screen.getByTitle('Account');
    expect(accountLink).toHaveAttribute('href', '/account');
  });
});
