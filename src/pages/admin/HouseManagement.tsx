import { useState, useEffect } from "react";
import { House, Event, Player } from "../../types";
import {
  houseRepository,
  eventRepository,
  playerRepository,
} from "../../database";
import { useAuth } from "../../contexts/AuthContext";

const HouseManagement = () => {
  const { isAuthenticated } = useAuth();
  const [houses, setHouses] = useState<House[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [houseScores, setHouseScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    colorHex: "#E53935", // Default red color
  });

  // Predefined color palette for house selection - Improved with better variations
  const colorPalette = [
    { name: "Fire Red", hex: "#E53935" },
    { name: "Electric Blue", hex: "#1E88E5" },
    { name: "Emerald Green", hex: "#00C853" },
    { name: "Sunset Orange", hex: "#FF8F00" },
    { name: "Royal Purple", hex: "#8E24AA" },
    { name: "Hot Pink", hex: "#E91E63" },
    { name: "Turquoise", hex: "#00ACC1" },
    { name: "Golden Yellow", hex: "#FFC107" },
    { name: "Deep Indigo", hex: "#3F51B5" },
    { name: "Lime Green", hex: "#7CB342" },
    { name: "Crimson", hex: "#C62828" },
    { name: "Ocean Teal", hex: "#00838F" },
    { name: "Magenta", hex: "#AD1457" },
    { name: "Forest Green", hex: "#2E7D32" },
    { name: "Amber", hex: "#F57F17" },
    { name: "Navy Blue", hex: "#1A237E" },
    { name: "Coral", hex: "#FF5722" },
    { name: "Violet", hex: "#673AB7" },
    { name: "Bronze", hex: "#8D6E63" },
    { name: "Steel Blue", hex: "#455A64" },
  ];

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribeHouses = houseRepository.subscribeToAllHouses(
      (housesData) => {
        setHouses(housesData);
      }
    );

    const unsubscribeEvents = eventRepository.subscribeToAllEvents(
      (eventsData) => {
        setEvents(eventsData);
      }
    );

    const unsubscribePlayers = playerRepository.subscribeToAllPlayers(
      (playersData) => {
        setPlayers(playersData);
      }
    );

    setIsLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeHouses();
      unsubscribeEvents();
      unsubscribePlayers();
    };
  }, []);

  // Calculate house scores from completed events - matching Dashboard logic
  useEffect(() => {
    const calculateHouseScores = () => {
      const scores: Record<string, number> = {};

      // Initialize all houses with 0 points
      houses.forEach((house) => {
        scores[house.id] = 0;
      });

      // Calculate points from completed events
      const completedEvents = events.filter(
        (event) => event.status === "completed" && event.results
      );

      completedEvents.forEach((event) => {
        if (!event.results) return;

        event.results.forEach((result) => {
          const score = event.scoring[result.placement] || 0;

          if (event.type === "individual") {
            // Individual event - find player's house and add score to house
            const player = players.find((p) => p.id === result.participantId);
            if (player && scores[player.houseId] !== undefined) {
              scores[player.houseId] += score;
            }
          } else {
            // Group event - add score directly to house
            if (scores[result.participantId] !== undefined) {
              scores[result.participantId] += score;
            }
          }
        });
      });

      setHouseScores(scores);
    };

    if (houses.length > 0 && events.length > 0) {
      calculateHouseScores();
    }
  }, [houses, events, players]);

  // Sort houses: by points (descending) if any house has points, otherwise alphabetically
  const sortedHouses = [...houses].sort((a, b) => {
    const aPoints = houseScores[a.id] || 0;
    const bPoints = houseScores[b.id] || 0;

    // If any house has points, sort by points (descending)
    const hasAnyPoints = Object.values(houseScores).some((score) => score > 0);
    if (hasAnyPoints) {
      if (aPoints !== bPoints) {
        return bPoints - aPoints;
      }
    }

    // Fallback to alphabetical sorting
    return a.name.localeCompare(b.name);
  });

  const resetForm = () => {
    setFormData({ name: "", colorHex: "#E53935" });
    setEditingHouse(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Please enter a house name");
      return;
    }

    if (!formData.colorHex.trim()) {
      alert("Please select a house color");
      return;
    }

    try {
      // Check if name is already taken
      const nameTaken = await houseRepository.isNameTaken(
        formData.name,
        editingHouse?.id
      );

      if (nameTaken) {
        alert(
          "A house with this name already exists. Please choose a different name."
        );
        return;
      }

      if (editingHouse) {
        await houseRepository.updateHouse(editingHouse.id, {
          name: formData.name.trim(),
          colorHex: formData.colorHex,
        });
      } else {
        await houseRepository.createHouse({
          name: formData.name.trim(),
          colorHex: formData.colorHex,
        });
      }

      resetForm();
    } catch (err) {
      console.error("Error saving house:", err);
      if (err instanceof Error) {
        alert(`Failed to save house: ${err.message}`);
      } else {
        alert("Failed to save house");
      }
    }
  };

  const handleEdit = (house: House) => {
    setFormData({
      name: house.name,
      colorHex: house.colorHex,
    });
    setEditingHouse(house);
    setShowForm(true);
  };

  const handleDelete = async (house: House) => {
    if (
      !confirm(
        `Are you sure you want to delete "${house.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await houseRepository.deleteHouse(house.id);
    } catch (err) {
      console.error("Error deleting house:", err);
      if (err instanceof Error) {
        alert(`Failed to delete house: ${err.message}`);
      } else {
        alert("Failed to delete house");
      }
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
            🏘️
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
            Loading house teams... ✨
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
          🏘️ Team Houses ✨
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
          {isAuthenticated
            ? "Manage your family house teams and track their victories! 🏆"
            : "Discover all family house teams and their achievements! 🏆"}
        </p>

        {isAuthenticated && (
          <button
            onClick={() => setShowForm(true)}
            className="btn family-element"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
              color: "white",
              border: "2px solid rgba(139, 95, 255, 0.3)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-4) var(--space-6)",
              fontSize: "var(--font-size-lg)",
              fontWeight: "600",
              fontFamily: "Fredoka, sans-serif",
              boxShadow: "0 8px 25px rgba(139, 95, 255, 0.4)",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              marginTop: "var(--space-4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 12px 35px rgba(139, 95, 255, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 25px rgba(139, 95, 255, 0.4)";
            }}
          >
            <span style={{ marginRight: "var(--space-2)", fontSize: "1.2rem" }}>
              ➕
            </span>
            Add New House
          </button>
        )}
      </div>

      {/* Add/Edit Form */}
      {isAuthenticated && showForm && (
        <div
          className="card mb-5"
          style={{
            background: "var(--bg-elevated)",
            border: "2px solid var(--border-accent)",
            borderRadius: "var(--radius-2xl)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
            overflow: "hidden",
          }}
        >
          <div
            className="card-header"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
              color: "white",
              border: "none",
              padding: "var(--space-5)",
            }}
          >
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5
                  className="card-title mb-1"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  {editingHouse
                    ? "✏️ Edit House Team"
                    : "🏠 Create New House Team"}
                </h5>
                <p
                  className="mb-0"
                  style={{
                    opacity: "0.9",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  {editingHouse
                    ? "Update house team details"
                    : "Add a new house team to the family competition"}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="btn-close btn-close-white"
                type="button"
                aria-label="Close"
                style={{ fontSize: "1.2rem" }}
              ></button>
            </div>
          </div>

          <div className="card-body" style={{ padding: "var(--space-5)" }}>
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-12">
                  <label
                    className="form-label fw-bold mb-3"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    🏷️ House Team Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="form-control"
                    placeholder="Enter house name (e.g., Phoenix Warriors, Dragon Champions)"
                    required
                    style={{
                      padding: "var(--space-4)",
                      fontSize: "var(--font-size-lg)",
                      borderRadius: "var(--radius-xl)",
                      border: "2px solid var(--border-color)",
                      background: "var(--bg-surface)",
                      color: "var(--text-primary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  />
                </div>

                <div className="col-12">
                  <label
                    className="form-label fw-bold mb-3"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    🎨 Choose House Team Color
                  </label>

                  {/* Color Palette Grid - Compact */}
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {colorPalette.map((color) => (
                      <div
                        key={color.hex}
                        onClick={() =>
                          setFormData({ ...formData, colorHex: color.hex })
                        }
                        title={color.name}
                        style={{
                          width: "40px",
                          height: "40px",
                          background: `linear-gradient(135deg, ${color.hex}, ${color.hex}dd)`,
                          borderRadius: "12px",
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                          border:
                            formData.colorHex === color.hex
                              ? "3px solid white"
                              : "2px solid rgba(255,255,255,0.3)",
                          boxShadow:
                            formData.colorHex === color.hex
                              ? `0 6px 20px ${color.hex}50`
                              : "0 2px 8px rgba(0,0,0,0.1)",
                          transform:
                            formData.colorHex === color.hex
                              ? "scale(1.1)"
                              : "scale(1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          if (formData.colorHex !== color.hex) {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = `0 4px 15px ${color.hex}40`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.colorHex !== color.hex) {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow =
                              "0 2px 8px rgba(0,0,0,0.1)";
                          }
                        }}
                      >
                        {formData.colorHex === color.hex && (
                          <span
                            style={{
                              color: "white",
                              fontSize: "1.2rem",
                              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  className="btn family-element"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--text-primary)",
                    border: "2px solid var(--border-color)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-3) var(--space-5)",
                    fontWeight: "500",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn family-element"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
                    color: "white",
                    border: "2px solid rgba(139, 95, 255, 0.3)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-3) var(--space-5)",
                    fontWeight: "600",
                    fontFamily: "Fredoka, sans-serif",
                    boxShadow: "0 8px 25px rgba(139, 95, 255, 0.4)",
                  }}
                >
                  {editingHouse ? "💾 Update House" : "🏠 Create House"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* House Teams Grid - Completely Rewritten */}
      <div className="d-flex flex-column" style={{ gap: "var(--space-4)" }}>
        {sortedHouses.map((house) => {
          const houseScore = houseScores[house.id] || 0;
          const hasPoints = houseScore > 0;

          return (
            <div
              key={house.id}
              className="family-element"
              style={{
                background: `linear-gradient(135deg, ${house.colorHex}15, ${house.colorHex}05)`,
                border: `2px solid ${house.colorHex}44`,
                borderRadius: "var(--radius-xl)",
                padding: "var(--space-5)",
                boxShadow: `0 4px 20px ${house.colorHex}22`,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = `0 12px 35px ${house.colorHex}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 20px ${house.colorHex}22`;
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center mobile-gap-md">
                  {/* House Icon */}
                  <div
                    className="position-badge"
                    style={{
                      background: house.colorHex,
                      width: "56px",
                      height: "56px",
                      fontSize: "1.5rem",
                      boxShadow: `0 4px 15px ${house.colorHex}44`,
                    }}
                  >
                    🏠
                  </div>

                  {/* House Details */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h6
                      className="mb-1 fw-bold"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "Fredoka, sans-serif",
                        fontSize: "clamp(1.3rem, 4vw, 1.5rem)",
                      }}
                    >
                      {house.name}
                    </h6>
                    <div
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--font-size-base)",
                        fontWeight: "500",
                      }}
                    >
                      {hasPoints
                        ? `${houseScore} points earned`
                        : "Ready to compete! 🚀"}
                    </div>
                  </div>
                </div>

                {/* Right Side - Score Display */}
                <div className="text-end">
                  <div
                    className="h2 mb-1 fw-bold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "Fredoka, sans-serif",
                      fontSize: "clamp(2rem, 4vw, 1.8rem)",
                    }}
                  >
                    {houseScore} pts
                  </div>

                  {/* Admin Actions */}
                  {isAuthenticated && (
                    <div
                      className="d-flex justify-content-end mt-3"
                      style={{ gap: "var(--space-2)" }}
                    >
                      <button
                        onClick={() => handleEdit(house)}
                        className="btn family-element"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          border: "2px solid var(--border-color)",
                          borderRadius: "var(--radius-lg)",
                          padding: "var(--space-2)",
                          minHeight: "48px",
                          minWidth: "48px",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            "var(--primary-50)";
                          e.currentTarget.style.borderColor =
                            "var(--primary-color)";
                          e.currentTarget.style.color = "var(--primary-color)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--bg-elevated)";
                          e.currentTarget.style.borderColor =
                            "var(--border-color)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(house)}
                        className="btn family-element"
                        style={{
                          background: "var(--bg-elevated)",
                          color: "var(--text-primary)",
                          border: "2px solid var(--border-color)",
                          borderRadius: "var(--radius-lg)",
                          padding: "var(--space-2)",
                          minHeight: "48px",
                          minWidth: "48px",
                          transition: "all 0.3s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--danger-50)";
                          e.currentTarget.style.borderColor =
                            "var(--danger-color)";
                          e.currentTarget.style.color = "var(--danger-color)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--bg-elevated)";
                          e.currentTarget.style.borderColor =
                            "var(--border-color)";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {sortedHouses.length === 0 && (
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
            🏠
          </div>
          <h4
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-3)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            No House Teams Yet
          </h4>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "var(--font-size-lg)",
              marginBottom: isAuthenticated ? "var(--space-4)" : "0",
            }}
          >
            {isAuthenticated
              ? "Create your first house team to start the family competition! 🏆"
              : "House teams will appear here once they are created by administrators."}
          </p>
          {isAuthenticated && (
            <button
              onClick={() => setShowForm(true)}
              className="btn family-element"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-color), var(--accent-purple))",
                color: "white",
                border: "2px solid rgba(139, 95, 255, 0.3)",
                borderRadius: "var(--radius-2xl)",
                padding: "var(--space-4) var(--space-6)",
                fontSize: "var(--font-size-lg)",
                fontWeight: "600",
                fontFamily: "Fredoka, sans-serif",
                boxShadow: "0 8px 25px rgba(139, 95, 255, 0.4)",
              }}
            >
              🏠 Create First House
            </button>
          )}
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: "2rem" }}></div>
    </div>
  );
};

export default HouseManagement;
