import { apiClient } from './commonApi'
import type { ApiResponse } from '../../types/auth/auth'
import type { Expense, ExpenseRequest } from '../../types/expense/expense'

/**
 * 경비 목록 조회
 */
export const getExpenseList = async (year: number): Promise<Expense[]> => {
  const response = await apiClient.post<ApiResponse<Expense[]>>(
    `/expense/list?year=${year}`,
    {},
    { withCredentials: true }
  )
  
  if (response.data.code === '000000' && response.data.data) {
    return response.data.data
  }
  
  throw new Error(response.data.frontMessage || response.data.message || '경비 목록 조회 실패')
}

/**
 * 경비 등록
 */
export const createExpense = async (expense: ExpenseRequest): Promise<Expense> => {
  const response = await apiClient.post<ApiResponse<Expense>>(
    '/expense',
    expense,
    { withCredentials: true }
  )
  
  if (response.data.code === '000000' && response.data.data) {
    return response.data.data
  }
  
  throw new Error(response.data.frontMessage || response.data.message || '경비 등록 실패')
}

/**
 * 경비 수정
 */
export const updateExpense = async (expenseId: number, expense: ExpenseRequest): Promise<Expense> => {
  const response = await apiClient.put<ApiResponse<Expense>>(
    `/expense/${expenseId}`,
    expense,
    { withCredentials: true }
  )
  
  if (response.data.code === '000000' && response.data.data) {
    return response.data.data
  }
  
  throw new Error(response.data.frontMessage || response.data.message || '경비 수정 실패')
}

/**
 * 경비 삭제 (단일)
 */
export const deleteExpense = async (expenseId: number): Promise<void> => {
  const response = await apiClient.delete<ApiResponse>(
    `/expense/${expenseId}`,
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
  const response = await apiClient.post<ApiResponse>(
    '/expense/delete',
    { expenseIds },
    { withCredentials: true }
  )
  
  if (response.data.code !== '000000') {
    throw new Error(response.data.frontMessage || response.data.message || '경비 삭제 실패')
  }
}
