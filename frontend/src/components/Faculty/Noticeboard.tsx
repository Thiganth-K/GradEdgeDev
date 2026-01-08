import React from 'react';
import type { Announcement } from './types';

const formatDate = (value: string) => new Date(value).toLocaleString();

type Props = {
  announcements: Announcement[];
  loading?: boolean;
  onRefresh?: () => void;
};

const Noticeboard: React.FC<Props> = ({ announcements, loading = false, onRefresh }) => {
  return (
    <section className="bg-white rounded shadow p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Noticeboard</h2>
        {onRefresh && (
          <button onClick={onRefresh} className="text-sm px-3 py-1 border rounded bg-gray-50 hover:bg-gray-100" disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        )}
      </div>
      {announcements.length === 0 ? (
        <p className="text-gray-600 text-sm">No announcements yet.</p>
      ) : (
        <div className="space-y-3">
          {announcements.map((a, idx) => (
            <div key={`${a.type}-${idx}-${a.title}`} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 text-red-700 uppercase">{a.type}</span>
                  {a.testType && <span className="text-xs text-gray-600">{a.testType}</span>}
                </div>
                <span className="text-xs text-gray-500">{formatDate(a.createdAt)}</span>
              </div>
              <div className="mt-2 text-sm font-medium text-gray-800">{a.title}</div>
              {a.institution && <div className="text-xs text-gray-500 mt-1">Institution: {a.institution}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Noticeboard;
