import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { getAccessToken, removeAccessToken, setAccessToken } from '../auth'
import type { ApiResponse, RefreshTokenResponse } from '../../types/auth/auth'
import { ERROR_CODES, RETRYABLE_TOKEN_ERRORS } from '../../types/auth/auth'

// API 기본 URL
export const API_BASE_URL = 'http://localhost:8080/api'

// axios 인스턴스 생성
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: '*/*',
  },
})

// 요청 인터셉터 - 모든 요청에 토큰 자동 추가
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken()
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 에러 처리
apiClient.interceptors.response.use(
  (response) => {
    // blob 응답은 JSON이 아니므로 code 체크 제외
    if (response.data instanceof Blob) {
      return response
    }

    // auth API는 제외하고, 다른 API에서 code가 "000000"이 아니면 에러로 처리
    const url = response.config.url || ''
    const isAuthApi = url.includes('/auth/')
    
    if (!isAuthApi && response.data?.code && response.data.code !== '000000') {
      const errorMessage = response.data.frontMessage || response.data.message || '요청 처리 실패'
      
      // 커스텀 이벤트를 발생시켜 알림 모달 표시
      window.dispatchEvent(
        new CustomEvent('api-error', {
          detail: { message: errorMessage },
        })
      )
      
      // 에러로 처리하여 catch 블록에서 처리되도록 함
      const error = new Error(errorMessage) as any
      error.response = {
        status: 200, // HTTP는 성공이지만 비즈니스 로직 에러
        data: response.data,
      }
      error.isAxiosError = true
      return Promise.reject(error)
    }
    
    return response
  },
  async (error: AxiosError<ApiResponse>) => {
    // blob 응답의 에러인 경우 (엑셀 다운로드 실패 등)
    if (error.config?.responseType === 'blob' && error.response?.data instanceof Blob) {
      try {
        const text = await (error.response.data as Blob).text()
        const errorData = JSON.parse(text)
        if (errorData.code && errorData.code !== '000000') {
          const errorMessage = errorData.frontMessage || errorData.message || '요청 처리 실패'
          
          // 커스텀 이벤트를 발생시켜 알림 모달 표시
          window.dispatchEvent(
            new CustomEvent('api-error', {
              detail: { message: errorMessage },
            })
          )
          
          const apiError = new Error(errorMessage) as any
          apiError.response = {
            status: error.response.status,
            data: errorData,
          }
          apiError.isAxiosError = true
          return Promise.reject(apiError)
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 일반 에러로 처리
        return Promise.reject(error)
      }
    }

    const errorCode = error.response?.data?.code
    const originalRequest = error.config

    // 401 에러이거나 토큰 관련 에러 코드인 경우
    if (error.response?.status === 401 && errorCode) {
      // 토큰 재시도 가능한 에러 코드인 경우에만 refreshToken 시도
      if (RETRYABLE_TOKEN_ERRORS.includes(errorCode as any)) {
        try {
          const newToken = await refreshAccessToken()
          if (newToken && originalRequest && originalRequest.headers) {
            // 새 토큰으로 원래 요청 재시도
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          // 리프레시 실패 시 로그인 페이지로 리다이렉트
          const refreshErrorResponse = refreshError as AxiosError<ApiResponse>
          const refreshErrorCode = refreshErrorResponse.response?.data?.code
          
          // refreshToken 자체에서 토큰 재시도 불가능한 에러가 발생한 경우
          if (refreshErrorCode && !RETRYABLE_TOKEN_ERRORS.includes(refreshErrorCode as any)) {
            removeAccessToken()
            const errorMessage = refreshErrorResponse.response?.data?.frontMessage || 
                                refreshErrorResponse.response?.data?.message || 
                                '인증 실패하였습니다. 다시 로그인해주세요.'
            window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`
            return Promise.reject(refreshError)
          }
          
          // 기타 리프레시 실패
          removeAccessToken()
          window.location.href = '/login'
          return Promise.reject(refreshError)
        }
      } else {
        // 토큰 재시도 불가능한 에러 (A00002, A00003, A00007 등)
        removeAccessToken()
        const errorMessage = error.response?.data?.frontMessage || 
                            error.response?.data?.message || 
                            '인증 실패하였습니다. 다시 로그인해주세요.'
        window.location.href = `/login?error=${encodeURIComponent(errorMessage)}`
        return Promise.reject(error)
      }
    }

    // 401 에러이지만 에러 코드가 없는 경우도 로그인 페이지로 리다이렉트
    if (error.response?.status === 401 && !errorCode) {
      removeAccessToken()
      window.location.href = '/login'
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

/**
 * Content-Disposition 헤더에서 파일명 추출
 */
export const getFileNameFromHeader = (contentDisposition: string | null): string | null => {
  if (!contentDisposition) return null
  
  const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
  if (fileNameMatch && fileNameMatch[1]) {
    let fileName = fileNameMatch[1].replace(/['"]/g, '')
    // UTF-8 인코딩된 파일명 처리 (filename*=UTF-8''...)
    if (fileName.startsWith("UTF-8''")) {
      fileName = decodeURIComponent(fileName.replace("UTF-8''", ''))
    }
    return fileName
  }
  return null
}

/**
 * 액세스 토큰 리프레시
 */
export const refreshAccessToken = async (): Promise<string | null> => {
  const currentToken = getAccessToken()
  if (!currentToken) {
    // AxiosError 형태로 변환
    const error = axios.create().post('/') as any
    error.response = {
      status: 401,
      data: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: '토큰이 없습니다.',
        frontMessage: '인증 실패하였습니다. 다시 로그인해주세요.',
        data: null,
      },
    }
    error.isAxiosError = true
    throw error
  }

  try {
    const response = await axios.post<ApiResponse<RefreshTokenResponse>>(
      `${API_BASE_URL}/auth/refreshToken`,
      {},
      {
        headers: {
          Authorization: `Bearer ${currentToken}`,
          Accept: '*/*',
        },
        withCredentials: true,
      }
    )

    if (response.data.code === '000000' && response.data.data?.accessToken) {
      const newToken = response.data.data.accessToken
      setAccessToken(newToken)
      return newToken
    }

    // 성공 코드가 아닌 경우 AxiosError로 변환하여 throw
    // 인터셉터에서 에러 코드를 확인할 수 있도록 함
    const error = axios.create().post('/') as any
    error.response = {
      status: 401,
      data: {
        code: response.data.code,
        message: response.data.message,
        frontMessage: response.data.frontMessage,
        data: null,
      },
    }
    error.isAxiosError = true
    throw error
  } catch (error) {
    // axios 에러인 경우 그대로 throw (인터셉터에서 처리)
    if (axios.isAxiosError(error)) {
      throw error
    }
    // 기타 에러는 AxiosError로 변환
    const axiosError = axios.create().post('/') as any
    axiosError.response = {
      status: 401,
      data: {
        code: ERROR_CODES.UNAUTHORIZED,
        message: error instanceof Error ? error.message : '토큰 리프레시 실패',
        frontMessage: '인증 실패하였습니다. 다시 로그인해주세요.',
        data: null,
      },
    }
    axiosError.isAxiosError = true
    throw axiosError
  }
}
