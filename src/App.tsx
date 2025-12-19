import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MemoryProvider } from './context/MemoryContext';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import MemoryGraph from './pages/MemoryGraph';
import Album from './pages/Album';
import Account from './pages/Account';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import './utils/sampleData'; // Import for window.loadSampleData()
import './App.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = localStorage.getItem('memolink_current_user');
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Auth Route Component (redirect to dashboard if already logged in)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentUser = localStorage.getItem('memolink_current_user');
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Home Route Component (show dashboard if logged in, home if not)
const HomeRoute: React.FC = () => {
  const currentUser = localStorage.getItem('memolink_current_user');
  
  if (currentUser) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <Home />;
};

function App() {
  return (
    <ErrorBoundary>
      <MemoryProvider>
        <Router>
          <Routes>
          {/* Home Page - redirects to dashboard if logged in */}
          <Route path="/" element={<HomeRoute />} />

          {/* Auth Routes */}
          <Route path="/login" element={
            <AuthRoute>
              <Login />
            </AuthRoute>
          } />
          <Route path="/signup" element={
            <AuthRoute>
              <Signup />
            </AuthRoute>
          } />
          <Route path="/forgot-password" element={
            <AuthRoute>
              <ForgotPassword />
            </AuthRoute>
          } />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <div className="App">
                <Header />
                <Navbar />
                <main className="main-content">
                  <Dashboard />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/graph" element={
            <ProtectedRoute>
              <div className="App">
                <Header />
                <Navbar />
                <main className="main-content">
                  <MemoryGraph />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/album" element={
            <ProtectedRoute>
              <div className="App">
                <Header />
                <Navbar />
                <main className="main-content">
                  <Album />
                </main>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/account" element={
            <ProtectedRoute>
              <div className="App">
                <Header />
                <Navbar />
                <main className="main-content">
                  <Account />
                </main>
              </div>
            </ProtectedRoute>
          } />
          </Routes>
        </Router>
      </MemoryProvider>
    </ErrorBoundary>
  );
}

export default App;
