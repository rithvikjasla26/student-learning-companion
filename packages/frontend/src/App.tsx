import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">
          Student Learning Companion
        </h1>
        <p className="text-center text-gray-600 mb-12">
          AI-powered learning for CBSE students
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature Cards */}
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
            🚀 Welcome! The app is being built. More features coming soon...
          </p>
        </div>
      </div>
    </div>
  )
}
