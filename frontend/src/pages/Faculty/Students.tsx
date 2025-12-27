import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import FacultySidebar from '../../components/Faculty/Sidebar';
import { getJson, postJson } from '../../lib/api';
import { Menu, Search, Filter, Upload, X, Trash2, Edit2, ChevronDown } from 'lucide-react';

// --- Types ---
type Student = {
    full_name: string;
    enrollment_id: string;
    email: string;
    department: string;
    batch_id?: string;
    status: string;
    username: string;
};

type Batch = {
    batch_code: string;
    name: string;
    course: string;
}

export default function FacultyStudents() {
    const { facultyId } = useParams();
    const [students, setStudents] = useState<Student[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    
    // Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Filter State
    const [selectedBatchFilter, setSelectedBatchFilter] = useState('');

    // Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [selectedBatch, setSelectedBatch] = useState('');
    const [uploadStep, setUploadStep] = useState(1);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { loadData(); }, [facultyId]);

    const loadData = async () => {
        if (!facultyId) return;
        setLoading(true);
        try {
            const [studRes, batchRes] = await Promise.all([
                getJson<any>(`/api/faculty/${facultyId}/students`),
                getJson<any>(`/api/faculty/batches?faculty_id=${facultyId}`)
            ]);
            if (studRes.ok && studRes.data) setStudents(studRes.data);
            if (batchRes.ok && batchRes.batches) setBatches(batchRes.batches);
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadFile(file);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/faculty/students/preview-csv', { method: 'POST', body: formData });
            const data = await res.json();
            if (data.ok) { setPreviewData(data.rows); setUploadStep(2); }
        } catch (error) { alert('Failed to preview CSV'); }
    };

    const confirmImport = async () => {
        if (!selectedBatch) return alert('Please select a batch');
        try {
            await postJson('/api/faculty/students/import', { students: previewData, batch_id: selectedBatch, faculty_id: facultyId });
            setShowUploadModal(false); setUploadFile(null); setPreviewData([]); setUploadStep(1); loadData();
        } catch (error) { alert('Import failed'); }
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = (s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.enrollment_id?.toLowerCase().includes(search.toLowerCase()));
        const matchesBatch = selectedBatchFilter ? s.batch_id === selectedBatchFilter : true;
        return matchesSearch && matchesBatch;
    });

    return (
        <div className="flex min-h-screen bg-[#F4F7FE] font-sans">
            {/* Responsive Sidebar */}
            <FacultySidebar 
                facultyId={facultyId || ''} 
                onLogout={() => window.location.href='/'} 
                isCollapsed={isSidebarCollapsed}
                toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                isMobileOpen={isMobileSidebarOpen}
                setIsMobileOpen={setIsMobileSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 relative">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-100 sticky top-0 z-20">
                   <div className="flex items-center gap-3">
                      <button onClick={() => setIsMobileSidebarOpen(true)} className="p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-lg">
                         <Menu size={24} />
                      </button>
                      <h1 className="text-lg font-bold text-slate-900">Students</h1>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-slate-200"></div> 
                </div>

                <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">STUDENTS</h1>
                            <p className="text-slate-500 text-sm mt-1">Manage and track all enrolled students.</p>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={() => setShowUploadModal(true)}
                                className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm"
                            >
                                <Upload size={18} />
                                Import CSV
                            </button>
                            <button className="bg-[#EA0029] text-white px-5 py-2.5 rounded-xl hover:bg-rose-700 transition-all font-semibold text-sm shadow-lg shadow-rose-200">
                                + Add Student
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 mb-6 flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by name or reg no..." 
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-[#EA0029]/10 outline-none text-sm font-medium text-slate-700 placeholder:text-slate-400"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        
                        <div className="relative min-w-[180px]">
                           <select
                                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-semibold text-slate-700 outline-none hover:bg-slate-100 cursor-pointer"
                                value={selectedBatchFilter}
                                onChange={e => setSelectedBatchFilter(e.target.value)}
                            >
                                <option value="">All Batches</option>
                                {batches.map(b => (
                                    <option key={b.batch_code} value={b.batch_code}>{b.name}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100 text-xs uppercase text-slate-400 font-bold tracking-wider">
                                        <th className="px-6 py-4">Name</th>
                                        <th className="px-6 py-4">Register No</th>
                                        <th className="px-6 py-4">Email</th>
                                        <th className="px-6 py-4">Batch</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">Loading students...</td></tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-12 text-slate-400 font-medium">No students found</td></tr>
                                    ) : (
                                        filteredStudents.map((s, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs ring-4 ring-white">
                                                            {s.full_name?.charAt(0) || 'S'}
                                                        </div>
                                                        <span className="font-semibold text-slate-900 text-sm">{s.full_name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">{s.enrollment_id}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{s.email || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600">
                                                        {s.batch_id || 'Unassigned'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        s.status === 'Inactive' ? 'text-slate-500 bg-slate-100' : 'text-emerald-600 bg-emerald-50'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                                            s.status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500'
                                                        }`}></span>
                                                        {s.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Import Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0">
                                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Import Students</h2>
                                <button onClick={() => setShowUploadModal(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-8 overflow-y-auto custom-scrollbar">
                                {uploadStep === 1 ? (
                                    <div className="space-y-6">
                                        <div 
                                            className="group border-2 border-dashed border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#EA0029]/30 hover:bg-rose-50/30 transition-all"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm shadow-blue-100">
                                                <Upload size={28} />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900">Upload CSV File</h3>
                                            <p className="text-slate-500 text-sm mt-1">Drag & drop or click to browse</p>
                                        </div>
                                        <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                                            <div className="flex items-center gap-3">
                                               <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                                                  <span className="text-xs font-bold">CSV</span>
                                               </div>
                                               <div>
                                                  <p className="text-sm font-bold text-slate-800">Sample Template</p>
                                                  <p className="text-xs text-slate-500">Use this format for import</p>
                                               </div>
                                            </div>
                                            <button className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors">
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-slate-900">Preview Data <span className="text-slate-400 font-medium text-sm ml-2">({previewData.length} records)</span></h3>
                                            <button onClick={() => setUploadStep(1)} className="text-sm font-bold text-[#EA0029] hover:underline">Re-upload</button>
                                        </div>
                                        
                                        <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-3 border-b border-slate-100">Name</th>
                                                        <th className="px-4 py-3 border-b border-slate-100">Reg No</th>
                                                        <th className="px-4 py-3 border-b border-slate-100">Email</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50 bg-white">
                                                    {previewData.slice(0, 50).map((row, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-2 font-medium text-slate-800">{row.full_name}</td>
                                                            <td className="px-4 py-2 font-mono text-slate-500">{row.enrollment_id}</td>
                                                            <td className="px-4 py-2 text-slate-500">{row.email}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-700">Assign to Batch</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full appearance-none p-3.5 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-[#EA0029]/20 font-medium text-slate-700"
                                                    value={selectedBatch}
                                                    onChange={e => setSelectedBatch(e.target.value)}
                                                >
                                                    <option value="">Select a Batch...</option>
                                                    {batches.map(b => (
                                                        <option key={b.batch_code} value={b.batch_code}>{b.name} ({b.batch_code})</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                             
                            {uploadStep === 2 && (
                                <div className="px-8 py-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                                    <button onClick={() => setShowUploadModal(false)} className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                                    <button 
                                        onClick={confirmImport}
                                        disabled={!selectedBatch}
                                        className={`px-6 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${
                                            selectedBatch 
                                                ? 'bg-[#EA0029] shadow-red-200 hover:bg-rose-700' 
                                                : 'bg-slate-300 cursor-not-allowed shadow-none'
                                        }`}
                                    >
                                        Confirm Import
                                    </button>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
