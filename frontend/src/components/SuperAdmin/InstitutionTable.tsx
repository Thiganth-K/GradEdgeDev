import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Institution {
  _id?: string;
  id?: string;
  name: string;
  location?: string;
  contactNo?: string;
  email?: string;
  createdAt?: string;
}

interface InstitutionTableProps {
  items: Institution[];
  onAdd: () => void;
  viewMode: 'table' | 'grid';
}

const InstitutionTable: React.FC<InstitutionTableProps> = ({ items, onAdd, viewMode }) => {
  const navigate = useNavigate();

  // Mobile/Grid Card Component
  const InstitutionCard = ({ item }: { item: Institution }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-red-500 transform -translate-x-full group-hover:translate-x-0 transition-transform"></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
          <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {item.location || 'N/A'}
          </p>
        </div>
        <span className="px-2 py-1 rounded-md text-xs font-bold bg-green-50 text-green-700 border border-green-100 uppercase">
          Active
        </span>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
           {item.contactNo || 'N/A'}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
           <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
           {item.email || '-'}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
         <span className="text-xs text-gray-400 font-mono">ID: {(item._id || item.id)?.substring(0, 8)}</span>
         <div className="flex gap-2">
            <button 
              onClick={() => navigate(`/superadmin/institutions/edit?id=${item._id || item.id}`)}
              className="p-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <button className="p-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </button>
         </div>
      </div>
    </div>
  );

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className={`hidden md:${viewMode === 'table' ? 'block' : 'hidden'}`}>
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <div className="col-span-4 flex items-center gap-2 cursor-pointer hover:text-gray-700">
            NAME
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
          </div>
          <div className="col-span-3 flex items-center gap-2 cursor-pointer hover:text-gray-700">
            CONTACT
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
          </div>
          <div className="col-span-2 flex items-center gap-2 cursor-pointer hover:text-gray-700">
            STATUS
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" /></svg>
          </div>
          <div className="col-span-3 text-right">
            ACTIONS
          </div>
        </div>

        <div className="bg-white border-x border-b border-gray-200 rounded-b-lg">
          {items.map((item, index) => (
            <React.Fragment key={item._id || item.id || index}>
              <div className="grid grid-cols-12 gap-4 px-6 py-5 border-b border-gray-100 hover:bg-red-50/30 transition-colors group">
                <div className="col-span-4 flex items-start gap-3">
                  <button className="mt-1 text-gray-400 hover:text-red-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-gray-400 text-xs font-mono">{ (item._id || item.id)?.substring(0, 8) }...</span>
                      <button className="text-gray-300 hover:text-gray-500">
                         <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="text-sm font-medium text-gray-900">{item.location || 'N/A'}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{item.email || '-'}</div>
                </div>

                <div className="col-span-2 flex items-center">
                   <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-bold bg-green-700 text-white border border-black-600 uppercase">
                      Active
                   </span>
                </div>

                <div className="col-span-3 flex items-center justify-end gap-3">
                  <div className="text-xs text-gray-400 mr-2">
                    {new Date().toLocaleDateString()}
                  </div>
                  <button 
                    onClick={() => navigate(`/superadmin/institutions/edit?id=${item._id || item.id}`)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button className="p-1.5 text-gray-400 hover:text-gray-800 transition-colors">
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Grid View / Mobile View */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${viewMode === 'table' ? 'md:hidden' : ''}`}>
        {items.map((item, index) => (
          <InstitutionCard key={item._id || item.id || index} item={item} />
        ))}
      </div>
    </div>
  );
};

export default InstitutionTable;
