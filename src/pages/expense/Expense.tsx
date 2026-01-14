import { useState, useEffect } from 'react'
import { getExpenseList, createExpense, updateExpense, deleteExpense, deleteExpenses } from '../../utils/api'
import { downloadSampleExcel, downloadExpenseListExcel } from '../../utils/excelUtils'
import type { Expense, ExpenseRequest } from '../../types/expense/expense'

const Expense = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [formData, setFormData] = useState<ExpenseRequest>({
    expenseName: '',
    year: new Date().getFullYear(),
    m01: 0,
    m02: 0,
    m03: 0,
    m04: 0,
    m05: 0,
    m06: 0,
    m07: 0,
    m08: 0,
    m09: 0,
    m10: 0,
    m11: 0,
    m12: 0,
  })

  // 목록 조회
  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const data = await getExpenseList(year)
      setExpenses(data)
      setSelectedIds(new Set())
    } catch (error: any) {
      alert(error.message || '경비 목록 조회 실패')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchExpenses()
  }, [year])

  // 체크박스 선택/해제
  const handleSelect = (expenseId: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId)
    } else {
      newSelected.add(expenseId)
    }
    setSelectedIds(newSelected)
  }

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(expenses.map((e) => e.expenseId)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // 등록 모달 열기
  const handleOpenAddModal = () => {
    setEditingExpense(null)
    setFormData({
      expenseName: '',
      year: year,
      m01: 0,
      m02: 0,
      m03: 0,
      m04: 0,
      m05: 0,
      m06: 0,
      m07: 0,
      m08: 0,
      m09: 0,
      m10: 0,
      m11: 0,
      m12: 0,
    })
    setIsModalOpen(true)
  }

  // 수정 모달 열기
  const handleOpenEditModal = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      expenseName: expense.expenseName,
      year: expense.year,
      m01: expense.m01,
      m02: expense.m02,
      m03: expense.m03,
      m04: expense.m04,
      m05: expense.m05,
      m06: expense.m06,
      m07: expense.m07,
      m08: expense.m08,
      m09: expense.m09,
      m10: expense.m10,
      m11: expense.m11,
      m12: expense.m12,
    })
    setIsModalOpen(true)
  }

  // 등록/수정 저장
  const handleSave = async () => {
    if (!formData.expenseName.trim()) {
      alert('경비명을 입력해주세요.')
      return
    }

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.expenseId, formData)
        alert('경비가 수정되었습니다.')
      } else {
        await createExpense(formData)
        alert('경비가 등록되었습니다.')
      }
      setIsModalOpen(false)
      fetchExpenses()
    } catch (error: any) {
      alert(error.message || '저장 실패')
    }
  }

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      alert('삭제할 항목을 선택해주세요.')
      return
    }

    if (!confirm(`선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?`)) {
      return
    }

    try {
      await deleteExpenses(Array.from(selectedIds))
      alert('삭제되었습니다.')
      fetchExpenses()
    } catch (error: any) {
      alert(error.message || '삭제 실패')
    }
  }

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (expenses.length === 0) {
      alert('삭제할 항목이 없습니다.')
      return
    }

    if (!confirm(`전체 ${expenses.length}개의 항목을 삭제하시겠습니까?`)) {
      return
    }

    try {
      const allIds = expenses.map((e) => e.expenseId)
      await deleteExpenses(allIds)
      alert('전체 삭제되었습니다.')
      fetchExpenses()
    } catch (error: any) {
      alert(error.message || '삭제 실패')
    }
  }

  // 월별 금액 포맷
  const formatAmount = (amount: number) => {
    return amount.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">경비 관리</h2>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            등록
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            선택삭제 ({selectedIds.size})
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={expenses.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체삭제
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadSampleExcel}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            샘플 엑셀 다운로드
          </button>
          <button
            onClick={() => downloadExpenseListExcel(expenses)}
            disabled={expenses.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            목록 엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === expenses.length && expenses.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  경비명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  1월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  2월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  3월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  4월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  5월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  6월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  7월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  8월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  9월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  10월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  11월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  12월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  합계
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={16} className="px-4 py-8 text-center text-gray-500">
                    데이터가 없습니다.
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => (
                  <tr key={expense.expenseId} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(expense.expenseId)}
                        onChange={() => handleSelect(expense.expenseId)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.expenseName}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m01)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m02)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m03)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m04)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m05)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m06)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m07)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m08)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m09)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m10)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m11)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatAmount(expense.m12)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">
                      {formatAmount(expense.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleOpenEditModal(expense)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 등록/수정 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingExpense ? '경비 수정' : '경비 등록'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  경비명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.expenseName}
                  onChange={(e) => setFormData({ ...formData, expenseName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="경비명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                  const key = `m${String(month).padStart(2, '0')}` as keyof ExpenseRequest
                  return (
                    <div key={month}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {month}월
                      </label>
                      <input
                        type="number"
                        value={formData[key]}
                        onChange={(e) =>
                          setFormData({ ...formData, [key]: Number(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0"
                      />
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expense
