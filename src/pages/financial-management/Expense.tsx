import { useState, useEffect, useRef, useMemo } from 'react'
import { getExpenseList, createExpense, updateExpense, deleteExpenses, deleteAllExpenses, uploadExpenseExcel, downloadExpenseExcel } from '../../utils/api'
import { downloadExpenseSampleExcel } from '../../utils/excelUtils'
import type { Expense, ExpenseRequest } from '../../types/financial-management/expense'
import Swal from 'sweetalert2'

const Expense = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [expenseNameFilter, setExpenseNameFilter] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [editingData, setEditingData] = useState<ExpenseRequest | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isErrorModalOpen, setIsErrorModalOpen] = useState<boolean>(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 목록 조회
  const fetchExpenses = async () => {
    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    try {
      const data = await getExpenseList(year, abortController.signal)
      
      // 요청이 취소되지 않았을 때만 상태 업데이트
      if (!abortController.signal.aborted) {
        // 경비명 필터 적용
        let filteredData = data
        if (expenseNameFilter.trim()) {
          filteredData = data.filter((expense) =>
            expense.expenseName.toLowerCase().includes(expenseNameFilter.toLowerCase().trim())
          )
        }
        setExpenses(filteredData)
        setSelectedIds(new Set())
      }
    } catch (error: any) {
      // AbortError는 무시 (요청이 취소된 경우)
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || abortController.signal.aborted) {
        return
      }
      if (!abortController.signal.aborted) {
        Swal.fire({
          icon: 'error',
          title: '오류',
          text: error.message || '경비 목록 조회 실패',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    fetchExpenses()
    
    // cleanup 함수에서 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [year])

  // API 에러 이벤트 리스너
  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>
      setErrorMessage(customEvent.detail.message)
      setIsErrorModalOpen(true)
    }

    window.addEventListener('api-error', handleApiError as EventListener)
    return () => {
      window.removeEventListener('api-error', handleApiError as EventListener)
    }
  }, [])

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

  // 새 항목 추가 시작
  const handleStartAdd = () => {
    setEditingId('new')
    setEditingData({
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
  }

  // 수정 시작
  const handleStartEdit = (expense: Expense) => {
    setEditingId(expense.expenseId)
    setEditingData({
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
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  // 저장
  const handleSave = async () => {
    if (!editingData || !editingData.expenseName.trim()) {
      Swal.fire({
        title: '알림',
        text: '경비명을 입력해주세요.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      return
    }

    try {
      if (editingId === 'new') {
        await createExpense(editingData)
        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '경비가 등록되었습니다.',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      } else if (editingId !== null) {
        await updateExpense(editingId, editingData)
        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '경비가 수정되었습니다.',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      }
      setEditingId(null)
      setEditingData(null)
      fetchExpenses()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: error.message || '저장 실패',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
    }
  }

  // 선택 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) {
      Swal.fire({
        title: '알림',
        text: '삭제할 항목을 선택해주세요.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      return
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: '삭제 확인',
      html: `<div style="text-align: center;">
        <p>선택한 ${selectedIds.size}개의 항목을 삭제하시겠습니까?</p>
        <p style="color: #dc2626; font-weight: bold; margin-top: 10px;">⚠️ 이 작업은 복원이 불가능합니다.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#66bb6a',
      cancelButtonColor: '#6b7280',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await deleteExpenses(Array.from(selectedIds))
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '삭제되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchExpenses()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: error.message || '삭제 실패',
        confirmButtonText: '확인',
      })
    }
  }

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (expenses.length === 0) {
      Swal.fire({
        title: '알림',
        text: '삭제할 항목이 없습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      return
    }

    const result = await Swal.fire({
      icon: 'warning',
      title: '삭제 확인',
      html: `<div style="text-align: center;">
        <p>전체 ${expenses.length}개의 항목을 삭제하시겠습니까?</p>
        <p style="color: #dc2626; font-weight: bold; margin-top: 10px;">⚠️ 이 작업은 복원이 불가능합니다.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#66bb6a',
      cancelButtonColor: '#6b7280',
    })

    if (!result.isConfirmed) {
      return
    }

    try {
      await deleteAllExpenses(year)
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '전체 삭제되었습니다.',
        confirmButtonText: '확인',
      })
      fetchExpenses()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: error.message || '삭제 실패',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
    }
  }

  // 월별 금액 포맷
  const formatAmount = (amount: number) => {
    return amount.toLocaleString()
  }

  // 월별 합계 계산
  const monthlyTotals = useMemo(() => {
    const totals = {
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
      total: 0,
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

    totals.total = totals.m01 + totals.m02 + totals.m03 + totals.m04 + totals.m05 + totals.m06 +
                   totals.m07 + totals.m08 + totals.m09 + totals.m10 + totals.m11 + totals.m12

    return totals
  }, [expenses])

  // 엑셀 업로드
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadExpenseExcel(file)
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '엑셀 업로드가 완료되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchExpenses()
    } catch (error: any) {
      // 에러는 인터셉터에서 처리되므로 여기서는 추가 처리 불필요
      console.error('엑셀 업로드 실패:', error)
    } finally {
      // 파일 input 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">경비 관리</h2>
      </div>

      {/* 조회 필터 영역 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-gray-700">조회 조건</h3>
            <span className="text-sm text-gray-500">(* Enter 시 조회가능합니다. )</span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="year-picker" className="text-lg text-gray-600 whitespace-nowrap">
                연도
              </label>
              <div className="relative">
                <select
                  id="year-picker"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a] cursor-pointer appearance-none bg-white"
                >
                  {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - 10 + i).map((y) => (
                    <option key={y} value={y}>
                      {y}년
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="expense-name-filter" className="text-lg text-gray-600 whitespace-nowrap">
                경비명
              </label>
              <input
                id="expense-name-filter"
                type="text"
                value={expenseNameFilter}
                onChange={(e) => setExpenseNameFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchExpenses()
                  }
                }}
                placeholder="경비명을 입력하세요"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a]"
              />
            </div>
            <button
              onClick={fetchExpenses}
              className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none focus:ring-2 text-sm whitespace-nowrap"
              style={{ backgroundColor: '#66bb6a' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
            >
              조회
            </button>
          </div>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartAdd}
            disabled={editingId !== null}
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#66bb6a' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4caf50')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#66bb6a')}
          >
            등록
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none active:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            선택삭제 ({selectedIds.size})
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={expenses.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none active:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체삭제
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadExpenseSampleExcel}
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none focus:ring-2 flex items-center gap-2"
            style={{ backgroundColor: '#66bb6a' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            샘플 엑셀 다운로드
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
            id="excel-upload"
          />
          <label
            htmlFor="excel-upload"
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none focus:ring-2 cursor-pointer flex items-center gap-2"
            style={{ backgroundColor: '#66bb6a' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            엑셀 업로드
          </label>
          <button
            onClick={async () => {
              try {
                await downloadExpenseExcel(year)
              } catch (error: any) {
                // 에러는 인터셉터에서 처리되므로 여기서는 추가 처리 불필요
                console.error('엑셀 다운로드 실패:', error)
              }
            }}
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none focus:ring-2 flex items-center gap-2"
            style={{ backgroundColor: '#66bb6a' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            엑셀 다운로드
          </button>
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === expenses.length && expenses.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  경비명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  1월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  2월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  3월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  4월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  5월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  6월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  7월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  8월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  9월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  10월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  11월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  12월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  합계
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  등록자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  수정자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ width: '140px' }}>
                  관리
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={18} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                <>
                  {/* 새 항목 추가 행 */}
                  {editingId === 'new' && editingData && (
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editingData.expenseName}
                          onChange={(e) =>
                            setEditingData({ ...editingData, expenseName: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="경비명"
                        />
                      </td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const key = `m${String(month).padStart(2, '0')}` as keyof ExpenseRequest
                        return (
                          <td key={month} className="px-4 py-3">
                            <input
                              type="number"
                              value={editingData[key] || 0}
                              onChange={(e) =>
                                setEditingData({
                                  ...editingData,
                                  [key]: Number(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right min-w-0"
                            />
                          </td>
                        )
                      })}
                      <td className="px-4 py-3 text-sm font-semibold text-right">
                        {(() => {
                          const total = (editingData.m01 || 0) +
                            (editingData.m02 || 0) +
                            (editingData.m03 || 0) +
                            (editingData.m04 || 0) +
                            (editingData.m05 || 0) +
                            (editingData.m06 || 0) +
                            (editingData.m07 || 0) +
                            (editingData.m08 || 0) +
                            (editingData.m09 || 0) +
                            (editingData.m10 || 0) +
                            (editingData.m11 || 0) +
                            (editingData.m12 || 0)
                          return (
                            <span className={total < 0 ? 'text-red-600' : 'text-gray-900'}>
                              {formatAmount(total)}
                            </span>
                          )
                        })()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">-</td>
                      <td className="px-4 py-3 text-sm text-gray-500">-</td>
                      <td className="px-4 py-3 text-sm" style={{ width: '140px' }}>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none active:outline-none focus:ring-2 whitespace-nowrap"
                            style={{ backgroundColor: '#66bb6a' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none active:outline-none focus:ring-2 whitespace-nowrap"
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* 기존 데이터 행 */}
                  {expenses.length === 0 && editingId !== 'new' ? (
                    <tr>
                      <td colSpan={18} className="px-4 py-8 text-center text-gray-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => {
                      const isEditing = editingId === expense.expenseId
                      const displayData = isEditing && editingData ? editingData : expense

                      return (
                        <tr key={expense.expenseId} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3">
                            {!isEditing && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(expense.expenseId)}
                                onChange={() => handleSelect(expense.expenseId)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={displayData.expenseName}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    expenseName: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{expense.expenseName}</span>
                            )}
                          </td>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                            const key = `m${String(month).padStart(2, '0')}` as keyof ExpenseRequest
                            const value = isEditing ? (displayData as ExpenseRequest)[key] : (expense as Expense)[key]
                            return (
                              <td key={month} className="px-4 py-3">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={value || 0}
                                    onChange={(e) =>
                                      setEditingData({
                                        ...editingData!,
                                        [key]: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right min-w-0"
                                  />
                                ) : (
                                  <span className={`text-sm text-right ${
                                    (value as number) < 0 ? 'text-red-600' : 'text-gray-900'
                                  }`}>
                                    {formatAmount(value as number)}
                                  </span>
                                )}
                              </td>
                            )
                          })}
                          <td className="px-4 py-3 text-sm font-semibold text-right">
                            {isEditing && editingData ? (
                              (() => {
                                const total = (editingData.m01 || 0) +
                                  (editingData.m02 || 0) +
                                  (editingData.m03 || 0) +
                                  (editingData.m04 || 0) +
                                  (editingData.m05 || 0) +
                                  (editingData.m06 || 0) +
                                  (editingData.m07 || 0) +
                                  (editingData.m08 || 0) +
                                  (editingData.m09 || 0) +
                                  (editingData.m10 || 0) +
                                  (editingData.m11 || 0) +
                                  (editingData.m12 || 0)
                                return (
                                  <span className={total < 0 ? 'text-red-600' : 'text-gray-900'}>
                                    {formatAmount(total)}
                                  </span>
                                )
                              })()
                            ) : (
                              <span className={expense.totalAmount < 0 ? 'text-red-600' : 'text-gray-900'}>
                                {formatAmount(expense.totalAmount)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {expense.createdBy}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {expense.updatedBy}
                          </td>
                          <td className="px-4 py-3 text-sm" style={{ width: '140px' }}>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none active:outline-none focus:ring-2 whitespace-nowrap"
                                  style={{ backgroundColor: '#66bb6a' }}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none active:outline-none focus:ring-2 whitespace-nowrap"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartEdit(expense)}
                                disabled={editingId !== null}
                                className="px-3 py-1.5 text-sm text-white rounded-md focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                style={{ backgroundColor: '#66bb6a' }}
                                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4caf50')}
                                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#66bb6a')}
                              >
                                수정
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}

                  {/* 월별 합계 행 */}
                  {!isLoading && expenses.length > 0 && (
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-4 py-3"></td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        합계
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m01 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m01)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m02 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m02)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m03 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m03)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m04 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m04)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m05 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m05)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m06 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m06)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m07 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m07)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m08 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m08)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m09 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m09)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m10 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m10)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m11 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m11)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m12 < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m12)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right">
                        <span className={monthlyTotals.total < 0 ? 'text-red-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.total)}
                        </span>
                      </td>
                      <td className="px-4 py-3" colSpan={3}></td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 에러 알림 모달 */}
      {isErrorModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-red-600 mb-4">오류</h3>
            <p className="text-gray-700 mb-6">{errorMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsErrorModalOpen(false)}
                className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none focus:ring-2"
                style={{ backgroundColor: '#66bb6a' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Expense