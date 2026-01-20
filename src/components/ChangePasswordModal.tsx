import { useState } from 'react'
import { changePassword } from '../utils/api'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: number
}

interface PasswordFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const ChangePasswordModal = ({ isOpen, onClose, onSuccess, userId }: ChangePasswordModalProps) => {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

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
    if (!formData.currentPassword.trim()) {
      setError('현재 비밀번호를 입력해주세요.')
      return
    }

    if (!formData.newPassword.trim()) {
      setError('수정할 비밀번호를 입력해주세요.')
      return
    }

    if (!formData.confirmPassword.trim()) {
      setError('비밀번호 확인을 입력해주세요.')
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('수정할 비밀번호와 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    if (formData.newPassword.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      await changePassword({
        userId,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      // 성공 시 폼 초기화 및 모달 닫기
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || '비밀번호 수정에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* 모달 컨테이너 */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">비밀번호 수정</h3>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 현재 비밀번호 */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                현재 비밀번호
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                value={formData.currentPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a] focus:border-[#66bb6a] sm:text-sm"
                placeholder="현재 비밀번호를 입력하세요"
                disabled={isLoading}
              />
            </div>

            {/* 수정할 비밀번호 */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                수정할 비밀번호
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={formData.newPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a] focus:border-[#66bb6a] sm:text-sm"
                placeholder="수정할 비밀번호를 입력하세요"
                disabled={isLoading}
              />
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호 확인
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#66bb6a] focus:border-[#66bb6a] sm:text-sm"
                placeholder="비밀번호를 다시 입력하세요"
                disabled={isLoading}
              />
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* 버튼 */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66bb6a] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66bb6a] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#66bb6a' }}
                onMouseEnter={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#4caf50')}
                onMouseLeave={(e) => !e.currentTarget.disabled && (e.currentTarget.style.backgroundColor = '#66bb6a')}
              >
                {isLoading ? '수정 중...' : '수정'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ChangePasswordModal
