import axios from 'axios'
import { apiClient } from './commonApi'
import type { ApiResponse, UserInfo } from '../../types/auth/auth'
import type { CreateUserRequest, UpdateUserRequest, UserListParams } from '../../types/user/user'

/**
 * 사용자 목록 조회 API
 */
export const getUserList = async (params?: UserListParams, signal?: AbortSignal): Promise<UserInfo[]> => {
  try {
    // 기본값 설정
    const queryParams: any = {
      userId: params?.userId ?? 0,
      loginId: params?.loginId ?? '',
      nickname: params?.nickname ?? '',
      role: params?.role ?? '',
      isActive: params?.isActive !== undefined ? params.isActive : '',
      isFirstLogin: params?.isFirstLogin !== undefined ? params.isFirstLogin : '',
    }

    const response = await apiClient.post<ApiResponse<UserInfo[]>>('/user/list', {}, {
      params: queryParams,
      signal,
    })
    
    if (response.data.code === '000000' && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.frontMessage || response.data.message || '사용자 목록 조회 실패')
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '사용자 목록 조회 실패')
    }
    throw error
  }
}

/**
 * 사용자 생성 API
 */
export const createUser = async (request: CreateUserRequest): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<null>>('/user/create', request)
    
    if (response.data.code !== '000000') {
      throw new Error(response.data.frontMessage || response.data.message || '사용자 생성 실패')
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '사용자 생성 실패')
    }
    throw error
  }
}

/**
 * 사용자 수정 API
 */
export const updateUser = async (userId: number, request: UpdateUserRequest): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<null>>('/user/update', {
      userId,
      nickname: request.nickname,
      role: request.role,
      isActive: request.isActive,
    })
    
    if (response.data.code !== '000000') {
      throw new Error(response.data.frontMessage || response.data.message || '사용자 수정 실패')
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '사용자 수정 실패')
    }
    throw error
  }
}

/**
 * 사용자 삭제 API
 */
export const deleteUser = async (userId: number): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<null>>('/user/delete', {}, {
      params: { userId },
    })
    
    if (response.data.code !== '000000') {
      throw new Error(response.data.frontMessage || response.data.message || '사용자 삭제 실패')
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '사용자 삭제 실패')
    }
    throw error
  }
}

/**
 * 비밀번호 초기화 API
 */
export const resetUserPassword = async (userId: number, newPassword: string): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse<null>>('/user/password/init', {
      userId,
      newPassword,
    })
    
    if (response.data.code !== '000000') {
      throw new Error(response.data.frontMessage || response.data.message || '비밀번호 초기화 실패')
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '비밀번호 초기화 실패')
    }
    throw error
  }
}
