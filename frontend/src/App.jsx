import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth, AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./context/ToastContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import CsvReportsPage from "./pages/CsvReportsPage.jsx";
import FinancialAiInsightsPage from "./pages/FinancialAiInsightsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import LedgerImport from "./pages/LedgerImport.jsx";
import LedgerReconciliationPage from "./pages/LedgerReconciliationPage.jsx";
import ManualTransactions from "./pages/ManualTransactions.jsx";
import OneDriveIntegration from "./pages/OneDriveIntegration.jsx";
import OpenFinancePage from "./pages/OpenFinancePage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import StatementReadingPage from "./pages/StatementReadingPage.jsx";
import FinancialSearchPage from "./pages/FinancialSearchPage.jsx";
import FinancialProfilePage from "./pages/FinancialProfilePage.jsx";
import SmartStatementReadingPage from "./pages/SmartStatementReadingPage.jsx";
import TransactionDetailsPage from "./pages/TransactionDetailsPage.jsx";
import TransactionsPage from "./pages/TransactionsPage.jsx";
import {
  AlertsPage,
  CardsPage,
  GoalsPage,
  InvestmentsPage,
  SettingsPage
} from "./pages/BetaModulePages.jsx";

function Splash() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      flexDirection: "column",
      gap: "1rem",
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        background: "linear-gradient(135deg, var(--purple), var(--cyan))",
        animation: "pulse 1.4s ease-in-out infinite",
      }} />
      <span style={{ color: "var(--muted)", fontFamily: "var(--mono)", fontSize: ".72rem" }}>
        Verificando sessão…
      </span>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  if (bootstrapping) return <Splash />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, bootstrapping } = useAuth();
  if (bootstrapping) return <Splash />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  const { bootstrapping, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Private */}
      <Route path="/dashboard"            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/open-finance/connect" element={<ProtectedRoute><OpenFinancePage /></ProtectedRoute>} />
      <Route path="/ledger/imports"       element={<ProtectedRoute><LedgerImport /></ProtectedRoute>} />
      <Route path="/ledger/reconciliation" element={<ProtectedRoute><LedgerReconciliationPage /></ProtectedRoute>} />
      <Route path="/onedrive"             element={<ProtectedRoute><OneDriveIntegration /></ProtectedRoute>} />
      <Route path="/manual-transactions"  element={<ProtectedRoute><ManualTransactions /></ProtectedRoute>} />
      <Route path="/transactions/:transactionId" element={<ProtectedRoute><TransactionDetailsPage /></ProtectedRoute>} />
      <Route path="/transactions"         element={<ProtectedRoute><TransactionsPage /></ProtectedRoute>} />
      <Route path="/statement-reading"    element={<ProtectedRoute><StatementReadingPage /></ProtectedRoute>} />
      <Route path="/intelligent-reading"  element={<ProtectedRoute><SmartStatementReadingPage /></ProtectedRoute>} />
      <Route path="/search"               element={<ProtectedRoute><FinancialSearchPage /></ProtectedRoute>} />
      <Route path="/financial-profile"    element={<ProtectedRoute><FinancialProfilePage /></ProtectedRoute>} />
      <Route path="/reports"              element={<ProtectedRoute><CsvReportsPage /></ProtectedRoute>} />
      <Route path="/goals"                element={<ProtectedRoute><GoalsPage /></ProtectedRoute>} />
      <Route path="/cards"                element={<ProtectedRoute><CardsPage /></ProtectedRoute>} />
      <Route path="/alerts"               element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
      <Route path="/financial-ai"         element={<ProtectedRoute><FinancialAiInsightsPage /></ProtectedRoute>} />
      <Route path="/investments"          element={<ProtectedRoute><InvestmentsPage /></ProtectedRoute>} />
      <Route path="/settings"             element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

      {/* Root: redirect based on auth */}
      <Route
        path="/"
        element={
          bootstrapping ? <Splash /> :
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
          <Navigate to="/login" replace />
        }
      />

      {/* Catch-all */}
      <Route
        path="*"
        element={
          bootstrapping ? <Splash /> :
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
          <Navigate to="/login" replace />
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}
