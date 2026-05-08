import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { PlaceholderPage } from '@varshyl/team-management/client';

function HomePage(): React.ReactElement {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">varshyl-toolkit</h1>
        <p className="text-slate-500 text-sm">Demo host — verification harness. Not a product.</p>
      </div>

      <div className="flex gap-4">
        <a
          href="/api/health"
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          /api/health
        </a>
        <a
          href="/api/team/health"
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition-colors"
          target="_blank"
          rel="noreferrer"
        >
          /api/team/health
        </a>
        <Link
          to="/team"
          className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-500 transition-colors"
        >
          /team →
        </Link>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        varshyl-toolkit v0.0.1 · Bootstrap milestone
      </p>
    </div>
  );
}

export default function App(): React.ReactElement {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/team" element={<PlaceholderPage />} />
    </Routes>
  );
}
