import { useState, useEffect, useRef, useMemo } from 'react'
import { getContractList, createContract, updateContract, deleteContracts, deleteAllContracts, uploadContractExcel, downloadContractExcel } from '../../utils/api'
import { downloadContractSampleExcel } from '../../utils/excelUtils'
import type { Contract, ContractListResponse, ContractRequest } from '../../types/financial-management/contract'
import Swal from 'sweetalert2'

const Contract = () => {
  const [contractData, setContractData] = useState<ContractListResponse>({ sales: [], purchase: [] })
  const [selectedTab, setSelectedTab] = useState<'sales' | 'purchase'>('sales')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [contractNameFilter, setContractNameFilter] = useState<string>('')
  const [companyNameFilter, setCompanyNameFilter] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [editingData, setEditingData] = useState<ContractRequest | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 현재 선택된 탭의 계약 목록
  const currentContracts = useMemo(() => {
    const contracts = selectedTab === 'sales' ? contractData.sales : contractData.purchase
    return contracts.filter((contract) => {
      const matchesContractName = !contractNameFilter.trim() || 
        contract.contractName.toLowerCase().includes(contractNameFilter.toLowerCase().trim())
      const matchesCompanyName = !companyNameFilter.trim() || 
        contract.companyName.toLowerCase().includes(companyNameFilter.toLowerCase().trim())
      return matchesContractName && matchesCompanyName
    })
  }, [contractData, selectedTab, contractNameFilter, companyNameFilter])

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
      if (!abortController.signal.aborted) {
        Swal.fire({
          icon: 'error',
          title: '오류',
          text: error.message || '계약 목록 조회 실패',
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
    fetchContracts()
    
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
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: customEvent.detail.message,
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
    }

    window.addEventListener('api-error', handleApiError as EventListener)
    return () => {
      window.removeEventListener('api-error', handleApiError as EventListener)
    }
  }, [])

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

    currentContracts.forEach((contract) => {
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

    totals.total = totals.m01 + totals.m02 + totals.m03 + totals.m04 + totals.m05 + totals.m06 +
                   totals.m07 + totals.m08 + totals.m09 + totals.m10 + totals.m11 + totals.m12

    return totals
  }, [currentContracts])

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

  // 그래프용 월별 데이터 (매출 + 매입)
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
    return months.map((month, index) => ({
      month,
      sales: salesValues[index],
      purchase: purchaseValues[index],
    }))
  }, [salesMonthlyTotals, purchaseMonthlyTotals])

  // 그래프 최대값 계산 (Y축 스케일링용)
  const maxValue = useMemo(() => {
    const allValues = [
      ...Object.values(salesMonthlyTotals),
      ...Object.values(purchaseMonthlyTotals),
    ]
    const max = Math.max(...allValues.map(Math.abs))
    return max === 0 ? 1 : max * 1.1 // 여백을 위해 10% 추가
  }, [salesMonthlyTotals, purchaseMonthlyTotals])

  // 체크박스 선택/해제
  const handleSelect = (contractId: number) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(contractId)) {
      newSelected.delete(contractId)
    } else {
      newSelected.add(contractId)
    }
    setSelectedIds(newSelected)
  }

  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(currentContracts.map((c) => c.contractId)))
    } else {
      setSelectedIds(new Set())
    }
  }

  // 새 항목 추가 시작
  const handleStartAdd = () => {
    setEditingId('new')
    setEditingData({
      type: selectedTab === 'sales' ? 'S' : 'P',
      contractName: '',
      companyName: '',
      contractStart: '',
      contractEnd: '',
      invoiceRule: '',
      paymentTerm: '',
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
  const handleStartEdit = (contract: Contract) => {
    setEditingId(contract.contractId)
    setEditingData({
      type: contract.type,
      contractName: contract.contractName,
      companyName: contract.companyName,
      contractStart: contract.contractStart,
      contractEnd: contract.contractEnd,
      invoiceRule: contract.invoiceRule,
      paymentTerm: contract.paymentTerm,
      year: contract.year,
      m01: contract.m01,
      m02: contract.m02,
      m03: contract.m03,
      m04: contract.m04,
      m05: contract.m05,
      m06: contract.m06,
      m07: contract.m07,
      m08: contract.m08,
      m09: contract.m09,
      m10: contract.m10,
      m11: contract.m11,
      m12: contract.m12,
    })
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  // 저장
  const handleSave = async () => {
    if (!editingData) {
      return
    }

    if (!editingData.contractName.trim()) {
      Swal.fire({
        title: '알림',
        text: '계약명을 입력해주세요.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      return
    }

    if (!editingData.companyName.trim()) {
      Swal.fire({
        title: '알림',
        text: '회사명을 입력해주세요.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      return
    }

    try {
      if (editingId === 'new') {
        await createContract(editingData)
        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '계약이 등록되었습니다.',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      } else if (editingId !== null) {
        await updateContract(editingId, editingData)
        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '계약이 수정되었습니다.',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      }
      setEditingId(null)
      setEditingData(null)
      fetchContracts()
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
      await deleteContracts(Array.from(selectedIds))
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '삭제되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchContracts()
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

  // 전체 삭제
  const handleDeleteAll = async () => {
    if (currentContracts.length === 0) {
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
        <p>전체 ${currentContracts.length}개의 항목을 삭제하시겠습니까?</p>
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
      await deleteAllContracts(year, selectedTab === 'sales' ? 'S' : 'P')
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '전체 삭제되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchContracts()
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

  // 엑셀 업로드
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await uploadContractExcel(file)
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '엑셀 업로드가 완료되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchContracts()
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

  // 엑셀 다운로드
  const handleExcelDownload = async () => {
    try {
      await downloadContractExcel(year)
    } catch (error: any) {
      // 에러는 인터셉터에서 처리되므로 여기서는 추가 처리 불필요
      console.error('엑셀 다운로드 실패:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">매입/매출 관리</h2>
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
              <label htmlFor="contract-name-filter" className="text-lg text-gray-600 whitespace-nowrap">
                계약명
              </label>
              <input
                id="contract-name-filter"
                type="text"
                value={contractNameFilter}
                onChange={(e) => setContractNameFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchContracts()
                  }
                }}
                placeholder="계약명을 입력하세요"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a]"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="company-name-filter" className="text-lg text-gray-600 whitespace-nowrap">
                회사명
              </label>
              <input
                id="company-name-filter"
                type="text"
                value={companyNameFilter}
                onChange={(e) => setCompanyNameFilter(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchContracts()
                  }
                }}
                placeholder="회사명을 입력하세요"
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a]"
              />
            </div>
            <button
              onClick={fetchContracts}
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

      {/* 월별 그래프 영역 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-700">매출/매입 월별 현황</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#66bb6a' }}></div>
              <span className="text-sm text-gray-700 font-medium">매출</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }}></div>
              <span className="text-sm text-gray-700 font-medium">매입</span>
            </div>
          </div>
        </div>
        <div className="w-full h-80">
          <svg width="100%" height="100%" viewBox="0 0 1000 300" preserveAspectRatio="xMidYMid meet">
            {/* 배경 그리드 */}
            <defs>
              <pattern id="contract-grid" width="83.33" height="50" patternUnits="userSpaceOnUse">
                <line x1="0" y1="50" x2="0" y2="0" stroke="#e5e7eb" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#contract-grid)" />

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

            {/* 바 차트 - 매출과 매입을 나란히 표시 */}
            {chartData.map((item, index) => {
              const x = 100 + (index * 76.67)
              const barWidth = 16
              const spacing = 4
              const salesBarHeight = Math.abs((item.sales / maxValue) * 250)
              const purchaseBarHeight = Math.abs((item.purchase / maxValue) * 250)
              
              // 매출 바
              const salesY = 280 - salesBarHeight
              // 매입 바 (매출 바 오른쪽에 배치)
              const purchaseX = x + 18.33 + barWidth + spacing
              const purchaseY = 280 - purchaseBarHeight

              return (
                <g key={index}>
                  {/* 매출 바 */}
                  <rect
                    x={x + 18.33}
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
                  {/* 값 표시 - 매출 */}
                  {Math.abs(item.sales) > maxValue * 0.05 && (
                    <text
                      x={x + 18.33 + barWidth / 2}
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
            disabled={currentContracts.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none active:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체삭제
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadContractSampleExcel}
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
            onClick={handleExcelDownload}
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

      {/* 탭 영역 */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setSelectedTab('sales')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'sales'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              매출 ({contractData.sales.length})
            </button>
            <button
              onClick={() => setSelectedTab('purchase')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === 'purchase'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              매입 ({contractData.purchase.length})
            </button>
          </nav>
        </div>

        {/* 테이블 */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === currentContracts.length && currentContracts.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  계약명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  회사명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  계약시작일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  계약종료일
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  청구규칙
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  결제조건
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
                  <td colSpan={22} className="px-4 py-8 text-center text-gray-500">
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
                          value={editingData.contractName}
                          onChange={(e) =>
                            setEditingData({ ...editingData, contractName: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="계약명"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editingData.companyName}
                          onChange={(e) =>
                            setEditingData({ ...editingData, companyName: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="회사명"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editingData.contractStart}
                          onChange={(e) =>
                            setEditingData({ ...editingData, contractStart: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editingData.contractEnd}
                          onChange={(e) =>
                            setEditingData({ ...editingData, contractEnd: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editingData.invoiceRule}
                          onChange={(e) =>
                            setEditingData({ ...editingData, invoiceRule: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="청구규칙"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editingData.paymentTerm}
                          onChange={(e) =>
                            setEditingData({ ...editingData, paymentTerm: e.target.value })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="결제조건"
                        />
                      </td>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                        const key = `m${String(month).padStart(2, '0')}` as keyof ContractRequest
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
                        {formatAmount(
                          (editingData.m01 || 0) +
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
                        )}
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

                  {/* 데이터 행 */}
                  {currentContracts.length === 0 && editingId !== 'new' ? (
                    <tr>
                      <td colSpan={22} className="px-4 py-8 text-center text-gray-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    currentContracts.map((contract) => {
                      const isEditing = editingId === contract.contractId
                      const displayData = isEditing && editingData ? editingData : contract

                      return (
                        <tr key={contract.contractId} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3">
                            {!isEditing && (
                              <input
                                type="checkbox"
                                checked={selectedIds.has(contract.contractId)}
                                onChange={() => handleSelect(contract.contractId)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={displayData.contractName}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    contractName: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{contract.contractName}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={displayData.companyName}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    companyName: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{contract.companyName}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="date"
                                value={displayData.contractStart}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    contractStart: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{contract.contractStart}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="date"
                                value={displayData.contractEnd}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    contractEnd: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{contract.contractEnd}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={displayData.invoiceRule}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    invoiceRule: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{contract.invoiceRule}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={displayData.paymentTerm}
                                onChange={(e) =>
                                  setEditingData({
                                    ...editingData!,
                                    paymentTerm: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{contract.paymentTerm}</span>
                            )}
                          </td>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                            const key = `m${String(month).padStart(2, '0')}` as keyof ContractRequest
                            const value = isEditing ? (displayData as ContractRequest)[key] : (contract as Contract)[key]
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
                                    (value as number) < 0 ? 'text-red-600' : (value as number) > 0 ? 'text-blue-600' : 'text-gray-900'
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
                                  <span className={total < 0 ? 'text-red-600' : total > 0 ? 'text-blue-600' : 'text-gray-900'}>
                                    {formatAmount(total)}
                                  </span>
                                )
                              })()
                            ) : (
                              <span className={contract.totalAmount < 0 ? 'text-red-600' : contract.totalAmount > 0 ? 'text-blue-600' : 'text-gray-900'}>
                                {formatAmount(contract.totalAmount)}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {contract.createdBy}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {contract.updatedBy}
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
                                onClick={() => handleStartEdit(contract)}
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
                  {!isLoading && currentContracts.length > 0 && (
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-4 py-3" colSpan={6}></td>
                      <td className="px-4 py-3 font-bold text-gray-900">
                        합계
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m01 < 0 ? 'text-red-600' : monthlyTotals.m01 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m01)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m02 < 0 ? 'text-red-600' : monthlyTotals.m02 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m02)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m03 < 0 ? 'text-red-600' : monthlyTotals.m03 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m03)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m04 < 0 ? 'text-red-600' : monthlyTotals.m04 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m04)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m05 < 0 ? 'text-red-600' : monthlyTotals.m05 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m05)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m06 < 0 ? 'text-red-600' : monthlyTotals.m06 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m06)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m07 < 0 ? 'text-red-600' : monthlyTotals.m07 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m07)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m08 < 0 ? 'text-red-600' : monthlyTotals.m08 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m08)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m09 < 0 ? 'text-red-600' : monthlyTotals.m09 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m09)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m10 < 0 ? 'text-red-600' : monthlyTotals.m10 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m10)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m11 < 0 ? 'text-red-600' : monthlyTotals.m11 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m11)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        <span className={monthlyTotals.m12 < 0 ? 'text-red-600' : monthlyTotals.m12 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                          {formatAmount(monthlyTotals.m12)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-right">
                        <span className={monthlyTotals.total < 0 ? 'text-red-600' : monthlyTotals.total > 0 ? 'text-blue-600' : 'text-gray-900'}>
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
    </div>
  )
}

export default Contract
