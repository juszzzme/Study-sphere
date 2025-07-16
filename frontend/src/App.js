import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { ChatWidgetProvider } from './contexts/ChatWidgetContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ErrorBoundary from './components/ErrorBoundary';

// Immediate load critical components
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';

// Import ResourceHub and GamifiedTracking directly to avoid chunk loading issues
import ResourceHub from './components/ResourceHub';
import GamifiedTracking from './components/GamifiedTracking';
import SwipeMaster from './components/SwipeMaster';

// Lazy load other components
const Dashboard = lazy(() => import('./components/Dashboard'));
const ChatRoom = lazy(() => import('./components/ChatRoom/ChatRoom'));
const ChatRoomsList = lazy(() => import('./components/ChatRoomsList'));
const PomodoroTimer = lazy(() => import('./components/PomodoroTimer'));
const InteractiveWhiteboard = lazy(() => import('./components/InteractiveWhiteboard'));
const CalendarIntegration = lazy(() => import('./components/CalendarIntegration'));

// ErrorBoundary component has been moved to separate file

const App = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <SocketProvider>
            <ChatWidgetProvider>
              <Router
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true
                }}
              >
                <Suspense fallback={<div>Loading...</div>}>
                  <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/dashboard" element={
                    <PrivateRoute>
                      <Dashboard />
                    </PrivateRoute>
                  } />
                  <Route path="/chat/:roomId" element={
                    <PrivateRoute>
                      <ChatRoom />
                    </PrivateRoute>
                  } />
                  <Route path="/chat-rooms" element={
                    <PrivateRoute>
                      <ChatRoomsList />
                    </PrivateRoute>
                  } />
                  <Route path="/pomodoro" element={
                    <PrivateRoute>
                      <PomodoroTimer />
                    </PrivateRoute>
                  } />
                  <Route path="/gamified-tracking" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <GamifiedTracking />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  <Route path="/tracking" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <GamifiedTracking />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  <Route path="/resource-hub" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <ResourceHub />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  <Route path="/resources" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <ResourceHub />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  <Route path="/whiteboard" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <InteractiveWhiteboard />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  <Route path="/calendar" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <CalendarIntegration />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  <Route path="/swipemaster" element={
                    <PrivateRoute>
                      <ErrorBoundary>
                        <SwipeMaster />
                      </ErrorBoundary>
                    </PrivateRoute>
                  } />
                  </Routes>
                </Suspense>
                <ToastContainer />
                {/* ChatWidget removed from global level - individual components handle their own chat widgets */}
              </Router>
            </ChatWidgetProvider>
          </SocketProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
