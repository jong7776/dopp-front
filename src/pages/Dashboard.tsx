const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">대시보드</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">총 수입</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">₩0</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">총 지출</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">₩0</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">순이익</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">₩0</p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">거래 건수</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
