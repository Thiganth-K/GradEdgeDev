import React from 'react';
import StudentSidebar from '../../components/Student/Sidebar';
import CodingSandboxEditor from '../../components/CodingSandbox/Editor';

const StudentSandbox: React.FC = () => {
    return (
        <div className="min-h-screen flex bg-gray-50">
            <StudentSidebar />
            <main className="flex-1 p-6 h-screen flex flex-col">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Coding Playground</h1>
                    <p className="text-gray-600 mt-1">Practice your coding skills in a real-time environment.</p>
                </div>
                <div className="flex-1 min-h-[600px] h-full"> 
                    <CodingSandboxEditor />
                </div>
            </main>
        </div>
    );
};

export default StudentSandbox;
