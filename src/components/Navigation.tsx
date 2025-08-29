import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ currentView, onViewChange }: NavigationProps) => {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const publicViews = [
    {
      id: "dashboard",
      name: "🏠 Family Dashboard",
      icon: "🏠",
      description: "View scores and achievements",
    },
    {
      id: "agenda",
      name: "🎯 Event Calendar",
      icon: "🎯",
      description: "Browse all family activities",
    },
    {
      id: "admin-houses",
      name: "🏘️ Team Houses",
      icon: "🏘️",
      description: "View family house teams",
    },
  ];

  const adminViews = [
    {
      id: "admin-players",
      name: "👨‍👩‍👧‍👦 Family Members",
      icon: "👨‍👩‍👧‍👦",
      description: "Manage family roster",
    },
    {
      id: "admin-events",
      name: "🎪 Event Studio",
      icon: "🎪",
      description: "Create amazing activities",
    },
  ];

  const views = isAuthenticated ? [...publicViews, ...adminViews] : publicViews;

  return (
    <nav
      style={{
        background:
          "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))",
        backdropFilter: "blur(15px)",
        borderBottom: "2px solid var(--border-accent)",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        overflow: "hidden",
      }}
    >
      {/* Magic sparkles background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 25% 50%, rgba(139, 95, 255, 0.05) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 50%)",
          animation: "twinkle 5s infinite",
          pointerEvents: "none",
        }}
      />
      <div className="container-fluid mobile-spacing-md">
        <div
          className="d-flex justify-content-between align-items-center"
          style={{
            minHeight: "70px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Desktop Navigation */}
          <div className="d-flex flex-grow-1">
            <ul
              className="nav d-none d-md-flex"
              style={{
                flexWrap: "wrap",
                gap: "var(--space-2)",
                alignItems: "center",
              }}
            >
              {views.map((view) => (
                <li key={view.id} className="nav-item">
                  <button
                    onClick={() => onViewChange(view.id)}
                    className="family-element"
                    title={view.description}
                    style={{
                      background:
                        currentView === view.id
                          ? "linear-gradient(135deg, var(--primary-color), var(--accent-purple))"
                          : "var(--bg-surface)",
                      border:
                        currentView === view.id
                          ? "2px solid rgba(139, 95, 255, 0.3)"
                          : "2px solid var(--border-color)",
                      color:
                        currentView === view.id
                          ? "white"
                          : "var(--text-primary)",
                      borderRadius: "var(--radius-xl)",
                      fontWeight: currentView === view.id ? "600" : "500",
                      fontFamily: "Fredoka, sans-serif",
                      padding: "var(--space-3) var(--space-5)",
                      transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      fontSize: "clamp(0.85rem, 2vw, 0.95rem)",
                      whiteSpace: "nowrap",
                      minHeight: "48px",
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      cursor: "pointer",
                      position: "relative",
                      overflow: "hidden",
                      boxShadow:
                        currentView === view.id
                          ? "0 4px 20px rgba(139, 95, 255, 0.4)"
                          : "0 2px 8px rgba(0, 0, 0, 0.1)",
                      transform:
                        currentView === view.id
                          ? "translateY(-2px) scale(1.02)"
                          : "translateY(0) scale(1)",
                    }}
                    onMouseEnter={(e) => {
                      if (currentView !== view.id) {
                        e.currentTarget.style.background =
                          "linear-gradient(135deg, var(--primary-50), var(--secondary-50))";
                        e.currentTarget.style.borderColor =
                          "var(--primary-color)";
                        e.currentTarget.style.transform =
                          "translateY(-2px) scale(1.02)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 15px rgba(139, 95, 255, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentView !== view.id) {
                        e.currentTarget.style.background = "var(--bg-surface)";
                        e.currentTarget.style.borderColor =
                          "var(--border-color)";
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow =
                          "0 2px 8px rgba(0, 0, 0, 0.1)";
                      }
                    }}
                  >
                    <span style={{ fontSize: "1.1rem" }}>{view.icon}</span>
                    <span>{view.name.replace(/^\S+\s/, "")}</span>
                    {currentView === view.id && (
                      <div
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          fontSize: "0.8rem",
                          animation: "twinkle 2s infinite",
                        }}
                      >
                        ✨
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>

            {/* Mobile Menu Button */}
            <div className="d-md-none d-flex align-items-center w-100">
              <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center mobile-gap-sm">
                  <span style={{ fontSize: "1.5rem" }}>
                    {views.find((v) => v.id === currentView)?.icon || "🎆"}
                  </span>
                  <div>
                    <div
                      style={{
                        fontSize: "clamp(1rem, 4vw, 1.2rem)",
                        fontWeight: "600",
                        fontFamily: "Fredoka, sans-serif",
                        color: "var(--text-primary)",
                      }}
                    >
                      {views
                        .find((v) => v.id === currentView)
                        ?.name?.replace(/^\S+\s/, "") || "Menu"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        fontFamily: "Fredoka, sans-serif",
                      }}
                    >
                      {views.find((v) => v.id === currentView)?.description ||
                        "Navigation"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="btn family-element"
                  style={{
                    background: isMobileMenuOpen
                      ? "linear-gradient(135deg, var(--danger-color), #DC2626)"
                      : "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
                    border: `2px solid ${
                      isMobileMenuOpen
                        ? "rgba(248, 113, 113, 0.3)"
                        : "rgba(139, 95, 255, 0.3)"
                    }`,
                    borderRadius: "var(--radius-full)",
                    color: "white",
                    padding: "var(--space-3)",
                    minHeight: "48px",
                    minWidth: "48px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isMobileMenuOpen
                      ? "0 4px 15px rgba(248, 113, 113, 0.3)"
                      : "0 4px 15px rgba(139, 95, 255, 0.3)",
                    transition: "all 0.3s ease",
                  }}
                  type="button"
                >
                  <span
                    style={{
                      fontSize: "1.2rem",
                      transition: "transform 0.3s ease",
                      transform: isMobileMenuOpen
                        ? "rotate(180deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    {isMobileMenuOpen ? "✕" : "☰"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Admin Badge - Desktop Only */}
          {isAuthenticated && (
            <div className="d-none d-md-flex align-items-center ms-3">
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--success-color), var(--secondary-600))",
                  color: "white",
                  padding: "var(--space-3) var(--space-4)",
                  borderRadius: "var(--radius-full)",
                  fontWeight: "600",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "Fredoka, sans-serif",
                  boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  border: "2px solid rgba(16, 185, 129, 0.3)",
                  animation: "glow-pulse 3s infinite",
                }}
              >
                <span style={{ fontSize: "1rem" }}>🔐</span>
                <span>Admin Mode</span>
              </div>
            </div>
          )}
        </div>

        {/* Magical Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div
            className="d-md-none"
            style={{
              background:
                "linear-gradient(135deg, var(--bg-elevated), var(--bg-surface))",
              borderRadius: "var(--radius-2xl)",
              margin: "var(--space-3) 0 var(--space-4) 0",
              padding: "var(--space-5)",
              backdropFilter: "blur(15px)",
              boxShadow: "0 8px 40px rgba(0, 0, 0, 0.3)",
              border: "2px solid var(--border-accent)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Magic sparkles */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 30% 30%, rgba(139, 95, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)",
                animation: "twinkle 4s infinite",
                pointerEvents: "none",
              }}
            />
            <div
              className="d-flex flex-column"
              style={{
                gap: "var(--space-3)",
                position: "relative",
                zIndex: 1,
              }}
            >
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => {
                    onViewChange(view.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className="family-element"
                  style={{
                    background:
                      currentView === view.id
                        ? "linear-gradient(135deg, var(--primary-color), var(--accent-purple))"
                        : "var(--bg-surface)",
                    border:
                      currentView === view.id
                        ? "2px solid rgba(139, 95, 255, 0.3)"
                        : "2px solid var(--border-color)",
                    color:
                      currentView === view.id ? "white" : "var(--text-primary)",
                    borderRadius: "var(--radius-xl)",
                    fontWeight: currentView === view.id ? "600" : "500",
                    fontFamily: "Fredoka, sans-serif",
                    padding: "var(--space-4) var(--space-5)",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    textAlign: "left",
                    width: "100%",
                    fontSize: "clamp(1rem, 4vw, 1.1rem)",
                    minHeight: "64px",
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--space-3)",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow:
                      currentView === view.id
                        ? "0 4px 20px rgba(139, 95, 255, 0.4)"
                        : "0 2px 8px rgba(0, 0, 0, 0.1)",
                    cursor: "pointer",
                  }}
                >
                  <span style={{ fontSize: "1.8rem", flexShrink: 0 }}>
                    {view.icon}
                  </span>
                  <div className="flex-grow-1">
                    <div style={{ fontWeight: "600" }}>
                      {view.name.replace(/^\S+\s/, "")}
                    </div>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color:
                          currentView === view.id
                            ? "rgba(255, 255, 255, 0.9)"
                            : "var(--text-muted)",
                        marginTop: "2px",
                      }}
                    >
                      {view.description}
                    </div>
                  </div>
                  {currentView === view.id && (
                    <div
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        fontSize: "1rem",
                        animation: "twinkle 2s infinite",
                      }}
                    >
                      ✨
                    </div>
                  )}
                </button>
              ))}

              {/* Admin Badge in Mobile Menu */}
              {isAuthenticated && (
                <div className="mt-3 text-center">
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, var(--success-color), var(--secondary-600))",
                      color: "white",
                      padding: "var(--space-4) var(--space-5)",
                      borderRadius: "var(--radius-full)",
                      fontWeight: "600",
                      fontSize: "var(--font-size-sm)",
                      fontFamily: "Fredoka, sans-serif",
                      boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "var(--space-2)",
                      border: "2px solid rgba(16, 185, 129, 0.3)",
                      animation: "glow-pulse 3s infinite",
                    }}
                  >
                    <span style={{ fontSize: "1.2rem" }}>🔐</span>
                    <span>Admin Powers Activated!</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
