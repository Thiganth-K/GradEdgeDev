import React from 'react';

interface SuperAdminPageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string; // Allow additional styling if needed
}

const SuperAdminPageHeader: React.FC<SuperAdminPageHeaderProps> = ({ title, subtitle, className = '' }) => {
  return (
    <div className={`bg-white border-b border-gray-200 px-8 py-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-900 tracking-tight uppercase font-outfit">
        {title}
      </h2>
      {subtitle && (
        <p className="text-gray-500 text-xs mt-1 uppercase tracking-wide font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default SuperAdminPageHeader;
