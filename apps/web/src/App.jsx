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
// Renter pages
import RenterDashboard from './pages/renter/RenterDashboard.jsx'
import RenterPaymentHistory from './pages/renter/RenterPaymentHistory.jsx'
import RenterReceipt from './pages/renter/RenterReceipt.jsx'
import RenterProfile from './pages/renter/RenterProfile.jsx'
import AcceptInvitePage from './pages/AcceptInvitePage.jsx'

export default function App() {
  const { isLoading } = useAuth()

  if (isLoading) return <LoadingScreen />

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* ── LANDLORD routes ─────────────────────────────── */}
      <Route
        path="/dashboard"
        element={<ProtectedRoute allowedRole="LANDLORD"><DashboardPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/properties"
        element={<ProtectedRoute allowedRole="LANDLORD"><PropertiesPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/properties/:propertyId"
        element={<ProtectedRoute allowedRole="LANDLORD"><PropertyDetailPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/tenants"
        element={<ProtectedRoute allowedRole="LANDLORD"><TenantsPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/bills"
        element={<ProtectedRoute allowedRole="LANDLORD"><BillsPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/payments"
        element={<ProtectedRoute allowedRole="LANDLORD"><PaymentsPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/payments/:paymentId"
        element={<ProtectedRoute allowedRole="LANDLORD"><PaymentsPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/receipts"
        element={<ProtectedRoute allowedRole="LANDLORD"><ReceiptsPage /></ProtectedRoute>}
      />
      <Route
        path="/dashboard/receipts/:receiptId"
        element={<ProtectedRoute allowedRole="LANDLORD"><ReceiptsPage /></ProtectedRoute>}
      />

      {/* ── RENTER routes ────────────────────────────────── */}
      <Route
        path="/renter"
        element={<ProtectedRoute allowedRole="RENTER"><RenterDashboard /></ProtectedRoute>}
      />
      <Route
        path="/renter/payments"
        element={<ProtectedRoute allowedRole="RENTER"><RenterPaymentHistory /></ProtectedRoute>}
      />
      <Route
        path="/renter/receipts/:paymentId"
        element={<ProtectedRoute allowedRole="RENTER"><RenterReceipt /></ProtectedRoute>}
      />
      <Route
        path="/renter/profile"
        element={<ProtectedRoute allowedRole="RENTER"><RenterProfile /></ProtectedRoute>}
      />

      {/* ── Invitation acceptance (public) ───────────────── */}
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
