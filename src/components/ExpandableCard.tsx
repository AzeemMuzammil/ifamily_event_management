import { useState, ReactNode, FC, CSSProperties } from "react";

interface ExpandableCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  icon?: string;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  accentColor?: string;
  className?: string;
  previewContent?: ReactNode;
  compact?: boolean;
  animationDelay?: number;
}

const ExpandableCard: FC<ExpandableCardProps> = ({
  children,
  title,
  subtitle,
  icon = "📋",
  isExpanded: controlledExpanded,
  onToggle,
  accentColor = "var(--primary-color)",
  className = "",
  previewContent,
  compact = false,
  animationDelay = 0,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);

  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (onToggle) {
      onToggle(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const cardStyle: CSSProperties = {
    background: "var(--bg-elevated)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-xl)",
    boxShadow: isExpanded
      ? "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(139, 95, 255, 0.2)"
      : "0 4px 15px rgba(0, 0, 0, 0.2)",
    transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
    overflow: "hidden",
    position: "relative" as const,
    transform: isExpanded
      ? "translateY(-4px) scale(1.02)"
      : "translateY(0) scale(1)",
    zIndex: isExpanded ? 10 : 1,
    animationDelay: `${animationDelay}s`,
    ...(compact
      ? {
          margin: "0.5rem 0",
        }
      : {
          margin: "1rem 0",
        }),
  };

  const headerStyle: CSSProperties = {
    padding: compact ? "var(--space-4)" : "var(--space-6)",
    background: isExpanded
      ? `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`
      : "var(--bg-surface)",
    borderBottom: isExpanded ? "1px solid var(--border-light)" : "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    position: "relative" as const,
    userSelect: "none" as const,
  };

  const contentStyle: CSSProperties = {
    maxHeight: isExpanded ? "2000px" : "0",
    overflow: "hidden",
    transition: "all 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
    background: "var(--bg-elevated)",
  };

  const innerContentStyle: CSSProperties = {
    padding: isExpanded ? (compact ? "var(--space-4)" : "var(--space-6)") : "0",
    paddingTop: isExpanded
      ? compact
        ? "var(--space-3)"
        : "var(--space-4)"
      : "0",
    transition: "padding 0.3s ease",
  };

  const chevronStyle: CSSProperties = {
    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    fontSize: compact ? "1.2rem" : "1.5rem",
    color: isExpanded ? "white" : "var(--text-secondary)",
  };

  return (
    <div
      className={`expandable-card family-element fade-in-up ${className}`}
      style={cardStyle}
    >
      <div
        onClick={handleToggle}
        style={headerStyle}
        className="expandable-card-header"
        onMouseEnter={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = `linear-gradient(135deg, var(--bg-surface), ${accentColor}22)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded) {
            e.currentTarget.style.background = "var(--bg-surface)";
          }
        }}
      >
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center mobile-gap-md flex-grow-1 min-width-0">
            <span
              style={{
                fontSize: compact ? "1.5rem" : "2rem",
                flexShrink: 0,
                filter: isExpanded ? "brightness(1.2)" : "none",
                transition: "filter 0.3s ease",
              }}
            >
              {icon}
            </span>
            <div className="min-width-0 flex-grow-1">
              <h6
                className="mb-1 fw-bold"
                style={{
                  color: isExpanded ? "white" : "var(--text-primary)",
                  fontSize: compact
                    ? "var(--font-size-base)"
                    : "var(--font-size-lg)",
                  transition: "color 0.3s ease",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                }}
              >
                {title}
              </h6>
              {subtitle && (
                <p
                  className="mb-0 small"
                  style={{
                    color: isExpanded
                      ? "rgba(255, 255, 255, 0.9)"
                      : "var(--text-secondary)",
                    transition: "color 0.3s ease",
                    fontSize: compact
                      ? "var(--font-size-xs)"
                      : "var(--font-size-sm)",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <div className="d-flex align-items-center mobile-gap-sm flex-shrink-0">
            {previewContent && !isExpanded && (
              <div className="preview-content mobile-hide">
                {previewContent}
              </div>
            )}
            <div
              style={chevronStyle}
              className="expand-chevron"
              role="button"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              ⌄
            </div>
          </div>
        </div>

        {/* Animated border effect */}
        {isExpanded && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "2px",
              background: `linear-gradient(90deg, transparent, white, transparent)`,
              animation: "shimmer 2s ease-in-out infinite",
            }}
          />
        )}
      </div>

      <div style={contentStyle}>
        <div style={innerContentStyle}>{children}</div>
      </div>

      {/* Glow effect when expanded */}
      {isExpanded && (
        <div
          style={{
            position: "absolute",
            inset: "-1px",
            background: `linear-gradient(45deg, ${accentColor}33, transparent, ${accentColor}22)`,
            borderRadius: "var(--radius-xl)",
            zIndex: -1,
            opacity: 0.5,
            animation: "glow-pulse 3s ease-in-out infinite",
          }}
        />
      )}
    </div>
  );
};

export default ExpandableCard;
