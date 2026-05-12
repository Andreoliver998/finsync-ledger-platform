import {
  BarChart3,
  Bell,
  Blend,
  BrainCircuit,
  CreditCard,
  Flag,
  FolderSync,
  LayoutDashboard,
  Link2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Search,
  Settings,
  TrendingUp
} from "lucide-react";
import financeiroLogo from "../assets/financeiro-logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const NAV = [
  {
    section: "Visão geral",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" }
    ]
  },
  {
    section: "Finanças",
    items: [
      { to: "/manual-transactions", icon: PlusCircle, label: "Lançamentos" },
      { to: "/ledger/imports", icon: FolderSync, label: "Conciliação CSV", badge: "Novo" },
      { to: "/ledger/reconciliation", icon: Blend, label: "Revisão Manual" },
      { to: "/onedrive", icon: Link2, label: "OneDrive", badge: "Prep" },
      { to: "/transactions", icon: CreditCard, label: "Transações" },
      { to: "/search", icon: Search, label: "Busca Inteligente", badge: "Novo" },
      { to: "/financial-profile", icon: Search, label: "Perfil Financeiro", badge: "Novo" },
      { to: "/intelligent-reading", icon: BrainCircuit, label: "Leitura Inteligente", badge: "Novo" },
      { to: "/statement-reading", icon: BrainCircuit, label: "Leitura do Extrato", badge: "Novo" },
      { to: "/reports", icon: BarChart3, label: "Relatórios", badge: "Beta" },
      { to: "/goals", icon: Flag, label: "Metas", badge: "Beta" },
      { to: "/cards", icon: CreditCard, label: "Cartões", badge: "Beta" },
      { to: "/alerts", icon: Bell, label: "Alertas", badge: "Beta" },
      { to: "/financial-ai", icon: BrainCircuit, label: "IA Financeira", badge: "Beta" },
      { to: "/investments", icon: TrendingUp, label: "Investimentos", badge: "Beta" }
    ]
  },
  {
    section: "Config",
    items: [
      { to: "/settings", icon: Settings, label: "Configurações", badge: "Beta" }
    ]
  }
];

function NavItem({ item, active, collapsed }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className={`nav-item ${active ? "active" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="nav-item-icon" size={15} />
      <span className="nav-item-label">{item.label}</span>
      {item.badge && <span className="nav-badge">{item.badge}</span>}
    </Link>
  );
}

export default function Sidebar({ collapsed, open, onCollapseToggle }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const toggleLabel = collapsed ? "Abrir menu lateral" : "Fechar menu lateral";
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside
      className={`sidebar ${open ? "open" : ""} ${collapsed ? "collapsed" : ""}`}
      data-collapsed={collapsed ? "true" : "false"}
    >
      <div className="sb-brand">
        <button
          className="sb-logo-toggle"
          type="button"
          onClick={onCollapseToggle}
          title={toggleLabel}
          aria-label={toggleLabel}
          aria-expanded={!collapsed}
        >
          <span className="sb-logo-icon-wrap" aria-hidden="true">
            <img className="sb-logo-mark" src={financeiroLogo} alt="" />
            <span className="sb-logo-toggle-icon">
              <ToggleIcon size={17} />
            </span>
          </span>
          <span className="sb-logo-text" aria-hidden={collapsed}>
            <span className="sb-logo-name">FinSync</span>
            <span className="sb-tagline">Ledger Platform</span>
          </span>
        </button>
      </div>

      <nav style={{ flex: 1 }}>
        {NAV.map((group) => (
          <div key={group.section}>
            <div className="sb-section">{group.section}</div>
            {group.items.map((item) => (
              <NavItem
                key={item.to}
                item={item}
                collapsed={collapsed}
                active={pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to))}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-footer">
        <div className="sb-user">
          <div className="sb-avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user?.name || "Usuário"}</div>
            <div className="sb-user-email">{user?.email || "Conta conectada"}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm sb-logout"
            type="button"
            onClick={handleLogout}
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>

        <div className="sb-api-status">
          <span className="dot dot-green" />
          <span>Sistema desenvolvido por André Oliveira</span>
        </div>
      </div>
    </aside>
  );
}
