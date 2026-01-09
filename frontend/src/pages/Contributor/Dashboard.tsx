import React from 'react'
import Welcome from '../../components/Contributor/Welcome'

const ContributorDashboard: React.FC = () => {
  // contributor-specific dashboard placeholder
  return (
    <div className="p-6">
      <Welcome name={undefined} />
      <div className="mt-4">
        <div className="bg-white p-4 rounded shadow"> 
          <h3 className="font-semibold">Contributor Dashboard</h3>
          <p className="text-sm text-gray-600">Quick links and actions for contributors will appear here.</p>
        </div>
      </div>
    </div>
  )
}

export default ContributorDashboard
