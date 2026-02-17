import React, { useState, useEffect } from 'react';
import { FiCalendar, FiUsers, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

interface FRITest {
  _id: string;
  name: string;
  description?: string;
  aptitudePercentage: number;
  technicalPercentage: number;
  psychometricPercentage: number;
  totalQuestions: number;
  testDurationMinutes: number;
  availableFrom: string;
  availableTo: string;
  isScheduled?: boolean;
}

interface Faculty {
  _id: string;
  username: string;
  role: string;
}

interface Student {
  _id: string;
  username: string;
  name?: string;
}

interface Batch {
  _id: string;
  name: string;
  students: string[];
}

interface FRITestSchedule {
  _id: string;
  friTestId: {
    name: string;
    totalQuestions: number;
    testDurationMinutes: number;
  };
  scheduledDate: string;
  scheduledEndDate?: string;
  assignedFaculty?: {
    username: string;
    role: string;
  };
  status: string;
  totalAssignedStudents: number;
  totalCompleted: number;
}

const FRITestScheduling: React.FC = () => {
  const [availableTests, setAvailableTests] = useState<FRITest[]>([]);
  const [scheduledTests, setScheduledTests] = useState<FRITestSchedule[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedTest, setSelectedTest] = useState<FRITest | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'scheduled'>('available');
  const [loading, setLoading] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    scheduledDate: '',
    scheduledEndDate: '',
    assignedFaculty: '',
    assignedStudents: [] as string[],
    assignedBatches: [] as string[],
    instructions: ''
  });

  useEffect(() => {
    fetchAvailableTests();
    fetchScheduledTests();
    fetchFaculties();
    fetchStudents();
    fetchBatches();
  }, []);

  const fetchAvailableTests = async () => {
    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch('http://localhost:5001/institution/fri-tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableTests(data.friTests || []);
      } else {
        setAvailableTests([]);
      }
    } catch (error) {
      console.error('Error fetching available FRI tests:', error);
      setAvailableTests([]);
    }
  };

  const fetchScheduledTests = async () => {
    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch('http://localhost:5001/institution/fri-tests-scheduled', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setScheduledTests(data.schedules || []);
      } else {
        setScheduledTests([]);
      }
    } catch (error) {
      console.error('Error fetching scheduled FRI tests:', error);
      setScheduledTests([]);
    }
  };

  const fetchFaculties = async () => {
    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch('http://localhost:5001/institution/faculties', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFaculties(data.data || []);
      } else {
        setFaculties([]);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setFaculties([]);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch('http://localhost:5001/institution/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data || []);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setStudents([]);
    }
  };

  const fetchBatches = async () => {
    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch('http://localhost:5001/institution/batches', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBatches(data.data || []);
      } else {
        setBatches([]);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      setBatches([]);
    }
  };

  const handleSchedule = (test: FRITest) => {
    setSelectedTest(test);
    setScheduleForm({
      scheduledDate: '',
      scheduledEndDate: '',
      assignedFaculty: '',
      assignedStudents: [],
      assignedBatches: [],
      instructions: ''
    });
    setShowScheduleModal(true);
  };

  const handleStudentToggle = (studentId: string) => {
    setScheduleForm(prev => ({
      ...prev,
      assignedStudents: prev.assignedStudents.includes(studentId)
        ? prev.assignedStudents.filter(id => id !== studentId)
        : [...prev.assignedStudents, studentId]
    }));
  };

  const handleBatchToggle = (batchId: string) => {
    setScheduleForm(prev => ({
      ...prev,
      assignedBatches: prev.assignedBatches.includes(batchId)
        ? prev.assignedBatches.filter(id => id !== batchId)
        : [...prev.assignedBatches, batchId]
    }));
  };

  const handleSubmitSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTest) return;
    
    if (scheduleForm.assignedStudents.length === 0 && scheduleForm.assignedBatches.length === 0) {
      alert('Please select at least one student or batch');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch(`http://localhost:5001/institution/fri-tests/${selectedTest._id}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(scheduleForm)
      });

      if (response.ok) {
        alert('FRI Test scheduled successfully');
        setShowScheduleModal(false);
        fetchAvailableTests();
        fetchScheduledTests();
        setActiveTab('scheduled');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to schedule FRI Test'}`);
      }
    } catch (error) {
      console.error('Error scheduling FRI test:', error);
      alert('Failed to schedule FRI Test');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async (scheduleId: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled FRI Test?')) return;

    try {
      const token = localStorage.getItem('institution_token');
      const response = await fetch(`http://localhost:5001/institution/fri-tests-scheduled/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Scheduled FRI Test cancelled successfully');
        fetchScheduledTests();
        fetchAvailableTests();
      }
    } catch (error) {
      console.error('Error cancelling scheduled FRI test:', error);
      alert('Failed to cancel scheduled FRI Test');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">FRI Test Management</h1>
        <p className="text-gray-600">Foundation Readiness Test - Schedule and manage tests for your students</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('available')}
          className={`pb-2 px-4 font-semibold ${
            activeTab === 'available'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Available Tests ({availableTests.filter(t => !t.isScheduled).length})
        </button>
        <button
          onClick={() => setActiveTab('scheduled')}
          className={`pb-2 px-4 font-semibold ${
            activeTab === 'scheduled'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Scheduled Tests ({scheduledTests.length})
        </button>
      </div>

      {/* Available Tests Tab */}
      {activeTab === 'available' && (
        <div className="grid gap-4">
          {availableTests.filter(test => !test.isScheduled).length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No FRI tests available at the moment</p>
            </div>
          ) : (
            availableTests.filter(test => !test.isScheduled).map(test => (
              <div key={test._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{test.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                  </div>
                  <button
                    onClick={() => handleSchedule(test)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    <FiCalendar /> Schedule Test
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Total Questions</p>
                    <p className="text-lg font-semibold">{test.totalQuestions}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Duration</p>
                    <p className="text-lg font-semibold">{test.testDurationMinutes} min</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Available From</p>
                    <p className="text-xs font-semibold">{formatDate(test.availableFrom)}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-600">Available To</p>
                    <p className="text-xs font-semibold">{formatDate(test.availableTo)}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-4 text-sm">
                  <span>
                    <span className="font-semibold text-blue-600">Aptitude:</span> {test.aptitudePercentage}%
                  </span>
                  <span>
                    <span className="font-semibold text-green-600">Technical:</span> {test.technicalPercentage}%
                  </span>
                  <span>
                    <span className="font-semibold text-purple-600">Psychometric:</span> {test.psychometricPercentage}%
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Scheduled Tests Tab */}
      {activeTab === 'scheduled' && (
        <div className="grid gap-4">
          {scheduledTests.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No scheduled FRI tests</p>
            </div>
          ) : (
            scheduledTests.map(schedule => (
              <div key={schedule._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">{schedule.friTestId.name}</h3>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusColor(schedule.status)}`}>
                      {schedule.status.toUpperCase()}
                    </span>
                  </div>
                  {schedule.status === 'scheduled' && (
                    <button
                      onClick={() => handleCancelSchedule(schedule._id)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-2"
                    >
                      <FiXCircle /> Cancel
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <FiCalendar /> Scheduled Date
                    </p>
                    <p className="text-sm font-semibold">{formatDate(schedule.scheduledDate)}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <FiUsers /> Assigned Students
                    </p>
                    <p className="text-lg font-semibold">{schedule.totalAssignedStudents}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <FiCheckCircle /> Completed
                    </p>
                    <p className="text-lg font-semibold">{schedule.totalCompleted}</p>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <FiClock /> Duration
                    </p>
                    <p className="text-lg font-semibold">{schedule.friTestId.testDurationMinutes} min</p>
                  </div>
                </div>

                {schedule.assignedFaculty && (
                  <div className="mt-4 text-sm">
                    <span className="text-gray-600">Faculty: </span>
                    <span className="font-semibold">{schedule.assignedFaculty.username}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedTest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Schedule FRI Test: {selectedTest.name}</h2>
            
            <form onSubmit={handleSubmitSchedule}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Scheduled Date *</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledDate}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  min={new Date(selectedTest.availableFrom).toISOString().slice(0, 16)}
                  max={new Date(selectedTest.availableTo).toISOString().slice(0, 16)}
                  required
                  className="w-full p-2 border rounded"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be between {formatDate(selectedTest.availableFrom)} and {formatDate(selectedTest.availableTo)}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Scheduled End Date (Optional)</label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledEndDate}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledEndDate: e.target.value }))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Assign Faculty (Optional)</label>
                <select
                  value={scheduleForm.assignedFaculty}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, assignedFaculty: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">-- Select Faculty --</option>
                  {faculties.map(faculty => (
                    <option key={faculty._id} value={faculty._id}>
                      {faculty.username} ({faculty.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Assign Batches</label>
                <div className="border rounded p-3 max-h-40 overflow-y-auto">
                  {batches.map(batch => (
                    <label key={batch._id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={scheduleForm.assignedBatches.includes(batch._id)}
                        onChange={() => handleBatchToggle(batch._id)}
                      />
                      <span className="text-sm">{batch.name} ({batch.students.length} students)</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Assign Individual Students</label>
                <div className="border rounded p-3 max-h-40 overflow-y-auto">
                  {students.map(student => (
                    <label key={student._id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={scheduleForm.assignedStudents.includes(student._id)}
                        onChange={() => handleStudentToggle(student._id)}
                      />
                      <span className="text-sm">{student.username} {student.name ? `(${student.name})` : ''}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Instructions (Optional)</label>
                <textarea
                  value={scheduleForm.instructions}
                  onChange={(e) => setScheduleForm(prev => ({ ...prev, instructions: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border rounded"
                  placeholder="Any special instructions for this test..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FRITestScheduling;
