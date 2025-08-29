import { useState, useEffect, FC } from "react";
import { Category, Config, EventType } from "../../types";
import { categoryRepository, configRepository } from "../../database";

const ConfigurationManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<string | null>(null); // Track which config is being saved

  // Load data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Subscribe to categories and configs
    const unsubscribeCategories = categoryRepository.subscribeToAllCategories(
      (categoriesList: Category[]) => {
        setCategories(categoriesList);
      }
    );

    const unsubscribeConfigs = configRepository.subscribeToAllPlacementConfigs(
      (configsList: Config[]) => {
        setConfigs(configsList);
      }
    );

    setIsLoading(false);

    return () => {
      unsubscribeCategories();
      unsubscribeConfigs();
    };
  }, []);

  // Auto-create missing configs for categories that don't have them
  useEffect(() => {
    if (categories.length > 0 && configs.length >= 0) {
      // Check for missing configs and create them silently
      const checkAndCreateConfigs = async () => {
        for (const category of categories) {
          const individualConfig = configs.find(
            (c) =>
              c.categoryId === category.id &&
              c.eventType === "individual" &&
              c.type === "placement-points"
          );
          const groupConfig = configs.find(
            (c) =>
              c.categoryId === category.id &&
              c.eventType === "group" &&
              c.type === "placement-points"
          );

          const promises = [];

          if (!individualConfig) {
            promises.push(
              configRepository.setPlacementConfig(category.id, "individual", {
                1: 5,
                2: 3,
                3: 1,
              })
            );
          }

          if (!groupConfig) {
            promises.push(
              configRepository.setPlacementConfig(category.id, "group", {
                1: 5,
                2: 3,
                3: 1,
              })
            );
          }

          if (promises.length > 0) {
            try {
              await Promise.all(promises);
            } catch (error) {
              console.error(
                `Error creating default configs for category ${category.id}:`,
                error
              );
            }
          }
        }
      };

      checkAndCreateConfigs();
    }
  }, [categories, configs]);

  // Get placement config for a specific category and event type
  const getPlacementConfig = (
    categoryId: string,
    eventType: EventType
  ): { [placement: number]: number } => {
    const config = configs.find(
      (c) =>
        c.categoryId === categoryId &&
        c.eventType === eventType &&
        c.type === "placement-points"
    );

    // Return existing config or default
    return config?.placements || { 1: 5, 2: 3, 3: 1 };
  };

  // Update placement config
  const updatePlacementConfig = async (
    categoryId: string,
    eventType: EventType,
    placements: { [placement: number]: number }
  ) => {
    const configKey = `${categoryId}-${eventType}`;
    setIsSaving(configKey);

    try {
      await configRepository.setPlacementConfig(
        categoryId,
        eventType,
        placements
      );
    } catch (err) {
      console.error("Error saving placement config:", err);
      if (err instanceof Error) {
        alert(`Failed to save configuration: ${err.message}`);
      } else {
        alert("Failed to save configuration");
      }
    } finally {
      setIsSaving(null);
    }
  };

  // Add new placement to a config
  const addPlacement = (categoryId: string, eventType: EventType) => {
    const currentConfig = getPlacementConfig(categoryId, eventType);
    const maxPlacement = Math.max(...Object.keys(currentConfig).map(Number), 0);
    const newPlacement = maxPlacement + 1;

    const updatedConfig = {
      ...currentConfig,
      [newPlacement]: 1, // Default 1 point for new placements
    };

    updatePlacementConfig(categoryId, eventType, updatedConfig);
  };

  // Remove placement from a config
  const removePlacement = (
    categoryId: string,
    eventType: EventType,
    placement: number
  ) => {
    const currentConfig = getPlacementConfig(categoryId, eventType);
    const { [placement]: _, ...updatedConfig } = currentConfig;

    // Don't allow removing if only 1 placement left
    if (Object.keys(updatedConfig).length === 0) {
      alert("At least one placement must exist!");
      return;
    }

    updatePlacementConfig(categoryId, eventType, updatedConfig);
  };

  // Update points for a specific placement
  const updatePlacementPoints = (
    categoryId: string,
    eventType: EventType,
    placement: number,
    points: number
  ) => {
    const currentConfig = getPlacementConfig(categoryId, eventType);
    const updatedConfig = {
      ...currentConfig,
      [placement]: Math.max(0, points), // Ensure points are non-negative
    };

    updatePlacementConfig(categoryId, eventType, updatedConfig);
  };

  // Reset to default configuration
  const resetToDefault = (categoryId: string, eventType: EventType) => {
    if (
      confirm(
        "Reset this configuration to default values (1st: 5pts, 2nd: 3pts, 3rd: 1pt)?"
      )
    ) {
      updatePlacementConfig(categoryId, eventType, { 1: 5, 2: 3, 3: 1 });
    }
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{
          minHeight: "400px",
          background: "var(--bg-elevated)",
          borderRadius: "var(--radius-2xl)",
          border: "2px solid var(--border-accent)",
          margin: "var(--space-4)",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div className="text-center">
          <div
            style={{
              fontSize: "3rem",
              marginBottom: "var(--space-4)",
              animation: "twinkle 2s infinite",
            }}
          >
            ⚙️
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid var(--border-color)",
              borderTop: "4px solid var(--primary-color)",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "var(--space-4)",
              margin: "0 auto var(--space-4)",
            }}
          ></div>
          <p
            style={{
              fontFamily: "Fredoka, sans-serif",
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-lg)",
              fontWeight: "500",
            }}
          >
            Loading configurations... ✨
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center" style={{ padding: "var(--space-5)" }}>
        <div
          style={{
            background: "linear-gradient(135deg, var(--danger-color), #DC2626)",
            color: "white",
            borderRadius: "var(--radius-2xl)",
            padding: "var(--space-5)",
            maxWidth: "400px",
            margin: "0 auto",
            border: "2px solid rgba(248, 113, 113, 0.3)",
            boxShadow: "0 8px 25px rgba(248, 113, 113, 0.3)",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-3)" }}>
            ⚠️
          </div>
          <h4
            style={{
              fontFamily: "Fredoka, sans-serif",
              marginBottom: "var(--space-2)",
              fontWeight: "600",
            }}
          >
            Oops! Something went wrong
          </h4>
          <p
            style={{
              fontSize: "var(--font-size-base)",
              margin: "0",
              opacity: "0.9",
            }}
          >
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid mobile-spacing-md"
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        paddingTop: "var(--space-4)",
        paddingBottom: "var(--space-4)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-5">
        <h1
          className="mobile-title fw-bold mb-3"
          style={{
            fontFamily: "Fredoka, sans-serif",
            background:
              "linear-gradient(135deg, var(--accent-yellow), var(--primary-light), var(--accent-pink))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontSize: "clamp(2rem, 6vw, 3.5rem)",
            textShadow: "0 0 20px rgba(139, 95, 255, 0.3)",
          }}
        >
          ⚙️ Game Configuration ✨
        </h1>
        <p
          className="mobile-subtitle"
          style={{
            color: "var(--text-secondary)",
            fontSize: "clamp(1rem, 3vw, 1.25rem)",
            fontFamily: "Fredoka, sans-serif",
            fontWeight: "400",
          }}
        >
          Configure placement points for each category and event type! 🏆
        </p>
      </div>

      {/* No Categories Warning */}
      {categories.length === 0 ? (
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
          <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>
            📂
          </div>
          <h4
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-3)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            No Categories Found
          </h4>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "var(--font-size-lg)",
              marginBottom: "var(--space-4)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            Please create some categories first to configure their placement
            points! 🎯
          </p>
        </div>
      ) : (
        /* Configuration List */
        <div className="d-flex flex-column" style={{ gap: "var(--space-4)" }}>
          {categories.map((category) => (
            <div
              key={category.id}
              className="family-element"
              style={{
                background: "var(--bg-elevated)",
                border: "2px solid var(--border-accent)",
                borderRadius: "var(--radius-2xl)",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
                overflow: "hidden",
              }}
            >
              {/* Category Header */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
                  color: "white",
                  padding: "var(--space-5)",
                  textAlign: "center",
                }}
              >
                <h4
                  style={{
                    fontFamily: "Fredoka, sans-serif",
                    fontWeight: "700",
                    fontSize: "var(--font-size-xl)",
                    margin: 0,
                  }}
                >
                  🏷️ {category.label}
                </h4>
              </div>

              {/* Individual and Group Configurations */}
              <div className="row g-4" style={{ padding: "var(--space-5)" }}>
                {/* Individual Events */}
                <div className="col-12 col-md-6">
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      border: "2px solid var(--info-color)",
                      borderRadius: "var(--radius-xl)",
                      padding: "var(--space-4)",
                    }}
                  >
                    <h5
                      style={{
                        color: "var(--info-color)",
                        fontFamily: "Fredoka, sans-serif",
                        fontWeight: "600",
                        marginBottom: "var(--space-3)",
                        textAlign: "center",
                      }}
                    >
                      👤 Individual Events
                    </h5>

                    <PlacementConfig
                      placements={getPlacementConfig(category.id, "individual")}
                      onAddPlacement={() =>
                        addPlacement(category.id, "individual")
                      }
                      onRemovePlacement={(placement) =>
                        removePlacement(category.id, "individual", placement)
                      }
                      onUpdatePoints={(placement, points) =>
                        updatePlacementPoints(
                          category.id,
                          "individual",
                          placement,
                          points
                        )
                      }
                      onReset={() => resetToDefault(category.id, "individual")}
                      isSaving={isSaving === `${category.id}-individual`}
                    />
                  </div>
                </div>

                {/* Group Events */}
                <div className="col-12 col-md-6">
                  <div
                    style={{
                      background: "var(--bg-surface)",
                      border: "2px solid var(--success-color)",
                      borderRadius: "var(--radius-xl)",
                      padding: "var(--space-4)",
                    }}
                  >
                    <h5
                      style={{
                        color: "var(--success-color)",
                        fontFamily: "Fredoka, sans-serif",
                        fontWeight: "600",
                        marginBottom: "var(--space-3)",
                        textAlign: "center",
                      }}
                    >
                      👥 Group Events
                    </h5>

                    <PlacementConfig
                      placements={getPlacementConfig(category.id, "group")}
                      onAddPlacement={() => addPlacement(category.id, "group")}
                      onRemovePlacement={(placement) =>
                        removePlacement(category.id, "group", placement)
                      }
                      onUpdatePoints={(placement, points) =>
                        updatePlacementPoints(
                          category.id,
                          "group",
                          placement,
                          points
                        )
                      }
                      onReset={() => resetToDefault(category.id, "group")}
                      isSaving={isSaving === `${category.id}-group`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: "2rem" }}></div>
    </div>
  );
};

// Component for individual placement configuration
interface PlacementConfigProps {
  placements: { [placement: number]: number };
  onAddPlacement: () => void;
  onRemovePlacement: (placement: number) => void;
  onUpdatePoints: (placement: number, points: number) => void;
  onReset: () => void;
  isSaving: boolean;
}

const PlacementConfig: FC<PlacementConfigProps> = ({
  placements,
  onAddPlacement,
  onRemovePlacement,
  onUpdatePoints,
  onReset,
  isSaving,
}) => {
  const sortedPlacements = Object.entries(placements).sort(
    ([a], [b]) => parseInt(a) - parseInt(b)
  );

  const getMedalEmoji = (placement: number) => {
    switch (placement) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  return (
    <div>
      {/* Placements List */}
      <div className="mb-3">
        {sortedPlacements.map(([placement, points]) => (
          <div
            key={placement}
            className="d-flex align-items-center justify-content-between mb-2"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--space-3)",
            }}
          >
            <div className="d-flex align-items-center mobile-gap-sm">
              <span style={{ fontSize: "1.2rem" }}>
                {getMedalEmoji(parseInt(placement))}
              </span>
              <span
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  fontWeight: "600",
                  color: "var(--text-primary)",
                }}
              >
                {placement === "1"
                  ? "1st"
                  : placement === "2"
                  ? "2nd"
                  : placement === "3"
                  ? "3rd"
                  : `${placement}th`}
              </span>
            </div>

            <div className="d-flex align-items-center mobile-gap-sm">
              <input
                type="number"
                min="0"
                value={points}
                onChange={(e) =>
                  onUpdatePoints(
                    parseInt(placement),
                    parseInt(e.target.value) || 0
                  )
                }
                className="form-control"
                style={{
                  width: "80px",
                  background: "var(--bg-surface)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text-primary)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "Fredoka, sans-serif",
                  textAlign: "center",
                }}
              />
              <span
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--text-secondary)",
                  fontWeight: "500",
                  minWidth: "30px",
                }}
              >
                pts
              </span>

              {sortedPlacements.length > 1 && (
                <button
                  onClick={() => onRemovePlacement(parseInt(placement))}
                  className="btn family-element"
                  style={{
                    background: "var(--danger-color)",
                    color: "white",
                    border: "none",
                    borderRadius: "var(--radius-lg)",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--font-size-sm)",
                    padding: "0",
                  }}
                  title="Remove placement"
                >
                  ❌
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="d-flex justify-content-between align-items-center mobile-gap-sm flex-wrap">
        <button
          onClick={onAddPlacement}
          className="btn family-element"
          disabled={isSaving}
          style={{
            background: "var(--primary-color)",
            color: "white",
            border: "2px solid rgba(139, 95, 255, 0.3)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--font-size-sm)",
            fontWeight: "600",
            fontFamily: "Fredoka, sans-serif",
            opacity: isSaving ? "0.5" : "1",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          ➕ Add Placement
        </button>

        <button
          onClick={onReset}
          className="btn family-element"
          disabled={isSaving}
          style={{
            background: "var(--bg-surface)",
            color: "var(--text-secondary)",
            border: "2px solid var(--border-color)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-2) var(--space-3)",
            fontSize: "var(--font-size-sm)",
            fontWeight: "500",
            fontFamily: "Fredoka, sans-serif",
            opacity: isSaving ? "0.5" : "1",
            cursor: isSaving ? "not-allowed" : "pointer",
          }}
        >
          🔄 Reset Default
        </button>
      </div>

      {isSaving && (
        <div className="text-center mt-2">
          <small
            style={{
              color: "var(--primary-color)",
              fontFamily: "Fredoka, sans-serif",
              fontWeight: "500",
            }}
          >
            💾 Saving changes...
          </small>
        </div>
      )}
    </div>
  );
};

export default ConfigurationManagement;
