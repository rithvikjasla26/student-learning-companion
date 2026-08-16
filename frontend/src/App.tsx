import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  Student Learning Companion
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                  AI-powered learning for CBSE students
                </p>
                <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
                  <p className="text-gray-700 mb-4">
                    🚀 MVP in progress - Check back soon!
                  </p>
                  <p className="text-sm text-gray-500">
                    Phases 1 (Scaffolding) being deployed...
                  </p>
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
