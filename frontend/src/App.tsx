import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/contexts/AuthContext';
import Navbar from '../src/components/Navbar';
import ProtectedRoute from '../src/components/ProtectedRoute';
import HomePage from '../src/pages/HomePage';
import ListingDetailPage from '../src/pages/ListingDetailPage';
import LoginPage from '../src/pages/LoginPage';
import RegisterPage from '../src/pages/RegisterPage';
import HostDashboard from '../src/pages/HostDashboard';
import CreateListingPage from '../src/pages/CreateListingPage';
import BookingsPage from '../src/pages/BookingsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/listing/:id" element={<ListingDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/host/dashboard"
              element={
                <ProtectedRoute requireHost>
                  <HostDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/host/create-listing"
              element={
                <ProtectedRoute requireHost>
                  <CreateListingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <ProtectedRoute>
                  <BookingsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;