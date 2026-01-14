// API 응답 공통 타입
export interface ApiResponse<T = any> {
  code: string
  message: string
  frontMessage: string
  data: T
}

// 에러 코드 상수
export const ERROR_CODES = {
  // 토큰 재시도 가능한 에러
  INVALID_TOKEN_1: 'A00001', // access token 만료
  INVALID_TOKEN_4: 'A00004', // 토큰 유효시간 만료 1
  INVALID_TOKEN_5: 'A00005', // 토큰 유효시간 만료 2
  
  // 토큰 재시도 불가능한 에러 (로그인 필요)
  INVALID_TOKEN_2: 'A00002', // refresh token이 없습니다
  INVALID_TOKEN_3: 'A00003', // db 조회 null || isRevoked = true
  
  // 기타 에러
  INVALID_PW: 'A00006', // 비밀번호 오류
  UNAUTHORIZED: 'A00007', // 인증 실패
} as const

// 토큰 재시도 가능한 에러 코드 목록
export const RETRYABLE_TOKEN_ERRORS = [
  ERROR_CODES.INVALID_TOKEN_1,
  ERROR_CODES.INVALID_TOKEN_4,
  ERROR_CODES.INVALID_TOKEN_5,
]

// 로그인 요청 타입
export interface LoginRequest {
  loginId: string
  password: string
}

// 로그인 응답 타입
export interface LoginResponse {
  accessToken: string
}

// 리프레시 토큰 응답 타입
export interface RefreshTokenResponse {
  accessToken: string
}
