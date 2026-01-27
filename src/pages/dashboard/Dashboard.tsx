import { useState, useEffect, useRef, useMemo } from 'react'
import { getContractList, getExpenseList } from '../../utils/api'
import type { ContractListResponse } from '../../types/financial-management/contract'
import type { Expense } from '../../types/financial-management/expense'

const Dashboard = () => {
  const [contractData, setContractData] = useState<ContractListResponse>({ sales: [], purchase: [] })
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isExpenseLoading, setIsExpenseLoading] = useState<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const expenseAbortControllerRef = useRef<AbortController | null>(null)
  const year = new Date().getFullYear()

  // 목록 조회
  const fetchContracts = async () => {
    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    try {
      const data = await getContractList(year, abortController.signal)
      
      // 요청이 취소되지 않았을 때만 상태 업데이트
      if (!abortController.signal.aborted) {
        setContractData(data)
      }
    } catch (error: any) {
      // AbortError는 무시 (요청이 취소된 경우)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
        return
      }
      console.error('계약 목록 조회 실패:', error)
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  // 경비 목록 조회
  const fetchExpenses = async () => {
    // 이전 요청이 있으면 취소
    if (expenseAbortControllerRef.current) {
      expenseAbortControllerRef.current.abort()
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController()
    expenseAbortControllerRef.current = abortController

    setIsExpenseLoading(true)
    try {
      const data = await getExpenseList(year, abortController.signal)
      
      // 요청이 취소되지 않았을 때만 상태 업데이트
      if (!abortController.signal.aborted) {
        setExpenses(data)
      }
    } catch (error: any) {
      // AbortError는 무시 (요청이 취소된 경우)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
        return
      }
      console.error('경비 목록 조회 실패:', error)
    } finally {
      if (!abortController.signal.aborted) {
        setIsExpenseLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchContracts()
    fetchExpenses()
    
    // cleanup 함수에서 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      if (expenseAbortControllerRef.current) {
        expenseAbortControllerRef.current.abort()
        expenseAbortControllerRef.current = null
      }
    }
  }, [])

  // 금액 포맷
  const formatAmount = (amount: number) => {
    return amount.toLocaleString()
  }

  // 매출 월별 합계 계산
  const salesMonthlyTotals = useMemo(() => {
    const totals = {
      m01: 0, m02: 0, m03: 0, m04: 0, m05: 0, m06: 0,
      m07: 0, m08: 0, m09: 0, m10: 0, m11: 0, m12: 0,
    }
    contractData.sales.forEach((contract) => {
      totals.m01 += contract.m01 || 0
      totals.m02 += contract.m02 || 0
      totals.m03 += contract.m03 || 0
      totals.m04 += contract.m04 || 0
      totals.m05 += contract.m05 || 0
      totals.m06 += contract.m06 || 0
      totals.m07 += contract.m07 || 0
      totals.m08 += contract.m08 || 0
      totals.m09 += contract.m09 || 0
      totals.m10 += contract.m10 || 0
      totals.m11 += contract.m11 || 0
      totals.m12 += contract.m12 || 0
    })
    return totals
  }, [contractData.sales])

  // 매입 월별 합계 계산
  const purchaseMonthlyTotals = useMemo(() => {
    const totals = {
      m01: 0, m02: 0, m03: 0, m04: 0, m05: 0, m06: 0,
      m07: 0, m08: 0, m09: 0, m10: 0, m11: 0, m12: 0,
    }
    contractData.purchase.forEach((contract) => {
      totals.m01 += contract.m01 || 0
      totals.m02 += contract.m02 || 0
      totals.m03 += contract.m03 || 0
      totals.m04 += contract.m04 || 0
      totals.m05 += contract.m05 || 0
      totals.m06 += contract.m06 || 0
      totals.m07 += contract.m07 || 0
      totals.m08 += contract.m08 || 0
      totals.m09 += contract.m09 || 0
      totals.m10 += contract.m10 || 0
      totals.m11 += contract.m11 || 0
      totals.m12 += contract.m12 || 0
    })
    return totals
  }, [contractData.purchase])

  // 총 매출 계산
  const totalSales = useMemo(() => {
    return salesMonthlyTotals.m01 + salesMonthlyTotals.m02 + salesMonthlyTotals.m03 + salesMonthlyTotals.m04 +
           salesMonthlyTotals.m05 + salesMonthlyTotals.m06 + salesMonthlyTotals.m07 + salesMonthlyTotals.m08 +
           salesMonthlyTotals.m09 + salesMonthlyTotals.m10 + salesMonthlyTotals.m11 + salesMonthlyTotals.m12
  }, [salesMonthlyTotals])

  // 총 매입 계산
  const totalPurchase = useMemo(() => {
    return purchaseMonthlyTotals.m01 + purchaseMonthlyTotals.m02 + purchaseMonthlyTotals.m03 + purchaseMonthlyTotals.m04 +
           purchaseMonthlyTotals.m05 + purchaseMonthlyTotals.m06 + purchaseMonthlyTotals.m07 + purchaseMonthlyTotals.m08 +
           purchaseMonthlyTotals.m09 + purchaseMonthlyTotals.m10 + purchaseMonthlyTotals.m11 + purchaseMonthlyTotals.m12
  }, [purchaseMonthlyTotals])

  // 경비 월별 합계 계산
  const expenseMonthlyTotals = useMemo(() => {
    const totals = {
      m01: 0, m02: 0, m03: 0, m04: 0, m05: 0, m06: 0,
      m07: 0, m08: 0, m09: 0, m10: 0, m11: 0, m12: 0,
    }
    expenses.forEach((expense) => {
      totals.m01 += expense.m01 || 0
      totals.m02 += expense.m02 || 0
      totals.m03 += expense.m03 || 0
      totals.m04 += expense.m04 || 0
      totals.m05 += expense.m05 || 0
      totals.m06 += expense.m06 || 0
      totals.m07 += expense.m07 || 0
      totals.m08 += expense.m08 || 0
      totals.m09 += expense.m09 || 0
      totals.m10 += expense.m10 || 0
      totals.m11 += expense.m11 || 0
      totals.m12 += expense.m12 || 0
    })
    return totals
  }, [expenses])

  // 총 경비 계산
  const totalExpense = useMemo(() => {
    return expenseMonthlyTotals.m01 + expenseMonthlyTotals.m02 + expenseMonthlyTotals.m03 + expenseMonthlyTotals.m04 +
           expenseMonthlyTotals.m05 + expenseMonthlyTotals.m06 + expenseMonthlyTotals.m07 + expenseMonthlyTotals.m08 +
           expenseMonthlyTotals.m09 + expenseMonthlyTotals.m10 + expenseMonthlyTotals.m11 + expenseMonthlyTotals.m12
  }, [expenseMonthlyTotals])

  // 그래프용 월별 데이터 (매출 + 매입 + 경비 + 마진)
  const chartData = useMemo(() => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    const salesValues = [
      salesMonthlyTotals.m01, salesMonthlyTotals.m02, salesMonthlyTotals.m03, salesMonthlyTotals.m04,
      salesMonthlyTotals.m05, salesMonthlyTotals.m06, salesMonthlyTotals.m07, salesMonthlyTotals.m08,
      salesMonthlyTotals.m09, salesMonthlyTotals.m10, salesMonthlyTotals.m11, salesMonthlyTotals.m12,
    ]
    const purchaseValues = [
      purchaseMonthlyTotals.m01, purchaseMonthlyTotals.m02, purchaseMonthlyTotals.m03, purchaseMonthlyTotals.m04,
      purchaseMonthlyTotals.m05, purchaseMonthlyTotals.m06, purchaseMonthlyTotals.m07, purchaseMonthlyTotals.m08,
      purchaseMonthlyTotals.m09, purchaseMonthlyTotals.m10, purchaseMonthlyTotals.m11, purchaseMonthlyTotals.m12,
    ]
    const expenseValues = [
      expenseMonthlyTotals.m01, expenseMonthlyTotals.m02, expenseMonthlyTotals.m03, expenseMonthlyTotals.m04,
      expenseMonthlyTotals.m05, expenseMonthlyTotals.m06, expenseMonthlyTotals.m07, expenseMonthlyTotals.m08,
      expenseMonthlyTotals.m09, expenseMonthlyTotals.m10, expenseMonthlyTotals.m11, expenseMonthlyTotals.m12,
    ]
    return months.map((month, index) => ({
      month,
      sales: salesValues[index],
      purchase: purchaseValues[index],
      expense: expenseValues[index],
      margin: salesValues[index] - purchaseValues[index],
      profit: salesValues[index] - (purchaseValues[index] + expenseValues[index]), // 순이익: 매출 - (매입 + 경비)
    }))
  }, [salesMonthlyTotals, purchaseMonthlyTotals, expenseMonthlyTotals])

  // 그래프 최대값 계산 (Y축 스케일링용) - 매출/매입/경비용
  const maxValue = useMemo(() => {
    const allValues = [
      ...Object.values(salesMonthlyTotals),
      ...Object.values(purchaseMonthlyTotals),
      ...Object.values(expenseMonthlyTotals),
    ]
    const max = Math.max(...allValues.map(Math.abs))
    return max === 0 ? 1 : max * 1.1 // 여백을 위해 10% 추가
  }, [salesMonthlyTotals, purchaseMonthlyTotals, expenseMonthlyTotals])

  // 이익 그래프 최대값 계산 (마진과 순이익 모두 고려)
  const profitChartMaxValue = useMemo(() => {
    const allValues = [
      ...chartData.map(item => Math.abs(item.margin)),
      ...chartData.map(item => Math.abs(item.profit)),
    ]
    const max = Math.max(...allValues)
    return max === 0 ? 1 : max * 1.1 // 여백을 위해 10% 추가
  }, [chartData])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">대시보드</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Summary Cards */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-bold text-gray-500">총 매출</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {isLoading ? '로딩 중...' : `₩${formatAmount(totalSales)}`}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-bold text-gray-500">총 매입</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {isLoading ? '로딩 중...' : `₩${formatAmount(totalPurchase)}`}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-bold text-gray-500">총 경비</h3>
          <p className="mt-2 text-3xl font-bold" style={{ color: '#f59e0b' }}>
            {isExpenseLoading ? '로딩 중...' : `₩${formatAmount(totalExpense)}`}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-bold text-gray-500">순이익 
            <span className="text-sm text-gray-500">( * 매출 - (매입 + 경비) )</span>
          </h3>
          <p className="mt-2 text-3xl font-bold" style={{ color: '#10b981' }}>
            {isLoading || isExpenseLoading ? '로딩 중...' : `₩${formatAmount(totalSales - totalPurchase - totalExpense)}`}
          </p>
        </div>
      </div>

      {/* 비용 월별 그래프 영역 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-700">비용 월별 현황</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#66bb6a' }}></div>
              <span className="text-sm text-gray-700 font-medium">매출</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm text-gray-700 font-medium">매입</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-sm text-gray-700 font-medium">경비</span>
            </div>
          </div>
        </div>
        <div className="w-full h-80">
          <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet">
            {/* 배경 그리드 */}
            <defs>
              <pattern id="dashboard-grid" width="83.33" height="50" patternUnits="userSpaceOnUse">
                <line x1="0" y1="50" x2="0" y2="0" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dashboard-grid)" />

            {/* Y축 라벨 (금액) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const value = Math.round(maxValue * ratio)
              const y = 280 - (280 * ratio)
              return (
                <g key={index}>
                  <line
                    x1="60"
                    y1={y + 10}
                    x2="960"
                    y2={y + 10}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="55"
                    y={y + 15}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                    className="font-medium"
                  >
                    {value > 0 ? value.toLocaleString() : 0}
                  </text>
                </g>
              )
            })}

            {/* X축 라벨 (월) */}
            {chartData.map((item, index) => {
              const x = 100 + (index * 76.67)
              return (
                <text
                  key={index}
                  x={x + 38.33}
                  y="295"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#374151"
                  className="font-medium"
                >
                  {item.month}
                </text>
              )
            })}

            {/* 바 차트 - 매출, 매입, 경비를 나란히 표시 */}
            {chartData.map((item, index) => {
              const x = 100 + (index * 76.67)
              const barWidth = 12
              const spacing = 3
              const salesBarHeight = Math.abs((item.sales / maxValue) * 250)
              const purchaseBarHeight = Math.abs((item.purchase / maxValue) * 250)
              const expenseBarHeight = Math.abs((item.expense / maxValue) * 250)
              
              // 매출 바
              const salesY = 280 - salesBarHeight
              const salesX = x + 18.33
              // 매입 바 (매출 바 오른쪽에 배치)
              const purchaseX = salesX + barWidth + spacing
              const purchaseY = 280 - purchaseBarHeight
              // 경비 바 (매입 바 오른쪽에 배치)
              const expenseX = purchaseX + barWidth + spacing
              const expenseY = 280 - expenseBarHeight

              return (
                <g key={index}>
                  {/* 매출 바 */}
                  <rect
                    x={salesX}
                    y={salesY}
                    width={barWidth}
                    height={salesBarHeight}
                    fill="#66bb6a"
                    opacity="0.8"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <title>
                      {item.month} 매출: {item.sales.toLocaleString()}원
                    </title>
                  </rect>
                  {/* 매입 바 */}
                  <rect
                    x={purchaseX}
                    y={purchaseY}
                    width={barWidth}
                    height={purchaseBarHeight}
                    fill="#ef4444"
                    opacity="0.8"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <title>
                      {item.month} 매입: {item.purchase.toLocaleString()}원
                    </title>
                  </rect>
                  {/* 경비 바 */}
                  <rect
                    x={expenseX}
                    y={expenseY}
                    width={barWidth}
                    height={expenseBarHeight}
                    fill="#f59e0b"
                    opacity="0.8"
                    className="hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <title>
                      {item.month} 경비: {item.expense.toLocaleString()}원
                    </title>
                  </rect>
                  {/* 값 표시 - 매출 */}
                  {Math.abs(item.sales) > maxValue * 0.05 && (
                    <text
                      x={salesX + barWidth / 2}
                      y={salesY - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#374151"
                      className="font-semibold"
                    >
                      {Math.abs(item.sales) >= 1000000
                        ? `${(Math.abs(item.sales) / 1000000).toFixed(1)}M`
                        : Math.abs(item.sales) >= 1000
                        ? `${(Math.abs(item.sales) / 1000).toFixed(0)}K`
                        : Math.abs(item.sales)}
                    </text>
                  )}
                  {/* 값 표시 - 매입 */}
                  {Math.abs(item.purchase) > maxValue * 0.05 && (
                    <text
                      x={purchaseX + barWidth / 2}
                      y={purchaseY - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#374151"
                      className="font-semibold"
                    >
                      {Math.abs(item.purchase) >= 1000000
                        ? `${(Math.abs(item.purchase) / 1000000).toFixed(1)}M`
                        : Math.abs(item.purchase) >= 1000
                        ? `${(Math.abs(item.purchase) / 1000).toFixed(0)}K`
                        : Math.abs(item.purchase)}
                    </text>
                  )}
                  {/* 값 표시 - 경비 */}
                  {Math.abs(item.expense) > maxValue * 0.05 && (
                    <text
                      x={expenseX + barWidth / 2}
                      y={expenseY - 5}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#374151"
                      className="font-semibold"
                    >
                      {Math.abs(item.expense) >= 1000000
                        ? `${(Math.abs(item.expense) / 1000000).toFixed(1)}M`
                        : Math.abs(item.expense) >= 1000
                        ? `${(Math.abs(item.expense) / 1000).toFixed(0)}K`
                        : Math.abs(item.expense)}
                    </text>
                  )}
                </g>
              )
            })}

            {/* 0 기준선 */}
            <line
              x1="60"
              y1="280"
              x2="960"
              y2="280"
              stroke="#9ca3af"
              strokeWidth="2"
            />
          </svg>
        </div>
      </div>

      {/* 이익 그래프 영역 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-700">이익 월별 현황</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path
                  d="M2 10 L6 8 L10 12 L14 6 L18 10"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-gray-700 font-medium">마진</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                <path
                  d="M2 10 L6 8 L10 12 L14 6 L18 10"
                  stroke="#10b981"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-sm text-gray-700 font-medium">순이익</span>
            </div>
          </div>
        </div>
        <div className="w-full h-96">
          <svg width="100%" height="100%" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet">
            {/* 배경 그리드 */}
            <defs>
              <pattern id="profit-grid" width="83.33" height="50" patternUnits="userSpaceOnUse">
                <line x1="0" y1="50" x2="0" y2="0" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#profit-grid)" />

            {/* 0 기준선 (중앙) */}
            <line
              x1="60"
              y1="250"
              x2="960"
              y2="250"
              stroke="#9ca3af"
              strokeWidth="2"
            />

            {/* Y축 라벨 (양수 - 위쪽) */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const value = Math.round(profitChartMaxValue * ratio)
              const y = 250 - (200 * ratio) // 0 기준선(250)에서 위로 200px까지
              return (
                <g key={`positive-${index}`}>
                  <line
                    x1="60"
                    y1={y}
                    x2="960"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="55"
                    y={y + 5}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                    className="font-medium"
                  >
                    {value > 0 ? value.toLocaleString() : 0}
                  </text>
                </g>
              )
            })}

            {/* Y축 라벨 (음수 - 아래쪽) */}
            {[0.25, 0.5, 0.75, 1].map((ratio, index) => {
              const value = Math.round(profitChartMaxValue * ratio)
              const y = 250 + (200 * ratio) // 0 기준선(250)에서 아래로 200px까지
              return (
                <g key={`negative-${index}`}>
                  <line
                    x1="60"
                    y1={y}
                    x2="960"
                    y2={y}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                  <text
                    x="55"
                    y={y + 5}
                    textAnchor="end"
                    fontSize="12"
                    fill="#6b7280"
                    className="font-medium"
                  >
                    -{value.toLocaleString()}
                  </text>
                </g>
              )
            })}

            {/* X축 라벨 (월) */}
            {chartData.map((item, index) => {
              const x = 100 + (index * 76.67)
              return (
                <text
                  key={index}
                  x={x + 38.33}
                  y="480"
                  textAnchor="middle"
                  fontSize="12"
                  fill="#374151"
                  className="font-medium"
                >
                  {item.month}
                </text>
              )
            })}

            {/* 마진 꺽은선 그래프 */}
            <polyline
              points={chartData.map((item, index) => {
                const x = 100 + (index * 76.67) + 38.33
                // 마진이 양수면 위로, 음수면 아래로 표시 (0 기준선은 250)
                const marginY = 250 - ((item.margin / profitChartMaxValue) * 200)
                return `${x},${marginY}`
              }).join(' ')}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              className="cursor-pointer"
            />
            {/* 마진 점 표시 */}
            {chartData.map((item, index) => {
              const x = 100 + (index * 76.67) + 38.33
              // 마진이 양수면 위로, 음수면 아래로 표시 (0 기준선은 250)
              const marginY = 250 - ((item.margin / profitChartMaxValue) * 200)
              const color = item.margin >= 0 ? '#3b82f6' : '#ef4444'
              return (
                <g key={`margin-point-${index}`}>
                  <circle
                    cx={x}
                    cy={marginY}
                    r="4"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer"
                  >
                    <title>
                      {item.month} 마진: {item.margin.toLocaleString()}원
                    </title>
                  </circle>
                  {/* 마진 값 표시 */}
                  {Math.abs(item.margin) > profitChartMaxValue * 0.05 && (
                    <text
                      x={x}
                      y={item.margin >= 0 ? marginY - 10 : marginY + 15}
                      textAnchor="middle"
                      fontSize="9"
                      fill={color}
                      className="font-semibold"
                    >
                      {Math.abs(item.margin) >= 1000000
                        ? `${(Math.abs(item.margin) / 1000000).toFixed(1)}M`
                        : Math.abs(item.margin) >= 1000
                        ? `${(Math.abs(item.margin) / 1000).toFixed(0)}K`
                        : Math.abs(item.margin)}
                    </text>
                  )}
                </g>
              )
            })}

            {/* 순이익 꺽은선 그래프 */}
            <polyline
              points={chartData.map((item, index) => {
                const x = 100 + (index * 76.67) + 38.33
                // 순이익이 양수면 위로, 음수면 아래로 표시 (0 기준선은 250)
                const profitY = 250 - ((item.profit / profitChartMaxValue) * 200)
                return `${x},${profitY}`
              }).join(' ')}
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.9"
              className="cursor-pointer"
            />
            {/* 순이익 점 표시 */}
            {chartData.map((item, index) => {
              const x = 100 + (index * 76.67) + 38.33
              // 순이익이 양수면 위로, 음수면 아래로 표시 (0 기준선은 250)
              const profitY = 250 - ((item.profit / profitChartMaxValue) * 200)
              const color = item.profit >= 0 ? '#10b981' : '#ef4444'
              return (
                <g key={`profit-point-${index}`}>
                  <circle
                    cx={x}
                    cy={profitY}
                    r="4"
                    fill={color}
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer"
                  >
                    <title>
                      {item.month} 순이익: {item.profit.toLocaleString()}원
                    </title>
                  </circle>
                  {/* 순이익 값 표시 */}
                  {Math.abs(item.profit) > profitChartMaxValue * 0.05 && (
                    <text
                      x={x}
                      y={item.profit >= 0 ? profitY - 10 : profitY + 15}
                      textAnchor="middle"
                      fontSize="9"
                      fill={color}
                      className="font-semibold"
                    >
                      {Math.abs(item.profit) >= 1000000
                        ? `${(Math.abs(item.profit) / 1000000).toFixed(1)}M`
                        : Math.abs(item.profit) >= 1000
                        ? `${(Math.abs(item.profit) / 1000).toFixed(0)}K`
                        : Math.abs(item.profit)}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
