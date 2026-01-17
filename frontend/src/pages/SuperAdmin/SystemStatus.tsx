import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const BACKEND = import.meta.env.VITE_API_URL || 'http://localhost:5001';

interface SystemVitals {
  mongoStatus: {
    state: number; // 0: disconnected, 1: connected, 2: connecting, 3: disconnecting
    host: string;
    name: string;
  };
  system: {
    uptime: number;
    totalMem: number;
    freeMem: number;
    loadAvg: number[];
    platform: string;
    cpus: number;
  };
}

const SystemStatus: React.FC = () => {
  const [vitals, setVitals] = useState<SystemVitals | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchVitals = () => {
    const role = localStorage.getItem('gradedge_role');
    const token = localStorage.getItem('gradedge_token');

    if (role !== 'SuperAdmin') {
      window.location.href = '/login';
      return;
    }

    fetch(`${BACKEND}/superadmin/system-vitals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((r) => r.json())
      .then((b) => {
        if (b.success) {
          setVitals(b.data);
          setError('');
        } else {
          setError(b.message || 'Failed to fetch vitals');
        }
        setLoading(false);
        setLastUpdated(new Date());
      })
      .catch((err) => {
        setError('Network error');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVitals();
    const interval = setInterval(fetchVitals, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Byte';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const getMongoStateLabel = (state: number) => {
    switch (state) {
      case 0: return { text: 'Disconnected', color: 'text-red-600', bg: 'bg-red-100' };
      case 1: return { text: 'Connected', color: 'text-green-600', bg: 'bg-green-100' };
      case 2: return { text: 'Connecting', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      case 3: return { text: 'Disconnecting', color: 'text-orange-600', bg: 'bg-orange-100' };
      default: return { text: 'Unknown', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  if (loading && !vitals) {
    return <div className="min-h-screen bg-red-50 flex items-center justify-center text-red-700">Loading System Vitals...</div>;
  }

  const mongoState = vitals ? getMongoStateLabel(vitals.mongoStatus.state) : { text: 'Unknown', color: '', bg: '' };

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-red-700">System Vitals</h2>
          <div className="text-sm text-gray-500">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded shadow">
            Error: {error}
          </div>
        )}

        {vitals && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MongoDB Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2"></span> MongoDB Status
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Connection State</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${mongoState.color} ${mongoState.bg}`}>
                    {mongoState.text}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Database Name</span>
                  <span className="font-mono font-medium text-gray-800">{vitals.mongoStatus.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Host</span>
                  <span className="font-mono text-sm text-gray-500">{vitals.mongoStatus.host}</span>
                </div>
              </div>
            </div>

            {/* System Resources Card */}
            <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <span className="mr-2"></span> Server Resources
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Operating System</span>
                  <span className="font-medium text-gray-800 capitalize">{vitals.system.platform}</span>
                </div>
                 <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">CPUs</span>
                  <span className="font-medium text-gray-800">{vitals.system.cpus} Cores</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-gray-600">Memory Usage</span>
                  <div className="text-right">
                    <div className="font-medium text-gray-800">
                      {formatBytes(vitals.system.totalMem - vitals.system.freeMem)} / {formatBytes(vitals.system.totalMem)}
                    </div>
                    <div className="w-32 h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="h-full bg-blue-500" 
                        style={{ width: `${((vitals.system.totalMem - vitals.system.freeMem) / vitals.system.totalMem) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Server Uptime</span>
                  <span className="font-medium text-gray-800">{formatUptime(vitals.system.uptime)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8">
            <Link to="/superadmin/dashboard" className="inline-block px-6 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition-colors">
              ← Back to Dashboard
            </Link>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
