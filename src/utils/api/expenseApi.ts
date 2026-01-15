import { apiClient, getFileNameFromHeader } from './commonApi'
import type { ApiResponse } from '../../types/auth/auth'
import type { Expense, ExpenseRequest } from '../../types/financial-management/expense'

/**
 * 경비 목록 조회
 */
export const getExpenseList = async (year: number, signal?: AbortSignal): Promise<Expense[]> => {
  const response = await apiClient.post<ApiResponse<Expense[]>>(
    `/financial-management/expense/list?year=${year}`,
    {},
    { 
      withCredentials: true,
      signal, // AbortSignal 전달
    }
  )
  
  if (response.data.code === '000000' && response.data.data) {
    return response.data.data
  }
  
  throw new Error(response.data.frontMessage || response.data.message || '경비 목록 조회 실패')
}

/**
 * 경비 등록
 */
export const createExpense = async (expense: ExpenseRequest): Promise<void> => {
  // totalAmount 계산
  const totalAmount = (expense.m01 || 0) + 
    (expense.m02 || 0) + 
    (expense.m03 || 0) + 
    (expense.m04 || 0) + 
    (expense.m05 || 0) + 
    (expense.m06 || 0) + 
    (expense.m07 || 0) + 
    (expense.m08 || 0) + 
    (expense.m09 || 0) + 
    (expense.m10 || 0) + 
    (expense.m11 || 0) + 
    (expense.m12 || 0)

  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/expense/create',
    {
      expenseId: 0,
      expenseName: expense.expenseName,
      year: expense.year,
      totalAmount: totalAmount,
      m01: expense.m01 || 0,
      m02: expense.m02 || 0,
      m03: expense.m03 || 0,
      m04: expense.m04 || 0,
      m05: expense.m05 || 0,
      m06: expense.m06 || 0,
      m07: expense.m07 || 0,
      m08: expense.m08 || 0,
      m09: expense.m09 || 0,
      m10: expense.m10 || 0,
      m11: expense.m11 || 0,
      m12: expense.m12 || 0,
    },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '경비 등록 실패')
  }
}

/**
 * 경비 수정
 */
export const updateExpense = async (expenseId: number, expense: ExpenseRequest): Promise<void> => {
  // totalAmount 계산
  const totalAmount = (expense.m01 || 0) + 
    (expense.m02 || 0) + 
    (expense.m03 || 0) + 
    (expense.m04 || 0) + 
    (expense.m05 || 0) + 
    (expense.m06 || 0) + 
    (expense.m07 || 0) + 
    (expense.m08 || 0) + 
    (expense.m09 || 0) + 
    (expense.m10 || 0) + 
    (expense.m11 || 0) + 
    (expense.m12 || 0)

  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/expense/update',
    {
      expenseId: expenseId,
      expenseName: expense.expenseName,
      year: expense.year,
      totalAmount: totalAmount,
      m01: expense.m01 || 0,
      m02: expense.m02 || 0,
      m03: expense.m03 || 0,
      m04: expense.m04 || 0,
      m05: expense.m05 || 0,
      m06: expense.m06 || 0,
      m07: expense.m07 || 0,
      m08: expense.m08 || 0,
      m09: expense.m09 || 0,
      m10: expense.m10 || 0,
      m11: expense.m11 || 0,
      m12: expense.m12 || 0,
    },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '경비 수정 실패')
  }
}

/**
 * 경비 삭제 (단일)
 */
export const deleteExpense = async (expenseId: number): Promise<void> => {
  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/expense/delete',
    { expenseId },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '경비 삭제 실패')
  }
}

/**
 * 경비 삭제 (다중)
 */
export const deleteExpenses = async (expenseIds: number[]): Promise<void> => {
  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/expense/delete',
    { expenseIds },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '경비 삭제 실패')
  }
}

/**
 * 경비 전체 삭제 (연도별)
 */
export const deleteAllExpenses = async (year: number): Promise<void> => {
  const response = await apiClient.post<ApiResponse<null>>(
    '/financial-management/expense/delete/all',
    { year },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '경비 전체 삭제 실패')
  }
}

/**
 * 엑셀 업로드
 */
export const uploadExpenseExcel = async (file: File): Promise<void> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<ApiResponse>(
    '/financial-management/expense/list/excel/upload',
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
export const downloadExpenseExcel = async (year: number): Promise<void> => {
  try {
    const response = await apiClient.post<Blob>(
      `/financial-management/expense/list/excel/download?year=${year}`,
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
        fileName = `경비_목록_${year}.xlsx`
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