import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar.jsx";

const SIDEBAR_COLLAPSED_KEY = "finsync:sidebar-collapsed";

export default function AppLayout({ children, breadcrumb = "FinSync" }) {
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });

  /* Close sidebar on navigation (mobile) */
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  /* Scroll progress bar */
  useEffect(() => {
    const el = document.getElementById("__top-progress");
    if (!el) return;
    const onScroll = () => {
      const d   = document.documentElement;
      const pct = (d.scrollTop / (d.scrollHeight - d.clientHeight)) * 100;
      const fill = el.querySelector(".top-progress-fill");
      if (fill) fill.style.width = Math.min(pct, 100) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Scroll progress */}
      <div
        id="__top-progress"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "transparent",
          zIndex: 9999,
        }}
      >
        <div
          className="top-progress-fill"
          style={{
            height: "100%",
            background: "linear-gradient(90deg, #7c3aed, #06b6d4)",
            width: "0%",
            transition: "width .1s",
          }}
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={isSidebarCollapsed}
        open={sidebarOpen}
        onCollapseToggle={() => setIsSidebarCollapsed((value) => !value)}
      />

      {/* Main area */}
      <div className={`main-area ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {/* Top bar */}
        <header className="topbar">
<div className="topbar-left">
            <div className="topbar-crumb">
              <span>FinSync</span>
              <span className="topbar-sep">/</span>
              <span className="topbar-current">{breadcrumb}</span>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-pill">
              <span className="topbar-dot" />
              Sistema operacional
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="page-content">{children}</main>
      </div>
    </>
  );
}
