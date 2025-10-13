// client/src/pages/InvalidLink.tsx
import React from "react";
import { Link } from "wouter";

export default function InvalidLink() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-2">Link expired or invalid</h2>
        <p className="text-sm text-gray-600 mb-4">
          That magic link is no longer valid. You can request a new one.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/magic-link" className="bg-blue-600 text-white px-4 py-2 rounded-md">
            Request new link
          </Link>
          <Link href="/" className="px-4 py-2 rounded-md border">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
