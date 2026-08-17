import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parentService } from '../services/parent.service';

export const LinkChildPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !studentId.trim()) {
      setError('Please enter both invite code and student ID');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await parentService.verifyInviteCode(code.toUpperCase(), studentId);

      if (result.success) {
        setSuccess(true);
        setCode('');
        setStudentId('');
        // Redirect back to home/parent dashboard after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to link child');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Link a Child</h1>
          <p className="text-gray-600">Connect your child's account to monitor their progress</p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-green-900 mb-2">Child Linked Successfully!</h2>
            <p className="text-green-700 mb-6">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8">
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Invite Code Input */}
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Get this code from your child or request a new one from your account
                </p>
              </div>

              {/* Student ID Input */}
              <div>
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Student ID
                </label>
                <input
                  id="studentId"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter child's student ID"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Ask your child or their teacher for their Student ID
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>How it works:</strong> Use the invite code you generated in your account settings along with your child's student ID to link them.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !code.trim() || !studentId.trim()}
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {isLoading ? 'Linking...' : 'Link Child'}
              </button>

              {/* Back Link */}
              <button
                type="button"
                onClick={() => navigate('/parent')}
                className="w-full text-blue-600 font-semibold py-2 hover:text-blue-700"
              >
                Back to Dashboard
              </button>
            </form>

            {/* Tips Section */}
            <div className="mt-8 pt-8 border-t">
              <h3 className="font-semibold text-gray-900 mb-4">Tips:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✓ Invite codes are 6 characters and expire after 7 days</li>
                <li>✓ Invite codes can only be used once</li>
                <li>✓ Make sure you have the correct Student ID</li>
                <li>✓ Once linked, you can view your child's progress anytime</li>
                <li>✓ You can generate a new invite code from your parent dashboard</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
