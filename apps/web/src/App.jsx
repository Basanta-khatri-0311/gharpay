import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import PropertiesPage from './pages/PropertiesPage.jsx'
import PropertyDetailPage from './pages/PropertyDetailPage.jsx'
import TenantsPage from './pages/TenantsPage.jsx'
import BillsPage from './pages/BillsPage.jsx'
import PaymentsPage from './pages/PaymentsPage.jsx'
import ReceiptsPage from './pages/ReceiptsPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App() {
  const { isLoading } = useAuth()

  // Show full-screen loader until we know the auth state
  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — require authentication */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/properties"
        element={
          <ProtectedRoute>
            <PropertiesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/properties/:propertyId"
        element={
          <ProtectedRoute>
            <PropertyDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/tenants"
        element={
          <ProtectedRoute>
            <TenantsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/bills"
        element={
          <ProtectedRoute>
            <BillsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/payments"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/payments/:paymentId"
        element={
          <ProtectedRoute>
            <PaymentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/receipts"
        element={
          <ProtectedRoute>
            <ReceiptsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/receipts/:receiptId"
        element={
          <ProtectedRoute>
            <ReceiptsPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
