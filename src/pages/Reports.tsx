const Reports = () => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">보고서</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            수익/비용 보고서
          </h3>
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            월별 통계
          </h3>
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>
      </div>
    </div>
  )
}

export default Reports
