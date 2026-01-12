import { Link, useLocation } from 'react-router-dom'
import { ReactNode, useState, useEffect } from 'react'

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
      label: '거래 관리',
      icon: '💰',
      children: [
        { path: '/transactions', label: '매출/매입 목록', icon: '📋' },
      ],
    },
    {
      label: '보고서',
      icon: '📈',
      children: [
        { path: '/reports', label: '보고서 목록', icon: '📊' },
        { path: '/reports/monthly', label: '월별 보고서', icon: '📅' },
        { path: '/reports/annual', label: '연간 보고서', icon: '📆' },
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

            {/* Right: Login or Profile */}
            <div className="flex items-center">
              {/* 비로그인 상태 */}
              <button className="text-sm font-medium text-gray-700 hover:text-gray-900">
                로그인
              </button>

              {/* 로그인 상태일 경우 (대체)
              <img
                src="/profile.jpg"
                alt="프로필"
                className="w-8 h-8 rounded-full cursor-pointer"
              />
              */}
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
