import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './pages/AuthPage';
import { CheckInPage } from './pages/CheckInPage';
import { TaughtLogPage } from './pages/TaughtLogPage';
import { StudyActivityPage } from './pages/StudyActivityPage';
import { ProgressPage } from './pages/ProgressPage';
import { GoalsPage } from './pages/GoalsPage';
import { LearningHubPage } from './pages/LearningHubPage';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { LinkChildPage } from './pages/LinkChildPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useAuth } from './hooks/useAuth';

// Dashboard page - routes based on user role
const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.role === 'PARENT') {
    return <Navigate to="/parent" replace />;
  }

  return <Navigate to="/progress" replace />;
};

const HomePage = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
        Student Learning Companion
      </h1>
      <p className="text-center text-gray-600 mb-12">
        AI-powered learning for CBSE students
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl mb-3">📝</div>
          <h3 className="font-semibold text-lg mb-2">Daily Check-ins</h3>
          <p className="text-gray-600 text-sm">
            Record what you studied today and get AI-powered feedback
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl mb-3">🎮</div>
          <h3 className="font-semibold text-lg mb-2">Interactive Widgets</h3>
          <p className="text-gray-600 text-sm">
            Practice with flashcards, fill-in-the-blank, and more
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-semibold text-lg mb-2">Progress Tracking</h3>
          <p className="text-gray-600 text-sm">
            Gamified learning with XP, badges, and streaks
          </p>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-gray-500 text-sm">
          🚀 Ready to start learning? <a href="/auth" className="text-blue-600 hover:underline">Sign in here</a>
        </p>
      </div>
    </div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/learning-hub"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <LearningHubPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <ProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkin"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <CheckInPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/taught-log"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <TaughtLogPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-activity"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <StudyActivityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute requiredRole="STUDENT">
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent"
          element={
            <ProtectedRoute requiredRole="PARENT">
              <ParentDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/link"
          element={
            <ProtectedRoute requiredRole="PARENT">
              <LinkChildPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
