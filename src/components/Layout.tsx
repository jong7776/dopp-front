import { Link, useLocation } from 'react-router-dom'
import { ReactNode, useState, useEffect } from 'react'
import { logout, refreshAccessToken } from '../utils/api'

interface LayoutProps {
  children: ReactNode
}

interface NavItem {
  path?: string
  label: string
  icon: string
  children?: NavItem[]
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const navItems: NavItem[] = [
    { path: '/', label: '대시보드', icon: '📊' },
    {
      label: '비용 관리',
      icon: '💰',
      children: [
        { path: '/expense', label: '경비 관리', icon: '📋' },
      ],
    },
  ]

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(label)) {
        newSet.delete(label)
      } else {
        newSet.add(label)
      }
      return newSet
    })
  }

  const isItemActive = (item: NavItem): boolean => {
    if (item.path && location.pathname === item.path) {
      return true
    }
    if (item.children) {
      return item.children.some((child) => child.path === location.pathname)
    }
    return false
  }

  const isChildActive = (item: NavItem): boolean => {
    if (!item.children) return false
    return item.children.some((child) => child.path === location.pathname)
  }

  // 현재 경로에 해당하는 하위 메뉴가 있으면 자동으로 펼치기
  useEffect(() => {
    navItems.forEach((item) => {
      if (item.children && isChildActive(item)) {
        setExpandedItems((prev) => new Set(prev).add(item.label))
      }
    })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Left: Logo + Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                다올피플 관리 시스템
              </h1>
            </div>

            {/* Right: Logout & Refresh Token Test */}
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const newToken = await refreshAccessToken()
                    if (newToken) {
                      alert('토큰 리프레시 성공!')
                      console.log('새 토큰:', newToken)
                    } else {
                      alert('토큰 리프레시 실패')
                    }
                  } catch (error: any) {
                    const errorMessage = error.response?.data?.frontMessage || 
                                       error.response?.data?.message || 
                                       '토큰 리프레시 실패'
                    alert(`토큰 리프레시 실패: ${errorMessage}`)
                    console.error('토큰 리프레시 에러:', error)
                  }
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Refresh Token 테스트
              </button>
              <button
                onClick={() => logout()}
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                로그아웃
              </button>
            </div>

          </div>
        </div>
      </header>


      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item, index) => {
                const hasChildren = item.children && item.children.length > 0
                const isExpanded = expandedItems.has(item.label)
                const isActive = isItemActive(item)
                const isChildActiveState = isChildActive(item)

                return (
                  <li key={item.path || item.label || index}>
                    {hasChildren ? (
                      <>
                        <button
                          onClick={() => toggleExpand(item.label)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                            isChildActiveState
                              ? 'bg-blue-50 text-blue-700 font-semibold'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          <span
                            className={`transform transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}
                          >
                            ▶
                          </span>
                        </button>
                        {isExpanded && (
                          <ul className="ml-4 mt-1 space-y-1">
                            {item.children?.map((child) => {
                              const isChildActive = location.pathname === child.path
                              return (
                                <li key={child.path}>
                                  <Link
                                    to={child.path || '#'}
                                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${
                                      isChildActive
                                        ? 'bg-blue-100 text-blue-700 font-semibold'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    <span className="text-lg">{child.icon}</span>
                                    <span>{child.label}</span>
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </>
                    ) : (
                      <Link
                        to={item.path || '#'}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout
