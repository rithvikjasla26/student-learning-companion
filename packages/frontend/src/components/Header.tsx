import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  if (!user) {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo/Home */}
        <button
          onClick={() => navigate('/')}
          className="text-xl font-bold text-blue-600 hover:text-blue-700 transition"
        >
          📚 Learning Companion
        </button>

        {/* Navigation Links */}
        <div className="flex items-center gap-6">
          {user.role === 'STUDENT' && (
            <>
              <button
                onClick={() => navigate('/progress')}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Progress
              </button>
              <button
                onClick={() => navigate('/goals')}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Goals
              </button>
              <button
                onClick={() => navigate('/checkin')}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Check-in
              </button>
            </>
          )}

          {user.role === 'PARENT' && (
            <>
              <button
                onClick={() => navigate('/parent')}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/parent/link')}
                className="text-gray-700 hover:text-blue-600 font-medium transition"
              >
                Link Child
              </button>
            </>
          )}

          {/* User Info & Logout */}
          <div className="flex items-center gap-3 border-l pl-6">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user.email}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role?.toLowerCase()}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 text-sm font-medium transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
