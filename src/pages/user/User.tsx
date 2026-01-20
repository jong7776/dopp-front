import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword } from '../../utils/api/userApi'
import type { UserInfo, CreateUserRequest, UpdateUserRequest } from '../../types/user/user'
import Swal from 'sweetalert2'

const User = () => {
  const [users, setUsers] = useState<UserInfo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [editingData, setEditingData] = useState<CreateUserRequest | UpdateUserRequest | null>(null)
  const [filters, setFilters] = useState({
    loginId: '',
    nickname: '',
    role: '',
    isActive: '',
    isFirstLogin: '',
  })
  const abortControllerRef = useRef<AbortController | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevFiltersKeyRef = useRef<string | null>(null)
  const isInitialMountRef = useRef<boolean>(true)

  /**
   * 사용자 목록 조회 함수
   * - AbortController를 사용하여 중복 호출 방지
   * - filters를 기반으로 API 호출
   */
  const fetchUsers = async (currentFilters?: typeof filters) => {
    // 이전 요청이 있으면 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // 새로운 AbortController 생성
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    // 현재 filters 사용 (파라미터가 없으면 현재 상태 사용)
    const filtersToUse = currentFilters || filters

    setIsLoading(true)
    try {
      const params: any = {}
      if (filtersToUse.loginId.trim()) params.loginId = filtersToUse.loginId.trim()
      if (filtersToUse.nickname.trim()) params.nickname = filtersToUse.nickname.trim()
      if (filtersToUse.role) params.role = filtersToUse.role
      if (filtersToUse.isActive !== '') params.isActive = filtersToUse.isActive === 'true'
      if (filtersToUse.isFirstLogin !== '') params.isFirstLogin = filtersToUse.isFirstLogin === 'true'

      const data = await getUserList(params, abortController.signal)
      
      // 요청이 취소되지 않았을 때만 상태 업데이트
      if (!abortController.signal.aborted) {
        setUsers(data || [])
      }
    } catch (error: any) {
      // 취소된 요청은 무시 (의도적인 취소)
      if (axios.isCancel(error) || error.code === 'ERR_CANCELED' || error.name === 'AbortError' || error.name === 'CanceledError') {
        return
      }
      
      // 요청이 취소되지 않았을 때만 에러 표시
      if (!abortController.signal.aborted) {
        Swal.fire({
          icon: 'error',
          title: '오류',
          text: error.message || '사용자 목록 조회 실패',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      }
    } finally {
      // 요청이 취소되지 않았을 때만 로딩 상태 해제
      if (!abortController.signal.aborted) {
        setIsLoading(false)
      }
    }
  }

  // 최초 1회만 API 호출 (컴포넌트 마운트 시)
  useEffect(() => {
    // 초기 마운트 시에만 실행
    const filtersKey = JSON.stringify(filters)
    prevFiltersKeyRef.current = filtersKey
    fetchUsers(filters)
    isInitialMountRef.current = false

    // cleanup: 컴포넌트 언마운트 시 이전 요청 취소
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 입력 필드(loginId, nickname) 변경 시 debounce 적용 후 자동 조회
  useEffect(() => {
    // 초기 마운트가 아니고, 입력 필드가 변경된 경우에만 실행
    if (!isInitialMountRef.current) {
      // 이전 타이머가 있으면 취소
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // 1초 후에 조회 실행
      debounceTimerRef.current = setTimeout(() => {
        const filtersKey = JSON.stringify(filters)
        // 이전 조회 조건과 다를 때만 호출 (중복 조회 방지)
        if (prevFiltersKeyRef.current !== filtersKey) {
          prevFiltersKeyRef.current = filtersKey
          fetchUsers()
        }
      }, 1000)

      // cleanup: 타이머 정리
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }
  }, [filters.loginId, filters.nickname])

  // select 필드(role, isActive, isFirstLogin) 변경 시 즉시 자동 조회
  useEffect(() => {
    // 초기 마운트가 아니고, select 필드가 변경된 경우에만 실행
    if (!isInitialMountRef.current) {
      const filtersKey = JSON.stringify(filters)
      // 이전 조회 조건과 다를 때만 호출 (중복 조회 방지)
      if (prevFiltersKeyRef.current !== filtersKey) {
        prevFiltersKeyRef.current = filtersKey
        fetchUsers()
      }
    }
  }, [filters.role, filters.isActive, filters.isFirstLogin])

  const handleStartAdd = () => {
    setEditingId('new')
    setEditingData({
      loginId: '',
      password: '',
      nickname: '',
      role: 'user',
      isActive: true, // 기본값 활성
    })
  }

  const handleStartEdit = (user: UserInfo) => {
    setEditingId(user.userId)
    setEditingData({
      userId: user.userId,
      nickname: user.nickname,
      role: user.role,
      isActive: user.isActive,
    })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingData(null)
  }

  const handleSave = async () => {
    if (!editingData) return

    try {
      if (editingId === 'new') {
        const createData = editingData as CreateUserRequest
        if (!createData.loginId.trim() || !createData.nickname.trim()) {
          Swal.fire({
            title: '알림',
            text: '로그인 ID와 닉네임을 입력해주세요.',
            confirmButtonText: '확인',
            confirmButtonColor: '#66bb6a',
          })
          return
        }
        await createUser(createData)
        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '사용자가 생성되었습니다.',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      } else if (editingId !== null) {
        await updateUser(editingId, editingData as UpdateUserRequest)
        Swal.fire({
          icon: 'success',
          title: '성공',
          text: '사용자가 수정되었습니다.',
          confirmButtonText: '확인',
          confirmButtonColor: '#66bb6a',
        })
      }
      setEditingId(null)
      setEditingData(null)
      fetchUsers()
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

  const handleDelete = async (userId: number) => {
    // 삭제할 사용자 정보 찾기
    const userToDelete = users.find((u) => u.userId === userId)
    const loginId = userToDelete?.loginId || '사용자'

    const result = await Swal.fire({
      icon: 'warning',
      title: '삭제 확인',
      html: `<div style="text-align: center;">
        <p>선택한 ${loginId} 삭제하시겠습니까?</p>
        <p style="color: #dc2626; font-weight: bold; margin-top: 10px;">⚠️ 이 작업은 복원이 불가능합니다.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: '삭제',
      cancelButtonText: '취소',
      confirmButtonColor: '#66bb6a',
      cancelButtonColor: '#6b7280',
    })

    if (!result.isConfirmed) return

    try {
      await deleteUser(userId)
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '삭제되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchUsers()
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

  const handleResetPassword = async (userId: number) => {
    // 비밀번호 초기화할 사용자 정보 찾기
    const userToReset = users.find((u) => u.userId === userId)
    const loginId = userToReset?.loginId || '사용자'

    const result = await Swal.fire({
      icon: 'warning',
      title: '비밀번호 초기화 확인',
      html: `<div style="text-align: center;">
        <p>${loginId}의 비밀번호를 초기화하시겠습니까?</p>
        <p style="color: #dc2626; font-weight: bold; margin-top: 10px;">초기화된 비밀번호는 "${loginId}!@" 입니다.</p>
      </div>`,
      showCancelButton: true,
      confirmButtonText: '초기화',
      cancelButtonText: '취소',
      confirmButtonColor: '#66bb6a',
      cancelButtonColor: '#6b7280',
    })

    if (!result.isConfirmed) return

    try {
      const newPassword = `${loginId}!@`
      await resetUserPassword(userId, newPassword)
      Swal.fire({
        icon: 'success',
        title: '성공',
        text: '비밀번호가 초기화되었습니다.',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
      fetchUsers()
    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: '오류',
        text: error.message || '비밀번호 초기화 실패',
        confirmButtonText: '확인',
        confirmButtonColor: '#66bb6a',
      })
    }
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
        <h2 className="text-3xl font-bold text-gray-900">사용자 관리</h2>
      </div>

      {/* 조회 필터 영역 */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-700">조회 조건</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="loginId-filter" className="block text-sm font-medium text-gray-700 mb-1">
                로그인 ID
              </label>
              <input
                id="loginId-filter"
                type="text"
                value={filters.loginId}
                onChange={(e) => setFilters({ ...filters, loginId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                placeholder="로그인 ID"
              />
            </div>
            <div>
              <label htmlFor="nickname-filter" className="block text-sm font-medium text-gray-700 mb-1">
                닉네임
              </label>
              <input
                id="nickname-filter"
                type="text"
                value={filters.nickname}
                onChange={(e) => setFilters({ ...filters, nickname: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
                placeholder="닉네임"
              />
            </div>
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                권한
              </label>
              <select
                id="role-filter"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
              >
                <option value="">전체</option>
                <option value="master">마스터 관리자</option>
                <option value="admin">관리자</option>
                <option value="user">일반 사용자</option>
              </select>
            </div>
            <div>
              <label htmlFor="isActive-filter" className="block text-sm font-medium text-gray-700 mb-1">
                상태
              </label>
              <select
                id="isActive-filter"
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
              >
                <option value="">전체</option>
                <option value="true">활성</option>
                <option value="false">비활성</option>
              </select>
            </div>
            <div>
              <label htmlFor="isFirstLogin-filter" className="block text-sm font-medium text-gray-700 mb-1">
                최초 로그인
              </label>
              <select
                id="isFirstLogin-filter"
                value={filters.isFirstLogin}
                onChange={(e) => setFilters({ ...filters, isFirstLogin: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-[#66bb6a]"
              >
                <option value="">전체</option>
                <option value="true">최초 로그인</option>
                <option value="false">일반</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => fetchUsers()}
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

      {/* 버튼 영역 */}
      <div className="flex justify-end">
        <button
          onClick={handleStartAdd}
          disabled={editingId !== null}
          className="px-4 py-2 text-white rounded-md focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#66bb6a' }}
          onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4caf50')}
          onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#66bb6a')}
        >
          등록
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">사용자 ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">로그인 ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">닉네임</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">권한</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">상태</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">등록일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">수정일시</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase" style={{ width: '220px' }}>관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : (
                <>
                  {editingId === 'new' && editingData && (
                    <tr className="bg-blue-50">
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={(editingData as CreateUserRequest).loginId || ''}
                          onChange={(e) =>
                            setEditingData({ ...editingData, loginId: e.target.value } as CreateUserRequest)
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="로그인 ID"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editingData.nickname || ''}
                          onChange={(e) => setEditingData({ ...editingData, nickname: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                          placeholder="닉네임"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={editingData.role || 'staff'}
                          onChange={(e) => setEditingData({ ...editingData, role: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                        >
                          <option value="user">일반 사용자</option>
                          <option value="admin">관리자</option>
                          <option value="master">마스터 관리자</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setEditingData({ ...editingData, isActive: true } as CreateUserRequest)
                            }
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              (editingData as CreateUserRequest).isActive
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            활성
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingData({ ...editingData, isActive: false } as CreateUserRequest)
                            }
                            className={`px-3 py-1 text-xs rounded-md transition-colors ${
                              !(editingData as CreateUserRequest).isActive
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            비활성
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3">-</td>
                      <td className="px-4 py-3" style={{ width: '220px' }}>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            className="px-3 py-1.5 text-sm text-white rounded-md whitespace-nowrap"
                            style={{ backgroundColor: '#66bb6a' }}
                          >
                            저장
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 whitespace-nowrap"
                          >
                            취소
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  {users.length === 0 && editingId !== 'new' ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        데이터가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const isEditing = editingId === user.userId
                      const displayData = isEditing && editingData ? editingData : user

                      return (
                        <tr key={user.userId} className={isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.userId}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{user.loginId}</td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={displayData.nickname || ''}
                                onChange={(e) =>
                                  setEditingData({ ...editingData, nickname: e.target.value } as UpdateUserRequest)
                                }
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              />
                            ) : (
                              <span className="text-sm text-gray-900">{user.nickname}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={displayData.role || 'user'}
                                onChange={(e) => setEditingData({ ...editingData, role: e.target.value } as UpdateUserRequest)}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm min-w-0"
                              >
                                <option value="user">일반 사용자</option>
                                <option value="admin">관리자</option>
                                <option value="master">마스터 관리자</option>
                              </select>
                            ) : (
                              <span className="text-sm text-gray-900">{getRoleLabel(user.role)}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingData({ ...editingData, isActive: true } as UpdateUserRequest)
                                  }
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    (displayData as UpdateUserRequest).isActive
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  활성
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingData({ ...editingData, isActive: false } as UpdateUserRequest)
                                  }
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    !(displayData as UpdateUserRequest).isActive
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  비활성
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  disabled
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    user.isActive
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  활성
                                </button>
                                <button
                                  type="button"
                                  disabled
                                  className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                    !user.isActive
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  비활성
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(user.updatedAt).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-4 py-3" style={{ width: '220px' }}>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={handleSave}
                                  className="px-3 py-1.5 text-sm text-white rounded-md whitespace-nowrap"
                                  style={{ backgroundColor: '#66bb6a' }}
                                >
                                  저장
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 whitespace-nowrap"
                                >
                                  취소
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-2 flex-wrap">
                                <button
                                  onClick={() => handleStartEdit(user)}
                                  disabled={editingId !== null}
                                  className="px-3 py-1.5 text-sm text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                  style={{ backgroundColor: '#66bb6a' }}
                                >
                                  수정
                                </button>
                                <button
                                  onClick={() => handleResetPassword(user.userId)}
                                  disabled={editingId !== null}
                                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  비밀번호초기화
                                </button>
                                <button
                                  onClick={() => handleDelete(user.userId)}
                                  disabled={editingId !== null}
                                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  삭제
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default User
