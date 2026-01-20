import { ApiResponse, UserInfo } from '../auth/auth'

// 사용자 목록 조회는 배열을 직접 반환하므로 UserInfo[] 타입 사용

// 사용자 생성 요청 타입
export interface CreateUserRequest {
  loginId: string
  password: string
  nickname: string
  role: string
  isActive?: boolean
}

// 사용자 수정 요청 타입
export interface UpdateUserRequest {
  userId: number
  nickname?: string
  role?: string
  isActive?: boolean
}

// 사용자 목록 조회 파라미터 타입
export interface UserListParams {
  userId?: number
  loginId?: string
  nickname?: string
  role?: string
  isActive?: boolean
  isFirstLogin?: boolean
}

export type { ApiResponse, UserInfo }
