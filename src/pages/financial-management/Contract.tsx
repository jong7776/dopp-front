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

  // 그래프용 월별 데이터 (매출 + 매입 + 마진)
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
      margin: salesValues[index] - purchaseValues[index],
    }))
  }, [salesMonthlyTotals, purchaseMonthlyTotals])

  // 그래프 최대값 계산 (Y축 스케일링용)
  const maxValue = useMemo(() => {
    const allValues = [
      ...Object.values(salesMonthlyTotals),
      ...Object.values(purchaseMonthlyTotals),
      ...chartData.map(item => Math.abs(item.margin)),
    ]
    const max = Math.max(...allValues.map(Math.abs))
    return max === 0 ? 1 : max * 1.1 // 여백을 위해 10% 추가
  }, [salesMonthlyTotals, purchaseMonthlyTotals, chartData])

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

  // 모달 열기 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)

  // 새 항목 추가 시작
  const handleStartAdd = () => {
    setEditingId('new')
    setCurrentContract(null)
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
    setIsModalOpen(true)
  }

  // 현재 편집 중인 계약 정보 (수정 모드에서 메타 정보 표시용)
  const [currentContract, setCurrentContract] = useState<Contract | null>(null)

  // 수정 시작
  const handleStartEdit = (contract: Contract) => {
    setEditingId(contract.contractId)
    setCurrentContract(contract)
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
    setIsModalOpen(true)
  }

  // 편집 취소
  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
    setCurrentContract(null)
    setIsModalOpen(false)
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
      setCurrentContract(null)
      setIsModalOpen(false)
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="year-picker" className="block text-sm font-medium text-gray-700 mb-1">
                연도
              </label>
              <div className="relative">
                <select
                  id="year-picker"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a] cursor-pointer appearance-none bg-white"
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
            <div>
              <label htmlFor="contract-name-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
              />
            </div>
            <div>
              <label htmlFor="company-name-filter" className="block text-sm font-medium text-gray-700 mb-1">
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={fetchContracts}
              className="px-4 py-2 text-white rounded-md focus:outline-none"
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

            {/* 마진 꺽은선 그래프 */}
            <polyline
              points={chartData.map((item, index) => {
                const x = 100 + (index * 76.67) + 38.33
                // 마진이 양수면 위로, 음수면 아래로 표시
                const marginY = 280 - ((item.margin / maxValue) * 250)
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
              // 마진이 양수면 위로, 음수면 아래로 표시
              const marginY = 280 - ((item.margin / maxValue) * 250)
              return (
                <g key={`margin-point-${index}`}>
                  <circle
                    cx={x}
                    cy={marginY}
                    r="4"
                    fill="#3b82f6"
                    stroke="white"
                    strokeWidth="2"
                    className="cursor-pointer"
                  >
                    <title>
                      {item.month} 마진: {item.margin.toLocaleString()}원
                    </title>
                  </circle>
                  {/* 마진 값 표시 */}
                  {Math.abs(item.margin) > maxValue * 0.05 && (
                    <text
                      x={x}
                      y={item.margin >= 0 ? marginY - 10 : marginY + 15}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#3b82f6"
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

      {/* 마진 계산 표 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-700">마진 계산</h3>
          <span className="text-sm text-gray-500">( * 매출 - 매입 )</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">구분</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">1월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">2월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">3월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">4월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">5월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">6월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">7월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">8월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">9월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">10월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">11월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">12월</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">합계</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">매출</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m01)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m02)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m03)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m04)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m05)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m06)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m07)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m08)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m09)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m10)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m11)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(salesMonthlyTotals.m12)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                  {formatAmount(
                    salesMonthlyTotals.m01 + salesMonthlyTotals.m02 + salesMonthlyTotals.m03 + salesMonthlyTotals.m04 +
                    salesMonthlyTotals.m05 + salesMonthlyTotals.m06 + salesMonthlyTotals.m07 + salesMonthlyTotals.m08 +
                    salesMonthlyTotals.m09 + salesMonthlyTotals.m10 + salesMonthlyTotals.m11 + salesMonthlyTotals.m12
                  )}
                </td>
              </tr>
              <tr>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">매입</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m01)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m02)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m03)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m04)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m05)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m06)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m07)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m08)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m09)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m10)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m11)}</td>
                <td className="px-4 py-3 text-sm text-right text-gray-900">{formatAmount(purchaseMonthlyTotals.m12)}</td>
                <td className="px-4 py-3 text-sm font-semibold text-right text-gray-900">
                  {formatAmount(
                    purchaseMonthlyTotals.m01 + purchaseMonthlyTotals.m02 + purchaseMonthlyTotals.m03 + purchaseMonthlyTotals.m04 +
                    purchaseMonthlyTotals.m05 + purchaseMonthlyTotals.m06 + purchaseMonthlyTotals.m07 + purchaseMonthlyTotals.m08 +
                    purchaseMonthlyTotals.m09 + purchaseMonthlyTotals.m10 + purchaseMonthlyTotals.m11 + purchaseMonthlyTotals.m12
                  )}
                </td>
              </tr>
              <tr className="bg-gray-100 border-t-2 border-gray-300">
                <td className="px-4 py-3 text-sm font-bold text-gray-900">마진</td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m01 - purchaseMonthlyTotals.m01 < 0 ? 'text-red-600' : salesMonthlyTotals.m01 - purchaseMonthlyTotals.m01 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m01 - purchaseMonthlyTotals.m01)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m02 - purchaseMonthlyTotals.m02 < 0 ? 'text-red-600' : salesMonthlyTotals.m02 - purchaseMonthlyTotals.m02 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m02 - purchaseMonthlyTotals.m02)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m03 - purchaseMonthlyTotals.m03 < 0 ? 'text-red-600' : salesMonthlyTotals.m03 - purchaseMonthlyTotals.m03 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m03 - purchaseMonthlyTotals.m03)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m04 - purchaseMonthlyTotals.m04 < 0 ? 'text-red-600' : salesMonthlyTotals.m04 - purchaseMonthlyTotals.m04 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m04 - purchaseMonthlyTotals.m04)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m05 - purchaseMonthlyTotals.m05 < 0 ? 'text-red-600' : salesMonthlyTotals.m05 - purchaseMonthlyTotals.m05 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m05 - purchaseMonthlyTotals.m05)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m06 - purchaseMonthlyTotals.m06 < 0 ? 'text-red-600' : salesMonthlyTotals.m06 - purchaseMonthlyTotals.m06 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m06 - purchaseMonthlyTotals.m06)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m07 - purchaseMonthlyTotals.m07 < 0 ? 'text-red-600' : salesMonthlyTotals.m07 - purchaseMonthlyTotals.m07 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m07 - purchaseMonthlyTotals.m07)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m08 - purchaseMonthlyTotals.m08 < 0 ? 'text-red-600' : salesMonthlyTotals.m08 - purchaseMonthlyTotals.m08 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m08 - purchaseMonthlyTotals.m08)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m09 - purchaseMonthlyTotals.m09 < 0 ? 'text-red-600' : salesMonthlyTotals.m09 - purchaseMonthlyTotals.m09 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m09 - purchaseMonthlyTotals.m09)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m10 - purchaseMonthlyTotals.m10 < 0 ? 'text-red-600' : salesMonthlyTotals.m10 - purchaseMonthlyTotals.m10 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m10 - purchaseMonthlyTotals.m10)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m11 - purchaseMonthlyTotals.m11 < 0 ? 'text-red-600' : salesMonthlyTotals.m11 - purchaseMonthlyTotals.m11 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m11 - purchaseMonthlyTotals.m11)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={salesMonthlyTotals.m12 - purchaseMonthlyTotals.m12 < 0 ? 'text-red-600' : salesMonthlyTotals.m12 - purchaseMonthlyTotals.m12 > 0 ? 'text-blue-600' : 'text-gray-900'}>
                    {formatAmount(salesMonthlyTotals.m12 - purchaseMonthlyTotals.m12)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-bold text-right">
                  <span className={
                    (salesMonthlyTotals.m01 + salesMonthlyTotals.m02 + salesMonthlyTotals.m03 + salesMonthlyTotals.m04 +
                     salesMonthlyTotals.m05 + salesMonthlyTotals.m06 + salesMonthlyTotals.m07 + salesMonthlyTotals.m08 +
                     salesMonthlyTotals.m09 + salesMonthlyTotals.m10 + salesMonthlyTotals.m11 + salesMonthlyTotals.m12) -
                    (purchaseMonthlyTotals.m01 + purchaseMonthlyTotals.m02 + purchaseMonthlyTotals.m03 + purchaseMonthlyTotals.m04 +
                     purchaseMonthlyTotals.m05 + purchaseMonthlyTotals.m06 + purchaseMonthlyTotals.m07 + purchaseMonthlyTotals.m08 +
                     purchaseMonthlyTotals.m09 + purchaseMonthlyTotals.m10 + purchaseMonthlyTotals.m11 + purchaseMonthlyTotals.m12) < 0
                      ? 'text-red-600'
                      : (salesMonthlyTotals.m01 + salesMonthlyTotals.m02 + salesMonthlyTotals.m03 + salesMonthlyTotals.m04 +
                         salesMonthlyTotals.m05 + salesMonthlyTotals.m06 + salesMonthlyTotals.m07 + salesMonthlyTotals.m08 +
                         salesMonthlyTotals.m09 + salesMonthlyTotals.m10 + salesMonthlyTotals.m11 + salesMonthlyTotals.m12) -
                        (purchaseMonthlyTotals.m01 + purchaseMonthlyTotals.m02 + purchaseMonthlyTotals.m03 + purchaseMonthlyTotals.m04 +
                         purchaseMonthlyTotals.m05 + purchaseMonthlyTotals.m06 + purchaseMonthlyTotals.m07 + purchaseMonthlyTotals.m08 +
                         purchaseMonthlyTotals.m09 + purchaseMonthlyTotals.m10 + purchaseMonthlyTotals.m11 + purchaseMonthlyTotals.m12) > 0
                        ? 'text-blue-600'
                        : 'text-gray-900'
                  }>
                    {formatAmount(
                      (salesMonthlyTotals.m01 + salesMonthlyTotals.m02 + salesMonthlyTotals.m03 + salesMonthlyTotals.m04 +
                       salesMonthlyTotals.m05 + salesMonthlyTotals.m06 + salesMonthlyTotals.m07 + salesMonthlyTotals.m08 +
                       salesMonthlyTotals.m09 + salesMonthlyTotals.m10 + salesMonthlyTotals.m11 + salesMonthlyTotals.m12) -
                      (purchaseMonthlyTotals.m01 + purchaseMonthlyTotals.m02 + purchaseMonthlyTotals.m03 + purchaseMonthlyTotals.m04 +
                       purchaseMonthlyTotals.m05 + purchaseMonthlyTotals.m06 + purchaseMonthlyTotals.m07 + purchaseMonthlyTotals.m08 +
                       purchaseMonthlyTotals.m09 + purchaseMonthlyTotals.m10 + purchaseMonthlyTotals.m11 + purchaseMonthlyTotals.m12)
                    )}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleStartAdd}
            disabled={isModalOpen}
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#66bb6a' }}
            onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4caf50')}
            onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#66bb6a')}
          >
            등록
          </button>
          <button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none active:outline-none focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            선택삭제 ({selectedIds.size})
          </button>
          <button
            onClick={handleDeleteAll}
            disabled={currentContracts.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none active:outline-none focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            전체삭제
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadContractSampleExcel}
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none flex items-center gap-2"
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
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none cursor-pointer flex items-center gap-2"
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
            className="px-4 py-2 text-white rounded-md focus:outline-none active:outline-none flex items-center gap-2"
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                <>
                  {/* 데이터 행 */}
                  {currentContracts.length === 0 ? (
                    <tr>
                      <td colSpan={17} className="px-4 py-8 text-center text-gray-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    currentContracts.map((contract) => {
                      return (
                        <tr 
                          key={contract.contractId} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            if (!isModalOpen) {
                              handleStartEdit(contract)
                            }
                          }}
                        >
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(contract.contractId)}
                              onChange={() => handleSelect(contract.contractId)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{contract.contractName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{contract.companyName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{contract.contractStart}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm text-gray-900">{contract.contractEnd}</span>
                          </td>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                            const key = `m${String(month).padStart(2, '0')}` as keyof Contract
                            const value = contract[key] as number
                            return (
                              <td key={month} className="px-4 py-3">
                                <span className={`text-sm text-right ${
                                  value < 0 ? 'text-red-600' : value > 0 ? 'text-blue-600' : 'text-gray-900'
                                }`}>
                                  {formatAmount(value)}
                                </span>
                              </td>
                            )
                          })}
                          <td className="px-4 py-3 text-sm font-semibold text-right">
                            <span className={contract.totalAmount < 0 ? 'text-red-600' : contract.totalAmount > 0 ? 'text-blue-600' : 'text-gray-900'}>
                              {formatAmount(contract.totalAmount)}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  )}

                  {/* 월별 합계 행 */}
                  {!isLoading && currentContracts.length > 0 && (
                    <tr className="bg-gray-100 border-t-2 border-gray-300">
                      <td className="px-4 py-3" colSpan={4}></td>
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
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 팝업 */}
      {isModalOpen && editingData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto m-4">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingId === 'new' 
                  ? (selectedTab === 'sales' ? '매출 등록' : '매입 등록')
                  : (selectedTab === 'sales' ? '매출 수정' : '매입 수정')}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">계약 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      계약명 <span className="text-red-500">*</span>
                    </label>
                  <input
                    type="text"
                    value={editingData.contractName}
                    onChange={(e) =>
                      setEditingData({ ...editingData, contractName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                    placeholder="계약명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    회사명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingData.companyName}
                    onChange={(e) =>
                      setEditingData({ ...editingData, companyName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                    placeholder="회사명을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계약시작일
                  </label>
                  <input
                    type="date"
                    value={editingData.contractStart}
                    onChange={(e) =>
                      setEditingData({ ...editingData, contractStart: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계약종료일
                  </label>
                  <input
                    type="date"
                    value={editingData.contractEnd}
                    onChange={(e) =>
                      setEditingData({ ...editingData, contractEnd: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    청구규칙
                  </label>
                  <input
                    type="text"
                    value={editingData.invoiceRule}
                    onChange={(e) =>
                      setEditingData({ ...editingData, invoiceRule: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                    placeholder="청구규칙을 입력하세요"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    결제조건
                  </label>
                  <input
                    type="text"
                    value={editingData.paymentTerm}
                    onChange={(e) =>
                      setEditingData({ ...editingData, paymentTerm: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                    placeholder="결제조건을 입력하세요"
                  />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월별 금액
                </label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
                    const key = `m${String(month).padStart(2, '0')}` as keyof ContractRequest
                    return (
                      <div key={month}>
                        <label className="block text-xs text-gray-600 mb-1">
                          {month}월
                        </label>
                        <input
                          type="number"
                          value={editingData[key] || 0}
                          onChange={(e) =>
                            setEditingData({
                              ...editingData,
                              [key]: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm text-right focus:outline-none focus:ring-[#66bb6a]"
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">합계:</span>
                    <span className="text-lg font-bold text-gray-900">
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
                    </span>
                  </div>
                </div>
              </div>
              
              {/* 수정 모드일 때만 메타 정보 표시 */}
              {editingId !== 'new' && currentContract && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">등록/수정 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">등록자</label>
                      <div className="text-sm text-gray-900">{currentContract.createdBy || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">등록일시</label>
                      <div className="text-sm text-gray-900">{currentContract.createdAt}</div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">수정자</label>
                      <div className="text-sm text-gray-900">{currentContract.updatedBy || '-'}</div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">수정일시</label>
                      <div className="text-sm text-gray-900">{currentContract.updatedAt}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-white rounded-md focus:outline-none"
                style={{ backgroundColor: '#66bb6a' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4caf50'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#66bb6a'}
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

export default Contract
