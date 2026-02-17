import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Faculty/Sidebar';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface Student {
  _id: string;
  username: string;
  name?: string;
  email?: string;
  status: 'pending' | 'started' | 'completed';
  score?: number;
  correctCount?: number;
  total?: number;
  completedAt?: string;
  startedAt?: string;
}

interface FRITestSchedule {
  _id: string;
  friTestId: any;
  friTestName: string;
  description?: string;
  totalQuestions: number;
  testDurationMinutes: number;
  scheduledDate: string;
  scheduledEndDate?: string;
  status: string;
  instructions?: string;
  students: Student[];
  statistics: {
    total: number;
    completed: number;
    started: number;
    pending: number;
  };
  aptitudePercentage?: number;
  technicalPercentage?: number;
  psychometricPercentage?: number;
}

const FacultyAssignedTests: React.FC = () => {
  const [tests, setTests] = useState<any[]>([]);
  const [friTests, setFriTests] = useState<FRITestSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedFriTest, setExpandedFriTest] = useState<string | null>(null);
  const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;

  const load = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // Load regular tests
      const res = await fetch(`${BACKEND}/institution/faculty/tests`, { headers: { Authorization: `Bearer ${token}` } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) setTests(body.data || []);

      // Load FRI test schedules
      const friRes = await fetch(`${BACKEND}/faculty/fri-tests`, { headers: { Authorization: `Bearer ${token}` } });
      const friBody = await friRes.json().catch(() => ({}));
      if (friRes.ok && friBody.success) setFriTests(friBody.data || []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggleFriTest = (testId: string) => {
    setExpandedFriTest(expandedFriTest === testId ? null : testId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'started': return 'text-yellow-600 bg-yellow-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return '✓ Completed';
      case 'started': return '⏳ In Progress';
      case 'pending': return '⏸ Pending';
      default: return status;
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 h-screen overflow-y-auto">
        <div className="p-8 max-w-6xl mx-auto">
          {/* FRI Tests Section */}
          {friTests.length > 0 && (
            <section className="bg-white rounded shadow p-5 mb-6">
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                🏆 FRI Tests Assigned to You
                <span className="text-sm font-normal text-gray-600">({friTests.length})</span>
              </h2>
              <div className="space-y-3">
                {friTests.map((friTest) => (
                  <div key={friTest._id} className="border rounded-lg overflow-hidden">
                    {/* FRI Test Header */}
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-b">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">{friTest.friTestName}</span>
                            <span className="inline-block text-xs bg-purple-600 text-white px-2 py-1 rounded font-medium">
                              🏆 FRI Test
                            </span>
                            <span className={`inline-block text-xs px-2 py-1 rounded font-medium ${
                              friTest.status === 'active' ? 'bg-green-100 text-green-700' :
                              friTest.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                              friTest.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {friTest.status.toUpperCase()}
                            </span>
                          </div>
                          {friTest.description && (
                            <p className="text-sm text-gray-600 mb-2">{friTest.description}</p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                            <span>📝 {friTest.totalQuestions} questions</span>
                            <span>⏱️ {friTest.testDurationMinutes} minutes</span>
                            <span>📅 Scheduled: {new Date(friTest.scheduledDate).toLocaleDateString()}</span>
                          </div>
                          {(friTest.aptitudePercentage || friTest.technicalPercentage || friTest.psychometricPercentage) && (
                            <div className="mt-2 flex gap-2 text-xs">
                              {friTest.aptitudePercentage > 0 && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                  Aptitude: {friTest.aptitudePercentage}%
                                </span>
                              )}
                              {friTest.technicalPercentage > 0 && (
                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                                  Technical: {friTest.technicalPercentage}%
                                </span>
                              )}
                              {friTest.psychometricPercentage > 0 && (
                                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                  Psychometric: {friTest.psychometricPercentage}%
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => toggleFriTest(friTest._id)}
                          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                        >
                          {expandedFriTest === friTest._id ? '▲ Hide Students' : '▼ View Students'}
                        </button>
                      </div>

                      {/* Statistics Bar */}
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className="bg-white rounded p-2 text-center">
                          <div className="text-2xl font-bold text-gray-700">{friTest.statistics.total}</div>
                          <div className="text-xs text-gray-600">Total Students</div>
                        </div>
                        <div className="bg-green-50 rounded p-2 text-center">
                          <div className="text-2xl font-bold text-green-700">{friTest.statistics.completed}</div>
                          <div className="text-xs text-green-600">Completed</div>
                        </div>
                        <div className="bg-yellow-50 rounded p-2 text-center">
                          <div className="text-2xl font-bold text-yellow-700">{friTest.statistics.started}</div>
                          <div className="text-xs text-yellow-600">In Progress</div>
                        </div>
                        <div className="bg-gray-50 rounded p-2 text-center">
                          <div className="text-2xl font-bold text-gray-700">{friTest.statistics.pending}</div>
                          <div className="text-xs text-gray-600">Pending</div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Student List */}
                    {expandedFriTest === friTest._id && (
                      <div className="p-4 bg-gray-50">
                        <h3 className="font-semibold mb-3 text-gray-800">Assigned Students ({friTest.students.length})</h3>
                        {friTest.students.length === 0 ? (
                          <p className="text-sm text-gray-600">No students assigned yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-200">
                                <tr>
                                  <th className="text-left p-2 font-semibold">Student Name</th>
                                  <th className="text-left p-2 font-semibold">Username</th>
                                  <th className="text-left p-2 font-semibold">Email</th>
                                  <th className="text-center p-2 font-semibold">Status</th>
                                  <th className="text-center p-2 font-semibold">Score</th>
                                  <th className="text-left p-2 font-semibold">Completion Date</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y">
                                {friTest.students.map((student) => (
                                  <tr key={student._id} className="hover:bg-gray-50">
                                    <td className="p-2">{student.name || 'N/A'}</td>
                                    <td className="p-2">{student.username}</td>
                                    <td className="p-2 text-gray-600">{student.email || 'N/A'}</td>
                                    <td className="p-2 text-center">
                                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getStatusColor(student.status)}`}>
                                        {getStatusBadge(student.status)}
                                      </span>
                                    </td>
                                    <td className="p-2 text-center font-medium">
                                      {student.status === 'completed' 
                                        ? `${student.correctCount || 0}/${student.total || 0} (${student.score || 0}%)` 
                                        : '-'}
                                    </td>
                                    <td className="p-2 text-gray-600">
                                      {student.completedAt 
                                        ? new Date(student.completedAt).toLocaleString() 
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                        <div className="mt-4 text-right">
                          <button 
                            onClick={() => (window.location.href = `/faculty/test/${friTest._id}/results`)}
                            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition"
                          >
                            View Detailed Results
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Regular Tests Section */}
          <section className="bg-white rounded shadow p-5">
            <h2 className="text-2xl font-semibold mb-4">Regular Assigned Tests</h2>
            <div className="space-y-3">
              {loading && <p className="text-sm text-gray-600">Loading...</p>}
              {!loading && tests.length === 0 && friTests.length === 0 && <p className="text-sm text-gray-600">No tests assigned yet.</p>}
              {!loading && tests.length === 0 && friTests.length > 0 && <p className="text-sm text-gray-600">No regular tests assigned yet.</p>}
              {tests.map((t:any) => (
                <div key={t._id} className="flex items-center justify-between border rounded p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{t.name} ({t.type})</span>
                      {t.isInstitutionGraded && (
                        <span className="inline-block text-xs bg-blue-600 text-white px-2 py-0.5 rounded font-medium">
                          Institution Graded Test
                        </span>
                      )}
                      {t.isFacultyGraded && (
                        <span className="inline-block text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                          Faculty Graded Test
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Questions: {t.questions?.length || 0}</div>
                  </div>
                  <button onClick={() => (window.location.href = `/faculty/test/${t._id}/results`)} className="px-3 py-2 border rounded">View Results</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FacultyAssignedTests;
