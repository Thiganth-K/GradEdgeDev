import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import API_BASE_URL from '../../lib/api';

const BACKEND = API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5001';
const STORAGE_KEY = 'faculty_test_creation_draft';

const FacultyTestEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const loadAndRedirect = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('faculty_token') : null;
      if (!token) { navigate('/login'); return; }
      try {
        const res = await fetch(`${BACKEND}/faculty/tests/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body.success) { alert('Failed to load test for editing'); navigate('/faculty/tests'); return; }
        const t = body.data;
        // Map to draft shape used by create pages
        const draft = {
          editId: t._id,
          name: t.name,
          type: t.type,
          batchIds: t.assignedBatches || t.batchIds || [],
          durationMinutes: t.durationMinutes || 30,
          startTime: t.startTime || null,
          endTime: t.endTime || null,
          libraryQuestionIds: t.libraryQuestionIds || [],
          customQuestions: t.customQuestions || [],
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
        navigate('/faculty/tests/create');
      } catch (e) {
        console.error(e);
        alert('Failed to load test for editing');
        navigate('/faculty/tests');
      }
    };
    loadAndRedirect();
  }, [id]);

  return <div className="p-8">Preparing editor...</div>;
};

export default FacultyTestEdit;
