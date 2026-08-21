import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page.
        </p>

        {user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              You are logged in as <strong>{user.role?.toLowerCase()}</strong>
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/dashboard')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition mb-3"
        >
          Go to Dashboard
        </button>

        <button
          onClick={() => navigate('/')}
          className="w-full text-blue-600 hover:text-blue-700 font-semibold py-2"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};
