import { useState, useRef, useMemo } from 'react'
import { format } from 'date-fns'
import { useTransactionStore } from '../stores/transactionStore'
import { parseExcelFile } from '../utils/excelParser'
import { createSampleExcel } from '../utils/createSampleExcel'

const Transactions = () => {
  const { transactions, setTransactions, removeTransaction, clearTransactions } =
    useTransactionStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 필터 상태
  const [yearMonth, setYearMonth] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [accountFilter, setAccountFilter] = useState('')
  const [showFilters, setShowFilters] = useState(true)
 

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 엑셀 파일만 허용
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
    
    if (!validExtensions.some(ext => fileExtension === ext)) {
      setError('엑셀 파일(.xlsx, .xls, .csv)만 업로드 가능합니다.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const parsedTransactions = await parseExcelFile(file)
      setTransactions(parsedTransactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일을 읽는 중 오류가 발생했습니다.')
      console.error('엑셀 파싱 오류:', err)
    } finally {
      setIsLoading(false)
      // 파일 입력 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClear = () => {
    if (confirm('모든 거래내역을 삭제하시겠습니까?')) {
      clearTransactions()
      setError(null)
    }
  }

  // 고유한 계정과목 목록 추출
  const accountOptions = useMemo(() => {
    const accounts = Array.from(
      new Set(transactions.map((t) => t.accountId).filter((a) => a))
    ).sort()
    return accounts
  }, [transactions])

  // 필터링된 거래내역
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        if (
          !transaction.description.toLowerCase().includes(searchLower) &&
          !transaction.accountId.toLowerCase().includes(searchLower)
        ) {
          return false
        }
      }

      // 거래 유형 필터
      if (typeFilter !== 'all' && transaction.type !== typeFilter) {
        return false
      }

      // 계정과목 필터
      if (accountFilter && transaction.accountId !== accountFilter) {
        return false
      }

      // 대상년월 필터
      if (yearMonth) {
        const transactionDate = new Date(transaction.date)
        const transactionYearMonth = `${transactionDate.getFullYear()}-${String(transactionDate.getMonth() + 1).padStart(2, '0')}`
        if (transactionYearMonth !== yearMonth) {
          return false
        }
      }

      return true
    })
  }, [transactions, yearMonth, searchTerm, typeFilter, accountFilter])

  // 필터 초기화
  const resetFilters = () => {
    setYearMonth('')
    setSearchTerm('')
    setTypeFilter('all')
    setAccountFilter('')
  }

  // 필터가 적용되어 있는지 확인
  const hasActiveFilters = yearMonth || searchTerm || typeFilter !== 'all' || accountFilter

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900">거래내역</h2>
        <div className="flex gap-3">
          <button
            onClick={createSampleExcel}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            title="샘플 엑셀 파일 다운로드"
          >
            샘플 다운로드
          </button>
          <label className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            엑셀 파일 업로드
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
          {transactions.length > 0 && (
            <button
              onClick={handleClear}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              전체 삭제
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-center">
          엑셀 파일을 읽는 중...
        </div>
      )}

      {/* 필터 영역 - 항상 표시 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            {transactions.length > 0 ? (
              <p className="text-sm text-gray-600">
                전체 <span className="font-semibold">{transactions.length}</span>개 중{' '}
                <span className="font-semibold text-blue-600">{filteredTransactions.length}</span>개
                표시
                {hasActiveFilters && <span className="text-orange-600"> (필터 적용됨)</span>}
              </p>
            ) : (
              <p className="text-sm text-gray-600">필터를 설정하여 거래내역을 조회하세요.</p>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {showFilters ? '필터 숨기기' : '필터 보기'}
            </button>
          </div>
        </div>

        {/* 필터 영역 */}
        {showFilters && (
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 대상년월 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700">
                      대상년월
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="month"
                      value={yearMonth}
                      onChange={(e) => setYearMonth(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {yearMonth && (
                      <button
                        className="px-3 py-2 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
                        title={`${yearMonth.replace('-', '')}_transactions.xlsx 파일 로드`}
                      >
                        로드
                      </button>
                    )}
                  </div>
                </div>

                {/* 검색 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    검색 (설명/계정과목)
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어 입력..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* 거래 유형 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    거래 유형
                  </label>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as 'all' | 'income' | 'expense')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">전체</option>
                    <option value="income">수입</option>
                    <option value="expense">지출</option>
                  </select>
                </div>

                {/* 계정과목 */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    계정과목
                  </label>
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">전체</option>
                    {accountOptions.map((account) => (
                      <option key={account} value={account}>
                        {account}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 필터 초기화 버튼 */}
              {hasActiveFilters && (
                <div className="flex justify-end">
                  <button
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    필터 초기화
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

      {/* 거래내역 테이블 - 거래내역이 있을 때만 표시 */}
      {transactions.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              전체 <span className="font-semibold">{transactions.length}</span>개 중{' '}
              <span className="font-semibold text-blue-600">{filteredTransactions.length}</span>개
              표시
              {hasActiveFilters && <span className="text-orange-600"> (필터 적용됨)</span>}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    날짜
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계정과목
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    수입
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지출
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      필터 조건에 맞는 거래내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(transaction.date), 'yyyy-MM-dd')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.accountId || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {transaction.type === 'income' ? (
                        <span className="text-green-600 font-medium">
                          {formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {transaction.type === 'expense' ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(transaction.amount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => {
                          if (confirm('이 거래내역을 삭제하시겠습니까?')) {
                            removeTransaction(transaction.id)
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {hasActiveFilters ? '필터 합계' : '전체 합계'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                    {formatCurrency(
                      filteredTransactions
                        .filter((t) => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                    {formatCurrency(
                      filteredTransactions
                        .filter((t) => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    {formatCurrency(
                      filteredTransactions
                        .filter((t) => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0) -
                        filteredTransactions
                          .filter((t) => t.type === 'expense')
                          .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {!isLoading && transactions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-lg mb-2">아직 거래내역이 없습니다.</p>
          <p className="text-gray-400 text-sm mb-4">
            엑셀 파일을 업로드하여 거래내역을 불러오세요.
          </p>
          <div className="text-gray-300 text-xs space-y-1">
            <p className="font-semibold text-gray-400 mb-2">엑셀 파일 형식:</p>
            <p>• 필수 컬럼: 날짜, 설명, 계정과목, 수입, 지출</p>
            <p>• 날짜 형식: YYYY-MM-DD 또는 YYYY/MM/DD</p>
            <p>• 수입과 지출 중 하나만 입력 (둘 다 비우면 안 됨)</p>
            <p className="mt-2 text-blue-400">💡 "샘플 다운로드" 버튼으로 예시 파일을 받아보세요!</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions
