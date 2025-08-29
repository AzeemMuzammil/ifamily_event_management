import { useState, useEffect } from "react";
import { Player, House, Category, Event } from "../../types";
import {
  playerRepository,
  houseRepository,
  categoryRepository,
  eventRepository,
} from "../../database";
import { useAuth } from "../../contexts/AuthContext";

const PlayerManagement = () => {
  const { isAuthenticated } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [playerScores, setPlayerScores] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    houseId: "",
    categoryId: "",
  });

  // Filters
  const [houseFilter, setHouseFilter] = useState<"all" | string>("all");
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribePlayers = playerRepository.subscribeToAllPlayers(
      (playersData) => {
        setPlayers(playersData);
      }
    );

    const unsubscribeHouses = houseRepository.subscribeToAllHouses(
      (housesData) => {
        setHouses(housesData);
      }
    );

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories(
      (categoriesData) => {
        setCategories(categoriesData);
      }
    );

    const unsubscribeEvents = eventRepository.subscribeToAllEvents(
      (eventsData) => {
        setEvents(eventsData);
      }
    );

    setIsLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribePlayers();
      unsubscribeHouses();
      unsubscribeCategories();
      unsubscribeEvents();
    };
  }, []);

  // Calculate player scores from completed events - matching Dashboard logic
  useEffect(() => {
    const calculatePlayerScores = () => {
      const scores: Record<string, number> = {};

      // Initialize all players with 0 points
      players.forEach((player) => {
        scores[player.id] = 0;
      });

      // Calculate points from completed individual events
      const completedEvents = events.filter(
        (event) =>
          event.status === "completed" &&
          event.results &&
          event.type === "individual"
      );

      completedEvents.forEach((event) => {
        if (!event.results) return;

        event.results.forEach((result) => {
          const score = event.scoring[result.placement] || 0;
          if (scores[result.participantId] !== undefined) {
            scores[result.participantId] += score;
          }
        });
      });

      setPlayerScores(scores);
    };

    if (players.length > 0 && events.length > 0) {
      calculatePlayerScores();
    }
  }, [players, events]);

  // Sort players: by points (descending) if any player has points, otherwise alphabetically
  const sortedPlayers = [...players]
    .filter((player) => {
      if (houseFilter !== "all" && player.houseId !== houseFilter) return false;
      if (categoryFilter !== "all" && player.categoryId !== categoryFilter)
        return false;
      return true;
    })
    .sort((a, b) => {
      const aPoints = playerScores[a.id] || 0;
      const bPoints = playerScores[b.id] || 0;

      // If any player has points, sort by points (descending)
      const hasAnyPoints = Object.values(playerScores).some(
        (score) => score > 0
      );
      if (hasAnyPoints) {
        if (aPoints !== bPoints) {
          return bPoints - aPoints;
        }
      }

      // Fallback to alphabetical sorting
      return a.fullName.localeCompare(b.fullName);
    });

  const resetForm = () => {
    setFormData({ fullName: "", houseId: "", categoryId: "" });
    setEditingPlayer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.fullName.trim() ||
      !formData.houseId ||
      !formData.categoryId
    ) {
      alert("Please fill in all fields");
      return;
    }

    try {
      // Check if player name is already taken in the same category and house
      const nameTaken = await playerRepository.isPlayerNameTaken(
        formData.fullName,
        formData.categoryId,
        formData.houseId,
        editingPlayer?.id
      );

      if (nameTaken) {
        alert(
          "A player with this name already exists in the same house and category. Please choose a different name."
        );
        return;
      }

      const playerData = {
        fullName: formData.fullName.trim(),
        houseId: formData.houseId,
        categoryId: formData.categoryId,
      };

      if (editingPlayer) {
        await playerRepository.updatePlayer(editingPlayer.id, playerData);
      } else {
        await playerRepository.createPlayer(playerData);
      }

      resetForm();
    } catch (err) {
      console.error("Error saving player:", err);
      if (err instanceof Error) {
        alert(`Failed to save player: ${err.message}`);
      } else {
        alert("Failed to save player");
      }
    }
  };

  const handleEdit = (player: Player) => {
    setFormData({
      fullName: player.fullName,
      houseId: player.houseId,
      categoryId: player.categoryId,
    });
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = async (player: Player) => {
    if (
      !confirm(
        `Are you sure you want to delete "${player.fullName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await playerRepository.deletePlayer(player.id);
    } catch (err) {
      console.error("Error deleting player:", err);
      if (err instanceof Error) {
        alert(`Failed to delete player: ${err.message}`);
      } else {
        alert("Failed to delete player");
      }
    }
  };

  const getHouseName = (houseId: string) => {
    const house = houses.find((h) => h.id === houseId);
    return house?.name || "Unknown";
  };

  const getHouseColor = (houseId: string) => {
    const house = houses.find((h) => h.id === houseId);
    return house?.colorHex || "#6c757d";
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.label || "Unknown";
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
            👨‍👩‍👧‍👦
          </div>
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid var(--border-color)",
              borderTop: "4px solid var(--secondary-color)",
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
            Loading family members... ✨
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
          👨‍👩‍👧‍👦 Family Members ✨
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
            ? "Manage your family roster and track individual achievements! 🏆"
            : "Meet all family members and see their achievements! 🏆"}
        </p>

        {isAuthenticated && (
          <button
            onClick={() => setShowForm(true)}
            className="btn family-element"
            style={{
              background:
                "linear-gradient(135deg, var(--secondary-color), var(--secondary-600))",
              color: "white",
              border: "2px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-4) var(--space-6)",
              fontSize: "var(--font-size-lg)",
              fontWeight: "600",
              fontFamily: "Fredoka, sans-serif",
              boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
              transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              marginTop: "var(--space-4)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
              e.currentTarget.style.boxShadow =
                "0 12px 35px rgba(16, 185, 129, 0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow =
                "0 8px 25px rgba(16, 185, 129, 0.4)";
            }}
          >
            <span style={{ marginRight: "var(--space-2)", fontSize: "1.2rem" }}>
              ➕
            </span>
            Add New Family Member
          </button>
        )}
      </div>

      {/* Compact Filters */}
      <div
        className="card mb-4"
        style={{
          background: "var(--bg-elevated)",
          border: "2px solid var(--border-accent)",
          borderRadius: "var(--radius-2xl)",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div className="card-body" style={{ padding: "var(--space-4)" }}>
          <div className="row g-3 align-items-end">
            <div className="col-6 col-md-6">
              <select
                value={houseFilter}
                onChange={(e) => setHouseFilter(e.target.value)}
                className="form-select family-element"
                style={{
                  background: "var(--bg-surface)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text-primary)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "Fredoka, sans-serif",
                  padding: "var(--space-3)",
                }}
              >
                <option value="all">All Houses</option>
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    🏘️ {house.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-6 col-md-6">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-select family-element"
                style={{
                  background: "var(--bg-surface)",
                  border: "2px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  color: "var(--text-primary)",
                  fontSize: "var(--font-size-sm)",
                  fontFamily: "Fredoka, sans-serif",
                  padding: "var(--space-3)",
                }}
              >
                <option value="all">All Categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    🏷️ {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Results Count */}
          {(houseFilter !== "all" || categoryFilter !== "all") && (
            <div className="text-center mt-3">
              <div
                style={{
                  background: "var(--bg-surface)",
                  color: "var(--text-secondary)",
                  padding: "var(--space-2) var(--space-4)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "var(--font-size-sm)",
                  fontWeight: "500",
                  fontFamily: "Fredoka, sans-serif",
                  border: "1px solid var(--border-color)",
                  display: "inline-block",
                }}
              >
                {sortedPlayers.length === 0
                  ? "No members found"
                  : `${sortedPlayers.length} of ${players.length} members shown`}{" "}
                ✨
              </div>
            </div>
          )}
        </div>
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
                "linear-gradient(135deg, var(--secondary-color), var(--secondary-600))",
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
                  {editingPlayer
                    ? "✏️ Edit Family Member"
                    : "👤 Add New Family Member"}
                </h5>
                <p
                  className="mb-0"
                  style={{
                    opacity: "0.9",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  {editingPlayer
                    ? "Update family member details"
                    : "Add a new family member to the roster"}
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
                    👤 Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="form-control"
                    placeholder="Enter family member's full name (e.g., John Smith)"
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

                <div className="col-md-6">
                  <label
                    className="form-label fw-bold mb-3"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    🏘️ House Team
                  </label>
                  <select
                    value={formData.houseId}
                    onChange={(e) =>
                      setFormData({ ...formData, houseId: e.target.value })
                    }
                    className="form-select"
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
                  >
                    <option value="">Select a house team</option>
                    {houses.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label
                    className="form-label fw-bold mb-3"
                    style={{
                      color: "var(--text-primary)",
                      fontSize: "1.1rem",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    🏷️ Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="form-select"
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
                  >
                    <option value="">Select age category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
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
                      "linear-gradient(135deg, var(--secondary-color), var(--secondary-600))",
                    color: "white",
                    border: "2px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "var(--radius-xl)",
                    padding: "var(--space-3) var(--space-5)",
                    fontWeight: "600",
                    fontFamily: "Fredoka, sans-serif",
                    boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
                  }}
                >
                  {editingPlayer
                    ? "💾 Update Family Member"
                    : "👤 Add Family Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Family Members List */}
      <div className="d-flex flex-column" style={{ gap: "var(--space-4)" }}>
        {sortedPlayers.map((player) => {
          const houseColor = getHouseColor(player.houseId);
          const houseName = getHouseName(player.houseId);
          const categoryLabel = getCategoryLabel(player.categoryId);
          const playerScore = playerScores[player.id] || 0;
          const hasPoints = playerScore > 0;

          return (
            <div
              key={player.id}
              className="family-element"
              style={{
                background: `linear-gradient(135deg, ${houseColor}15, ${houseColor}05)`,
                border: `2px solid ${houseColor}44`,
                borderRadius: "var(--radius-xl)",
                padding: "var(--space-5)",
                boxShadow: `0 4px 20px ${houseColor}22`,
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.02)";
                e.currentTarget.style.boxShadow = `0 12px 35px ${houseColor}33`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0) scale(1)";
                e.currentTarget.style.boxShadow = `0 4px 20px ${houseColor}22`;
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center mobile-gap-md">
                  {/* Player Icon */}
                  <div
                    className="position-badge"
                    style={{
                      background: houseColor,
                      width: "56px",
                      height: "56px",
                      fontSize: "1.5rem",
                      boxShadow: `0 4px 15px ${houseColor}44`,
                    }}
                  >
                    👤
                  </div>

                  {/* Player Details */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <h6
                      className="mb-1 fw-bold"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "Fredoka, sans-serif",
                        fontSize: "clamp(1.3rem, 4vw, 1.5rem)",
                      }}
                    >
                      {player.fullName}
                    </h6>
                    <div className="d-flex align-items-center mobile-gap-sm flex-wrap">
                      <span
                        className="badge"
                        style={{
                          background: houseColor,
                          color: "white",
                          fontSize: "var(--font-size-xs)",
                        }}
                      >
                        🏘️ {houseName}
                      </span>
                      <span
                        className="badge"
                        style={{
                          background: "var(--accent-purple)",
                          color: "white",
                          fontSize: "var(--font-size-xs)",
                        }}
                      >
                        {categoryLabel}
                      </span>
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "var(--font-size-base)",
                          fontWeight: "500",
                        }}
                      >
                        {hasPoints
                          ? `${playerScore} points earned`
                          : "Ready to compete! 🚀"}
                      </div>
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
                    {playerScore} pts
                  </div>

                  {/* Admin Actions */}
                  {isAuthenticated && (
                    <div
                      className="d-flex justify-content-end mt-3"
                      style={{ gap: "var(--space-2)" }}
                    >
                      <button
                        onClick={() => handleEdit(player)}
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
                            "var(--secondary-50)";
                          e.currentTarget.style.borderColor =
                            "var(--secondary-color)";
                          e.currentTarget.style.color =
                            "var(--secondary-color)";
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
                        onClick={() => handleDelete(player)}
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
      {sortedPlayers.length === 0 && (
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
            👨‍👩‍👧‍👦
          </div>
          <h4
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-3)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            {players.length === 0
              ? "No Family Members Yet"
              : "No Members Found"}
          </h4>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "var(--font-size-lg)",
              marginBottom: isAuthenticated ? "var(--space-4)" : "0",
            }}
          >
            {players.length === 0
              ? isAuthenticated
                ? "Add your first family member to get started with the fun! 🎉"
                : "Family members will appear here once they are added by administrators."
              : "No family members match your current filters. Try adjusting your selection! ✨"}
          </p>
          {isAuthenticated && players.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="btn family-element"
              style={{
                background:
                  "linear-gradient(135deg, var(--secondary-color), var(--secondary-600))",
                color: "white",
                border: "2px solid rgba(16, 185, 129, 0.3)",
                borderRadius: "var(--radius-2xl)",
                padding: "var(--space-4) var(--space-6)",
                fontSize: "var(--font-size-lg)",
                fontWeight: "600",
                fontFamily: "Fredoka, sans-serif",
                boxShadow: "0 8px 25px rgba(16, 185, 129, 0.4)",
              }}
            >
              👤 Add First Family Member
            </button>
          )}
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: "2rem" }}></div>
    </div>
  );
};

export default PlayerManagement;
