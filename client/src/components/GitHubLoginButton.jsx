// client/src/components/GitHubLoginButton.tsx
import React, { useState } from 'react';

export default function GitHubLoginButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    console.log('[login] Redirecting browser → http://localhost:3000/api/auth/github/login');
    setLoading(true);
    // Navigate to backend route for OAuth
    window.location.href = 'http://localhost:3000/api/auth/github/login';
  };

  return (
    <div className="text-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-60"
      >
        {loading ? 'Redirecting…' : 'Sign in with GitHub'}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        You’ll be redirected to GitHub to authorize the app.
      </p>
    </div>
  );
}
