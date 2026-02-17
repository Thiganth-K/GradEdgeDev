import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar, FiUsers, FiBarChart2 } from 'react-icons/fi';

interface Institution {
  _id: string;
  name: string;
  institutionId: string;
}

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
  targetInstitutions: Institution[];
  easyPercentage: number;
  mediumPercentage: number;
  hardPercentage: number;
  status: 'draft' | 'active' | 'expired' | 'archived';
  createdByUsername: string;
  createdAt: string;
}

const FRITestManagement: React.FC = () => {
  const [friTests, setFriTests] = useState<FRITest[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<FRITest | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    aptitudePercentage: 25,
    technicalPercentage: 25,
    psychometricPercentage: 50,
    totalQuestions: 50,
    testDurationMinutes: 60,
    availableFrom: '',
    availableTo: '',
    targetInstitutions: [] as string[],
    easyPercentage: 33,
    mediumPercentage: 34,
    hardPercentage: 33,
    shuffleQuestions: true,
    showResultsImmediately: false,
    allowReview: false
  });

  useEffect(() => {
    fetchFRITests();
    fetchInstitutions();
  }, []);

  const fetchFRITests = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:5001/admin/fri-tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFriTests(data.friTests || []);
      } else {
        setFriTests([]);
      }
    } catch (error) {
      console.error('Error fetching FRI tests:', error);
      setFriTests([]);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('http://localhost:5001/admin/institutions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setInstitutions(data.institutions || []);
      } else {
        setInstitutions([]);
      }
    } catch (error) {
      console.error('Error fetching institutions:', error);
      setInstitutions([]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? Number(value) : value
    }));
  };

  const handleInstitutionToggle = (institutionId: string) => {
    setFormData(prev => ({
      ...prev,
      targetInstitutions: prev.targetInstitutions.includes(institutionId)
        ? prev.targetInstitutions.filter(id => id !== institutionId)
        : [...prev.targetInstitutions, institutionId]
    }));
  };

  const validatePercentages = () => {
    const categoryTotal = formData.aptitudePercentage + formData.technicalPercentage + formData.psychometricPercentage;
    const difficultyTotal = formData.easyPercentage + formData.mediumPercentage + formData.hardPercentage;
    
    if (categoryTotal !== 100) {
      alert('Category percentages must add up to 100%');
      return false;
    }
    if (difficultyTotal !== 100) {
      alert('Difficulty percentages must add up to 100%');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePercentages()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const url = editingTest 
        ? `http://localhost:5001/admin/fri-tests/${editingTest._id}`
        : 'http://localhost:5001/admin/fri-tests';
      
      const response = await fetch(url, {
        method: editingTest ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editingTest ? 'FRI Test updated successfully' : 'FRI Test created successfully');
        setShowModal(false);
        resetForm();
        fetchFRITests();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to save FRI Test'}`);
      }
    } catch (error) {
      console.error('Error saving FRI test:', error);
      alert('Failed to save FRI Test');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (test: FRITest) => {
    setEditingTest(test);
    setFormData({
      name: test.name,
      description: test.description || '',
      aptitudePercentage: test.aptitudePercentage,
      technicalPercentage: test.technicalPercentage,
      psychometricPercentage: test.psychometricPercentage,
      totalQuestions: test.totalQuestions,
      testDurationMinutes: test.testDurationMinutes,
      availableFrom: new Date(test.availableFrom).toISOString().slice(0, 16),
      availableTo: new Date(test.availableTo).toISOString().slice(0, 16),
      targetInstitutions: test.targetInstitutions.map(i => i._id),
      easyPercentage: test.easyPercentage,
      mediumPercentage: test.mediumPercentage,
      hardPercentage: test.hardPercentage,
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowReview: false
    });
    setShowModal(true);
  };

  const handleDelete = async (testId: string) => {
    if (!confirm('Are you sure you want to archive this FRI Test?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch(`http://localhost:5001/admin/fri-tests/${testId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('FRI Test archived successfully');
        fetchFRITests();
      }
    } catch (error) {
      console.error('Error deleting FRI test:', error);
      alert('Failed to archive FRI Test');
    }
  };

  const resetForm = () => {
    setEditingTest(null);
    setFormData({
      name: '',
      description: '',
      aptitudePercentage: 25,
      technicalPercentage: 25,
      psychometricPercentage: 50,
      totalQuestions: 50,
      testDurationMinutes: 60,
      availableFrom: '',
      availableTo: '',
      targetInstitutions: [],
      easyPercentage: 33,
      mediumPercentage: 34,
      hardPercentage: 33,
      shuffleQuestions: true,
      showResultsImmediately: false,
      allowReview: false
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">FRI Test Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <FiPlus /> Create FRI Test
        </button>
      </div>

      {/* FRI Tests List */}
      <div className="grid gap-4">
        {friTests.map(test => (
          <div key={test._id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{test.name}</h3>
                <p className="text-gray-600 text-sm mt-1">{test.description}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusBadgeColor(test.status)}`}>
                  {test.status.toUpperCase()}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(test)}
                  className="text-blue-600 hover:text-blue-800"
                  title="Edit"
                >
                  <FiEdit2 size={20} />
                </button>
                <button
                  onClick={() => handleDelete(test._id)}
                  className="text-red-600 hover:text-red-800"
                  title="Archive"
                >
                  <FiTrash2 size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
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
                <p className="text-sm font-semibold">{formatDate(test.availableFrom)}</p>
              </div>
              <div className="bg-orange-50 p-3 rounded">
                <p className="text-xs text-gray-600">Available To</p>
                <p className="text-sm font-semibold">{formatDate(test.availableTo)}</p>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Question Distribution:</h4>
              <div className="flex gap-4">
                <span className="text-sm">
                  <span className="font-semibold text-blue-600">Aptitude:</span> {test.aptitudePercentage}%
                </span>
                <span className="text-sm">
                  <span className="font-semibold text-green-600">Technical:</span> {test.technicalPercentage}%
                </span>
                <span className="text-sm">
                  <span className="font-semibold text-purple-600">Psychometric:</span> {test.psychometricPercentage}%
                </span>
              </div>
            </div>

            {test.targetInstitutions && test.targetInstitutions.length > 0 ? (
              <div className="mt-3 bg-blue-50 p-3 rounded">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-2">
                  <FiUsers className="text-blue-600" />
                  Targeted Institutions ({test.targetInstitutions.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {test.targetInstitutions.map((inst) => (
                    <span key={inst._id} className="inline-block px-2 py-1 bg-white rounded text-xs border border-blue-200">
                      {inst.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-green-50 p-3 rounded">
                <span className="text-sm text-green-700 flex items-center gap-2">
                  <FiUsers className="text-green-600" />
                  Available to all institutions
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingTest ? 'Edit FRI Test' : 'Create FRI Test'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Basic Info */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Test Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* Question Distribution */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Question Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Aptitude %</label>
                    <input
                      type="number"
                      name="aptitudePercentage"
                      value={formData.aptitudePercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Technical %</label>
                    <input
                      type="number"
                      name="technicalPercentage"
                      value={formData.technicalPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Psychometric %</label>
                    <input
                      type="number"
                      name="psychometricPercentage"
                      value={formData.psychometricPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {formData.aptitudePercentage + formData.technicalPercentage + formData.psychometricPercentage}% (must be 100%)
                </p>
              </div>

              {/* Test Settings */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Total Questions *</label>
                  <input
                    type="number"
                    name="totalQuestions"
                    value={formData.totalQuestions}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Duration (minutes) *</label>
                  <input
                    type="number"
                    name="testDurationMinutes"
                    value={formData.testDurationMinutes}
                    onChange={handleInputChange}
                    min="1"
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Availability Window */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Available From *</label>
                  <input
                    type="datetime-local"
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Available To *</label>
                  <input
                    type="datetime-local"
                    name="availableTo"
                    value={formData.availableTo}
                    onChange={handleInputChange}
                    required
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Difficulty Distribution</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Easy %</label>
                    <input
                      type="number"
                      name="easyPercentage"
                      value={formData.easyPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Medium %</label>
                    <input
                      type="number"
                      name="mediumPercentage"
                      value={formData.mediumPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Hard %</label>
                    <input
                      type="number"
                      name="hardPercentage"
                      value={formData.hardPercentage}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      required
                      className="w-full p-2 border rounded"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total: {formData.easyPercentage + formData.mediumPercentage + formData.hardPercentage}% (must be 100%)
                </p>
              </div>

              {/* Target Institutions */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">
                  Target Institutions (leave empty for all)
                </label>
                <div className="border rounded p-3 max-h-40 overflow-y-auto">
                  {institutions.map(inst => (
                    <label key={inst._id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.targetInstitutions.includes(inst._id)}
                        onChange={() => handleInstitutionToggle(inst._id)}
                      />
                      <span className="text-sm">{inst.name} ({inst.institutionId})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingTest ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FRITestManagement;
