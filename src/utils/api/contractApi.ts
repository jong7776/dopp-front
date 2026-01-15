import { apiClient, getFileNameFromHeader } from './commonApi'
import type { ApiResponse } from '../../types/auth/auth'
import type { ContractListResponse, ContractRequest } from '../../types/financial-management/contract'

/**
 * 계약 목록 조회
 */
export const getContractList = async (year: number, signal?: AbortSignal): Promise<ContractListResponse> => {
  const response = await apiClient.post<ApiResponse<ContractListResponse>>(
    `/financial-management/contract/list?year=${year}`,
    {},
    { 
      withCredentials: true,
      signal, // AbortSignal 전달
    }
  )
  
  if (response.data.code === '000000' && response.data.data) {
    return response.data.data
  }
  
  throw new Error(response.data.frontMessage || response.data.message || '계약 목록 조회 실패')
}

/**
 * 계약 등록
 */
export const createContract = async (contract: ContractRequest): Promise<void> => {
  // totalAmount 계산
  const totalAmount = (contract.m01 || 0) + 
    (contract.m02 || 0) + 
    (contract.m03 || 0) + 
    (contract.m04 || 0) + 
    (contract.m05 || 0) + 
    (contract.m06 || 0) + 
    (contract.m07 || 0) + 
    (contract.m08 || 0) + 
    (contract.m09 || 0) + 
    (contract.m10 || 0) + 
    (contract.m11 || 0) + 
    (contract.m12 || 0)

  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/contract/create',
    {
      contractId: 0,
      type: contract.type,
      year: contract.year,
      contractName: contract.contractName,
      companyName: contract.companyName,
      contractStart: contract.contractStart,
      contractEnd: contract.contractEnd,
      invoiceRule: contract.invoiceRule,
      paymentTerm: contract.paymentTerm,
      totalAmount: totalAmount,
      m01: contract.m01 || 0,
      m02: contract.m02 || 0,
      m03: contract.m03 || 0,
      m04: contract.m04 || 0,
      m05: contract.m05 || 0,
      m06: contract.m06 || 0,
      m07: contract.m07 || 0,
      m08: contract.m08 || 0,
      m09: contract.m09 || 0,
      m10: contract.m10 || 0,
      m11: contract.m11 || 0,
      m12: contract.m12 || 0,
    },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '계약 등록 실패')
  }
}

/**
 * 계약 수정
 */
export const updateContract = async (contractId: number, contract: ContractRequest): Promise<void> => {
  // totalAmount 계산
  const totalAmount = (contract.m01 || 0) + 
    (contract.m02 || 0) + 
    (contract.m03 || 0) + 
    (contract.m04 || 0) + 
    (contract.m05 || 0) + 
    (contract.m06 || 0) + 
    (contract.m07 || 0) + 
    (contract.m08 || 0) + 
    (contract.m09 || 0) + 
    (contract.m10 || 0) + 
    (contract.m11 || 0) + 
    (contract.m12 || 0)

  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/contract/update',
    {
      contractId: contractId,
      type: contract.type,
      year: contract.year,
      contractName: contract.contractName,
      companyName: contract.companyName,
      contractStart: contract.contractStart,
      contractEnd: contract.contractEnd,
      invoiceRule: contract.invoiceRule,
      paymentTerm: contract.paymentTerm,
      totalAmount: totalAmount,
      m01: contract.m01 || 0,
      m02: contract.m02 || 0,
      m03: contract.m03 || 0,
      m04: contract.m04 || 0,
      m05: contract.m05 || 0,
      m06: contract.m06 || 0,
      m07: contract.m07 || 0,
      m08: contract.m08 || 0,
      m09: contract.m09 || 0,
      m10: contract.m10 || 0,
      m11: contract.m11 || 0,
      m12: contract.m12 || 0,
    },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '계약 수정 실패')
  }
}

/**
 * 계약 삭제 (다중)
 */
export const deleteContracts = async (contractIds: number[]): Promise<void> => {
  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/contract/delete',
    { contractIds },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '계약 삭제 실패')
  }
}

/**
 * 계약 전체 삭제 (연도별, 타입별)
 */
export const deleteAllContracts = async (year: number, type: 'S' | 'P'): Promise<void> => {
  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/contract/delete/all',
    { year, type },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '계약 전체 삭제 실패')
  }
}

/**
 * 엑셀 업로드
 */
export const uploadContractExcel = async (file: File): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<ApiResponse>(
    '/financial-management/contract/list/excel/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true,
    }
  )

  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '엑셀 업로드 실패')
  }
}

/**
 * 엑셀 다운로드
 */
export const downloadContractExcel = async (year: number): Promise<void> => {
  try {
    const response = await apiClient.post<Blob>(
      `/financial-management/contract/list/excel/download?year=${year}`,
      {},
      {
        responseType: 'blob', // 엑셀 파일은 blob으로 받음
        withCredentials: true,
      }
    )

    // 응답이 실제로 blob인지 확인 (에러 응답일 수도 있음)
    if (response.data instanceof Blob) {
      // blob의 타입을 확인하여 JSON 에러인지 체크
      const blobType = response.data.type
      if (blobType === 'application/json' || blobType.startsWith('application/json')) {
        // JSON 에러 응답인 경우
        const text = await response.data.text()
        const errorData = JSON.parse(text)
        if (errorData.code && errorData.code !== '000000') {
          throw new Error(errorData.frontMessage || errorData.message || '엑셀 다운로드 실패')
        }
      }

      // Content-Disposition 헤더에서 파일명 추출
      const contentDisposition = response.headers['content-disposition'] || response.headers['Content-Disposition']
      let fileName = getFileNameFromHeader(contentDisposition)
      
      // 파일명이 없으면 기본값 사용
      if (!fileName) {
        fileName = `계약_목록_${year}.xlsx`
      }

      // 정상 엑셀 파일인 경우 다운로드
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    }
  } catch (error: any) {
    // axios 에러인 경우
    if (error.response?.data instanceof Blob) {
      // blob 에러 응답을 JSON으로 파싱
      try {
        const text = await error.response.data.text()
        const errorData = JSON.parse(text)
        if (errorData.code && errorData.code !== '000000') {
          throw new Error(errorData.frontMessage || errorData.message || '엑셀 다운로드 실패')
        }
      } catch (parseError) {
        throw new Error('엑셀 다운로드 실패')
      }
    }
    throw error
  }
}
