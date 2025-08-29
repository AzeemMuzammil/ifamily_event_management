import React, { useState } from 'react';

interface ExpandableRowProps {
  children: React.ReactNode;
  previewContent: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  accentColor?: string;
  className?: string;
  showExpandButton?: boolean;
}

const ExpandableRow: React.FC<ExpandableRowProps> = ({
  children,
  previewContent,
  isExpanded: controlledExpanded,
  onToggle,
  accentColor = "var(--primary-color)",
  className = "",
  showExpandButton = true
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  
  const handleToggle = () => {
    const newExpanded = !isExpanded;
    if (onToggle) {
      onToggle(newExpanded);
    } else {
      setInternalExpanded(newExpanded);
    }
  };

  const rowStyle: React.CSSProperties = {
    background: 'var(--bg-surface)',
    border: `2px solid ${isExpanded ? accentColor : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-xl)',
    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    overflow: 'hidden',
    boxShadow: isExpanded 
      ? `0 8px 25px ${accentColor}44, inset 0 1px 0 rgba(255, 255, 255, 0.1)` 
      : '0 4px 15px rgba(0, 0, 0, 0.1)',
    transform: isExpanded ? 'translateY(-2px) scale(1.01)' : 'translateY(0) scale(1)',
    cursor: showExpandButton ? 'pointer' : 'default'
  };

  const previewStyle: React.CSSProperties = {
    padding: 'var(--space-4)',
    cursor: showExpandButton ? 'pointer' : 'default',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--space-3)',
    background: isExpanded ? `${accentColor}15` : 'transparent',
    transition: 'all 0.3s ease',
    position: 'relative'
  };

  const expandedStyle: React.CSSProperties = {
    maxHeight: isExpanded ? '500px' : '0',
    overflow: 'hidden',
    transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    background: 'var(--bg-elevated)'
  };

  const expandButtonStyle: React.CSSProperties = {
    background: isExpanded ? accentColor : 'var(--bg-elevated)',
    color: isExpanded ? 'white' : 'var(--text-secondary)',
    border: `2px solid ${isExpanded ? 'transparent' : 'var(--border-color)'}`,
    borderRadius: 'var(--radius-full)',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontSize: '1rem',
    flexShrink: 0,
    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
    boxShadow: isExpanded ? `0 4px 15px ${accentColor}44` : '0 2px 8px rgba(0, 0, 0, 0.1)'
  };

  return (
    <div 
      className={`expandable-row family-element ${className}`} 
      style={rowStyle}
      onMouseEnter={(e) => {
        if (!isExpanded && showExpandButton) {
          e.currentTarget.style.borderColor = accentColor;
          e.currentTarget.style.boxShadow = `0 8px 25px ${accentColor}44`;
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isExpanded && showExpandButton) {
          e.currentTarget.style.borderColor = 'var(--border-color)';
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }
      }}
    >
      <div 
        style={previewStyle}
        onClick={showExpandButton ? handleToggle : undefined}
        onMouseEnter={(e) => {
          if (!isExpanded && showExpandButton) {
            e.currentTarget.style.background = `${accentColor}15`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isExpanded && showExpandButton) {
            e.currentTarget.style.background = isExpanded ? `${accentColor}15` : 'transparent';
          }
        }}
      >
        <div className="flex-grow-1 min-width-0">
          {previewContent}
        </div>
        
        {showExpandButton && (
          <button
            style={expandButtonStyle}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
            onMouseEnter={(e) => {
              if (!isExpanded) {
                e.currentTarget.style.background = `${accentColor}22`;
                e.currentTarget.style.borderColor = accentColor;
                e.currentTarget.style.color = accentColor;
              }
            }}
            onMouseLeave={(e) => {
              if (!isExpanded) {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }
            }}
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
          >
            ⌄
          </button>
        )}
      </div>

      <div style={expandedStyle}>
        <div style={{ 
          padding: isExpanded ? 'var(--space-4) var(--space-5) var(--space-5)' : '0',
          transition: 'padding 0.3s ease'
        }}>
          {children}
        </div>
      </div>

      {/* Glow effect when expanded */}
      {isExpanded && (
        <div style={{
          position: 'absolute',
          inset: '-2px',
          background: `linear-gradient(45deg, ${accentColor}22, transparent, ${accentColor}11)`,
          borderRadius: 'var(--radius-xl)',
          zIndex: -1,
          animation: 'glow-pulse 3s infinite'
        }} />
      )}
    </div>
  );
};

export default ExpandableRow;