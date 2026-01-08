import React from 'react';
import type { Batch } from './types';

const formatDate = (value: string) => new Date(value).toLocaleString();

type Props = {
  batches: Batch[];
};

const BatchList: React.FC<Props> = ({ batches }) => {
  return (
    <section className="bg-white rounded shadow p-5">
      <h2 className="text-xl font-semibold mb-4">My Batches</h2>
      {batches.length === 0 ? (
        <p className="text-gray-600 text-sm">No batches assigned.</p>
      ) : (
        <div className="space-y-4">
          {batches.map((b) => (
            <div key={b._id} className="border rounded p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900">{b.name}</div>
                  {b.createdBy && (
                    <div className="text-xs text-gray-500">Institution: {b.createdBy.name || 'N/A'} ({b.createdBy.institutionId || '—'})</div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{formatDate(b.createdAt)}</span>
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-gray-600 mb-1">Students</div>
                {b.students.length === 0 ? (
                  <div className="text-xs text-gray-500">No students assigned</div>
                ) : (
                  <ul className="text-sm text-gray-800 space-y-1">
                    {b.students.map((s) => (
                      <li key={s._id} className="flex items-center justify-between border-b last:border-b-0 pb-1">
                        <span>{s.name || s.username}</span>
                        <span className="text-xs text-gray-500">{s.regno || s.email || s.username}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default BatchList;
