import React from 'react';
import Sidebar from '../../components/Student/Sidebar';

const StudentProfile: React.FC = () => {
  const raw = typeof window !== 'undefined' ? localStorage.getItem('student_data') : null;
  const student = raw ? JSON.parse(raw) : null;

  const fields: Array<{ label: string; value?: string }> = [
    { label: 'Name', value: student?.name },
    { label: 'Username', value: student?.username },
    { label: 'Registration No.', value: student?.regno },
    { label: 'Department', value: student?.dept },
    { label: 'Email', value: student?.email },
  ];

  return (
    <div className="min-h-screen flex bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">My Profile</h1>
          <div className="bg-white rounded shadow divide-y">
            {fields.map((f) => (
              <div key={f.label} className="flex items-center justify-between p-4">
                <span className="text-gray-600">{f.label}</span>
                <span className="font-medium">{f.value || '-'}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentProfile;
