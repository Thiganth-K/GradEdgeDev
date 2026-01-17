import React, { useState } from 'react';
import { FaSearch, FaPlus, FaFilter, FaThLarge, FaCheck, FaCircle, FaEllipsisV } from 'react-icons/fa';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string; 
}

interface SuperAdminTableProps<T> {
  data: T[];
  columns: Column<T>[];
  title: string;
  onAdd?: () => void;
  onDelete?: (selectedIds: (string | number)[]) => void;
  onSearch?: (query: string) => void;
  isLoading?: boolean;
  actions?: (row: T) => React.ReactNode;
}

function SuperAdminTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  title, 
  onAdd, 
  onDelete,
  onSearch, 
  isLoading,
  actions 
}: SuperAdminTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  const toggleRow = (id: string | number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(d => d.id)));
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleDelete = () => {
    if (onDelete && selectedRows.size > 0) {
      if (confirm(`Are you sure you want to delete ${selectedRows.size} items?`)) {
        onDelete(Array.from(selectedRows));
        setSelectedRows(new Set());
        setIsDeleteMode(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-900 rounded-3xl overflow-hidden border border-gray-200 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Actions Toolbar */}
        <div className="flex items-center justify-between w-full gap-4">
          <div className="relative group">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:bg-white transition-all w-full md:w-64 text-gray-700 placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-500 hover:text-gray-900 shadow-sm">
              <FaFilter />
            </button>
             <button className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all text-gray-500 hover:text-gray-900 shadow-sm">
              <FaThLarge />
            </button>

            {onDelete && (
               <button 
                 onClick={() => {
                     if (isDeleteMode && selectedRows.size > 0) {
                         handleDelete();
                     } else {
                         setIsDeleteMode(!isDeleteMode);
                         if (isDeleteMode) setSelectedRows(new Set()); // Clear on exit
                     }
                 }}
                 className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all shadow-lg active:scale-95 ${
                     isDeleteMode && selectedRows.size > 0
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' 
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                 }`}
               >
                 {isDeleteMode && selectedRows.size > 0 ? (
                     <span>Delete ({selectedRows.size})</span>
                 ) : (
                     <span>{isDeleteMode ? 'Cancel' : 'Delete'}</span>
                 )}
               </button>
            )}

            {onAdd && (
              <button 
                onClick={onAdd}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-red-200 active:scale-95"
              >
                <FaPlus size={12} />
                <span>ADD</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-gray-50/80 backdrop-blur-sm z-10 border-b border-gray-100">
            <tr>
              {isDeleteMode && (
                  <th className="p-4 pl-6 w-12 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input 
                      type="checkbox" 
                      checked={data.length > 0 && selectedRows.size === data.length}
                      onChange={toggleAll}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500" 
                    />
                  </th>
              )}
              {columns.map((col, idx) => (
                <th key={idx} className={`p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${col.className || ''} ${idx === 0 ? 'pl-8' : ''} ${!actions && idx === columns.length - 1 ? 'pr-8' : ''}`}>
                  {col.header}
                </th>
              ))}
              {actions && <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-8">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
               <tr>
                 <td colSpan={columns.length + 2} className="p-8 text-center text-gray-500">
                   <div className="animate-pulse flex justify-center gap-2">
                     <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                     <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                     <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
                   </div>
                 </td>
               </tr>
            ) : data.length === 0 ? (
               <tr>
                 <td colSpan={columns.length + 2} className="p-12 text-center text-gray-400">
                   No records found
                 </td>
               </tr>
            ) : (
              data.map((row) => (
                <tr 
                  key={row.id} 
                  className={`
                    group hover:bg-gray-50 transition-colors cursor-pointer
                    ${selectedRows.has(row.id) ? 'bg-red-50' : ''}
                  `}
                  onClick={() => isDeleteMode && toggleRow(row.id)}
                >
                  {isDeleteMode && (
                      <td className="p-4 pl-6 animate-in fade-in slide-in-from-left-2 duration-200">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.has(row.id)}
                          onChange={() => toggleRow(row.id)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"    
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                  )}
                  {columns.map((col, idx) => (
                    <td key={idx} className={`p-4 text-sm text-gray-700 ${idx === 0 ? 'pl-8' : ''} ${!actions && idx === columns.length - 1 ? 'pr-8' : ''}`}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(row) 
                        : (row[col.accessor] as React.ReactNode)
                      }
                    </td>
                  ))}
                  {actions && (
                    <td className="p-4 text-right pr-8">
                         {actions(row)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer Pagination */}
      <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-500">
         <span>Showing 1-{data.length} of {data.length}</span>
         <div className="flex gap-2">
           <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Prev</button>
           <button className="px-3 py-1 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">Next</button>
         </div>
      </div>
    </div>
  );
}

// Helper components for table cells
export const AvatarGroup: React.FC<{ images: string[], limit?: number }> = ({ images, limit = 3 }) => {
    return (
        <div className="flex -space-x-2">
            {images.slice(0, limit).map((src, i) => (
                <img key={i} src={src} alt="Avatar" className="w-8 h-8 rounded-full border-2 border-white object-cover ring-1 ring-gray-100" />
            ))}
            {images.length > limit && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-[10px] text-gray-600 font-bold ring-1 ring-gray-200">
                    +{images.length - limit}
                </div>
            )}
        </div>
    );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const getStyles = (s: string) => {
        switch(s.toLowerCase()) {
            case 'active':
            case 'done':
            case 'verified':
                return 'bg-green-800  text-white';
            case 'inactive':
            case 'pending':
            case 'in progress':
                return 'bg-gray-100 text-gray-600 border border-gray-200';
            case 'suspended':
            case 'failed':
            case 'high':
                return 'bg-red-800 text-white';
            case 'medium':
                return 'bg-orange-800 text-white';
            case 'low':
                return 'bg-blue-800 text-white';
            default:
                return 'bg-gray-100 text-gray-600 border border-gray-200';
        }
    }

    const getIcon = (s: string) => {
         switch(s.toLowerCase()) {
            case 'active': return <FaCheck size={10} />;
            case 'pending': return <FaCircle size={8} className="animate-pulse" />;
            default: return <FaCircle size={8} />;
        }
    }

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md uppercase text-xs font-semibold border ${getStyles(status)} w-fit`}>
            {status}
        </span>
    );
}

export const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
     const getStyles = (s: string) => {
        switch(s.toLowerCase()) {
            case 'high': return 'bg-red-800 text-white ring-1 ring-red-100';
            case 'medium': return 'bg-orange-800 text-white ring-1 ring-orange-100';
            case 'low': return 'bg-blue-800 text-white ring-1 ring-blue-100';
            default: return 'bg-gray-600 text-white ring-1 ring-gray-200';
        }
    }
    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${getStyles(priority)}`}>
            {priority}
        </span>
    )
}

export default SuperAdminTable;
