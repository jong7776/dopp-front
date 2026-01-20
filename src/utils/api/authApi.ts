import axios from 'axios'
import { setAccessToken, removeAccessToken } from '../auth'
import { apiClient } from './commonApi'
import type { ApiResponse, LoginRequest, LoginResponse, UserInfo, ChangePasswordRequest } from '../../types/auth/auth'

/**
 * 로그인 API
 */
export const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials,
      { withCredentials: true }
    )
    
    if (response.data.code === '000000' && response.data.data?.accessToken) {
      setAccessToken(response.data.data.accessToken)
      return response.data.data
    }
    
    // 성공 코드가 아닌 경우
    throw new Error(response.data.frontMessage || response.data.message || '로그인 실패')
  } catch (error) {
    // Axios 에러인 경우 응답 데이터에서 에러 메시지 추출
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '로그인 실패')
    }
    // 기타 에러는 그대로 throw
    throw error
  }
}

/**
 * 로그아웃 API
 */
export const logout = async (): Promise<void> => {
  try {
    // 로그아웃 API 호출
    await apiClient.post<ApiResponse>('/auth/logout', {}, { withCredentials: true })
  } catch (error) {
    // 로그아웃 API 실패해도 클라이언트 측에서는 로그아웃 처리
    console.error('로그아웃 API 호출 실패:', error)
  } finally {
    // 토큰 삭제 및 로그인 페이지로 리다이렉트
    removeAccessToken()
    window.location.href = '/login'
  }
}

/**
 * 내 정보 조회 API
 */
export const getMyInfo = async (signal?: AbortSignal): Promise<UserInfo> => {
  try {
    const response = await apiClient.get<ApiResponse<UserInfo>>('/user/my', {
      signal,
    })
    
    if (response.data.code === '000000' && response.data.data) {
      return response.data.data
    }
    
    throw new Error(response.data.frontMessage || response.data.message || '내 정보 조회 실패')
  } catch (error) {
    // AbortError는 무시 (요청이 취소된 경우)
    if (axios.isAxiosError(error) && error.name === 'AbortError') {
      throw error
    }
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '내 정보 조회 실패')
    }
    throw error
  }
}

/**
 * 비밀번호 수정 API
 */
export const changePassword = async (request: ChangePasswordRequest): Promise<void> => {
  try {
    const response = await apiClient.post<ApiResponse>(
      '/user/password/update',
      {
        userId: request.userId,
        currentPassword: request.currentPassword,
        newPassword: request.newPassword,
      }
    )
    
    if (response.data.code !== '000000') {
      throw new Error(response.data.frontMessage || response.data.message || '비밀번호 수정 실패')
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data as ApiResponse
      throw new Error(errorData.frontMessage || errorData.message || '비밀번호 수정 실패')
    }
    throw error
  }
}
