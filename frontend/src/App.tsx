import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import FeatureDetail from "./pages/FeatureDetail";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AdminDashboard from "./pages/AdminDashboard";
import AdminFamilyDetail from "./pages/AdminFamilyDetail";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check for existing auth token on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    
    // Clean up old admin role data (no longer needed)
    localStorage.removeItem('userRole');
    
    if (token) {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setShowOnboarding(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  const handleGetStarted = () => {
    setShowOnboarding(true);
  };

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Signup />
                )
              }
            />
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" replace />
                ) : showOnboarding ? (
                  <Index onLogout={handleLogout} startOnboarding={true} />
                ) : (
                  <LandingPage onGetStarted={handleGetStarted} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startOnboarding={false} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/calendar"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startOnboarding={false} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/messages"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startOnboarding={false} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/expenses"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startOnboarding={false} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/documents"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startOnboarding={false} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/resources"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startOnboarding={false} />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/settings"
              element={
                isAuthenticated ? (
                  <Index onLogout={handleLogout} startInSettings />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="/features/:slug" element={<FeatureDetail onGetStarted={handleGetStarted} />} />
            <Route
              path="/admin"
              element={
                isAuthenticated ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/admin/families/:familyId"
              element={
                isAuthenticated ? (
                  <AdminFamilyDetail />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
