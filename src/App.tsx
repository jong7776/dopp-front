import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Dashboard from './pages/dashboard/Dashboard'
import Expense from './pages/financial-management/Expense'
import Contract from './pages/financial-management/Contract'
import Login from './pages/auth/Login'
import { isAuthenticated } from './utils/auth'

function App() {
  return (
    <Router>
      <Routes>
        {/* 로그인 페이지 - 로그인된 상태면 대시보드로 리다이렉트 */}
        <Route
          path="/login"
          element={
            isAuthenticated() ? <Navigate to="/" replace /> : <Login />
          }
        />
        
        {/* 보호된 라우트 - 로그인 필요 */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/financial-management/expense" element={<Expense />} />
                  <Route path="/financial-management/contract" element={<Contract />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default App
