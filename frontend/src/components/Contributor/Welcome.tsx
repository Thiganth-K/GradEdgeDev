import React from 'react'

const Welcome: React.FC<{ name?: string }> = ({ name }) => {
  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold">Welcome{ name ? `, ${name}` : '' }!</h2>
      <p className="text-sm text-gray-600">This is your contributor workspace.</p>
    </div>
  )
}

export default Welcome
