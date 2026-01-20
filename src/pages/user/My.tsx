import { useState, useEffect, useRef } from 'react'
import { getMyInfo } from '../../utils/api'
import type { UserInfo } from '../../types/auth/auth'
import Swal from 'sweetalert2'

const My = () => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetchUserInfo()
    
    // cleanup 함수에서 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const fetchUserInfo = async () => {
    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    try {
      const data = await getMyInfo(abortController.signal)
      
      // 요청이 취소되지 않았을 때만 상태 업데이트
      if (!abortController.signal.aborted) {
        setUserInfo(data)
      }
    } catch (error: any) {
      // AbortError는 무시 (요청이 취소된 경우)
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        return
      }
      if (!abortController.signal.aborted) {
        Swal.fire({
          icon: 'error',
          title: '오류',
          text: error.message || '내 정보 조회 실패',
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      master: '마스터 관리자',
      admin: '관리자',
      user: '일반 사용자',
    }
    return roleMap[role] || role
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-gray-900">내 정보 조회</h2>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : userInfo ? (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사용자 ID
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {userInfo.userId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  로그인 ID
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {userInfo.loginId}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  닉네임
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {userInfo.nickname}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  권한
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {getRoleLabel(userInfo.role)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  상태
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userInfo.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {userInfo.isActive ? '활성' : '비활성'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최초 로그인 여부
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      userInfo.isFirstLogin
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {userInfo.isFirstLogin ? '최초 로그인' : '일반'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  등록일시
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {formatDate(userInfo.createdAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정일시
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {formatDate(userInfo.updatedAt)}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  등록자
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {userInfo.createdBy || '-'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  수정자
                </label>
                <div className="px-4 py-2 bg-gray-50 rounded-md text-gray-900">
                  {userInfo.updatedBy || '-'}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>
      )}
    </div>
  )
}

export default My
