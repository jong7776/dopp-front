import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { login, getUserInfo } from '../../utils/api'
import { LoginRequest, UserInfo } from '../../types/auth/auth'
import ChangePasswordModal from '../../components/ChangePasswordModal'

const Login = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [formData, setFormData] = useState<LoginRequest>({
    loginId: '',
    password: '',
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  // URL 파라미터에서 에러 메시지 가져오기
  useEffect(() => {
    const errorMessage = searchParams.get('error')
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage))
      // URL에서 에러 파라미터 제거
      navigate('/login', { replace: true })
    }
  }, [searchParams, navigate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // 에러 메시지 초기화
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    // 입력 검증
    if (!formData.loginId.trim()) {
      setError('아이디를 입력해주세요.')
      return
    }

    if (!formData.password.trim()) {
      setError('비밀번호를 입력해주세요.')
      return
    }

    setIsLoading(true)

    try {
      await login(formData)
      // 로그인 성공 시 사용자 정보 조회
      try {
        const fetchedUserInfo = await getUserInfo()
        setUserInfo(fetchedUserInfo)
        // isFirstLogin이 true이면 비밀번호 수정 팝업 표시
        if (fetchedUserInfo.isFirstLogin) {
          setShowPasswordModal(true)
        } else {
          // isFirstLogin이 false이면 대시보드로 이동
          navigate('/', { replace: true })
        }
      } catch (err: any) {
        // 사용자 정보 조회 실패 시에도 대시보드로 이동
        console.error('사용자 정보 조회 실패:', err)
        navigate('/', { replace: true })
      }
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChangeSuccess = () => {
    // 비밀번호 수정 성공 시 대시보드로 이동
    navigate('/', { replace: true })
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              다올피플 관리 시스템
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              로그인하여 계속 진행하세요
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="loginId" className="sr-only">
                  아이디
                </label>
                <input
                  id="loginId"
                  name="loginId"
                  type="text"
                  required
                  value={formData.loginId}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a] focus:border-[#66bb6a] focus:z-10 sm:text-sm"
                  placeholder="아이디"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a] focus:border-[#66bb6a] focus:z-10 sm:text-sm"
                  placeholder="비밀번호"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none active:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66bb6a] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#66bb6a' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4caf50')}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#66bb6a')}
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 비밀번호 수정 모달 */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
        userId={userInfo?.userId || 0}
      />
    </>
  )
}

export default Login
