
import React from 'react';

interface Props {
    username?: string;
    onLogout?: () => void;
}

const InstitutionalWelcome: React.FC<Props> = ({ username, onLogout }) => {
    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Institutional Portal</h1>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            className="text-sm text-red-600 hover:underline"
                        >
                            Logout
                        </button>
                    )}
                </div>
                <p className="text-gray-600 mb-2">Welcome, {username || 'User'}.</p>
                <p className="text-sm text-gray-400">This module is currently under development.</p>
            </div>
        </div>
    );
};

export default InstitutionalWelcome;
