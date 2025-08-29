import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error boundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div
          className="container-fluid mobile-spacing-md"
          style={{ paddingTop: "var(--space-6)" }}
        >
          <div className="row justify-content-center">
            <div className="col-md-8 col-lg-6">
              <div
                className="text-center"
                style={{
                  background: "var(--bg-elevated)",
                  borderRadius: "var(--radius-2xl)",
                  border: "2px solid var(--border-accent)",
                  boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
                  padding: "var(--space-6)",
                  margin: "var(--space-4) 0",
                }}
              >
                <div
                  style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}
                >
                  😱
                </div>
                <h4
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "var(--space-3)",
                    fontFamily: "Fredoka, sans-serif",
                    fontWeight: "600",
                  }}
                >
                  Oops! Something went wrong
                </h4>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "var(--font-size-lg)",
                    marginBottom: "var(--space-4)",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  An unexpected error occurred. Don't worry, this has been
                  logged for investigation! ✨
                </p>

                {this.state.error && (
                  <details
                    style={{
                      marginBottom: "var(--space-4)",
                      textAlign: "left",
                    }}
                  >
                    <summary
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--font-size-sm)",
                        fontFamily: "Fredoka, sans-serif",
                        cursor: "pointer",
                        textAlign: "center",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      🔍 Technical Details
                    </summary>
                    <pre
                      style={{
                        background: "var(--bg-surface)",
                        border: "2px solid var(--border-color)",
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-4)",
                        fontSize: "var(--font-size-sm)",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {this.state.error.message}
                    </pre>
                  </details>
                )}

                <div className="d-flex justify-content-center mobile-gap-md flex-wrap">
                  <button
                    className="btn family-element"
                    onClick={() => window.location.reload()}
                    style={{
                      background:
                        "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
                      color: "white",
                      border: "2px solid rgba(139, 95, 255, 0.3)",
                      borderRadius: "var(--radius-xl)",
                      padding: "var(--space-3) var(--space-5)",
                      fontSize: "var(--font-size-base)",
                      fontWeight: "600",
                      fontFamily: "Fredoka, sans-serif",
                      boxShadow: "0 8px 25px rgba(139, 95, 255, 0.4)",
                      transition: "all 0.3s ease",
                      minHeight: "48px",
                    }}
                  >
                    🔄 Reload Page
                  </button>
                  <button
                    className="btn family-element"
                    onClick={() =>
                      this.setState({ hasError: false, error: undefined })
                    }
                    style={{
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      border: "2px solid var(--border-color)",
                      borderRadius: "var(--radius-xl)",
                      padding: "var(--space-3) var(--space-5)",
                      fontSize: "var(--font-size-base)",
                      fontWeight: "500",
                      fontFamily: "Fredoka, sans-serif",
                      transition: "all 0.3s ease",
                      minHeight: "48px",
                    }}
                  >
                    🔄 Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
