import { useState, useEffect } from "react";
import { Event, Category, Player, House } from "../types";
import {
  eventRepository,
  categoryRepository,
  playerRepository,
  houseRepository,
} from "../database";
import ExpandableRow from "../components/ExpandableRow";

const Agenda: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [participants, setParticipants] = useState<
    Record<string, Player | House>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | Event["status"]>(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | Event["type"]>("all");

  // Expanded state for expandable rows
  const [expandedEvents, setExpandedEvents] = useState<{
    [key: string]: boolean;
  }>({});

  // Load data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribeEvents = eventRepository.subscribeToAllEvents(
      (eventsList: Event[]) => {
        setEvents(eventsList);
      }
    );

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories(
      (categoriesList: Category[]) => {
        setCategories(categoriesList);
      }
    );

    // Load participants (both players and houses) for name lookup
    const loadParticipants = async () => {
      try {
        const [players, houses] = await Promise.all([
          playerRepository.getAllPlayers(),
          houseRepository.getAllHouses(),
        ]);

        const participantsMap: Record<string, Player | House> = {};
        players.forEach((player) => (participantsMap[player.id] = player));
        houses.forEach((house) => (participantsMap[house.id] = house));

        setParticipants(participantsMap);
      } catch (err) {
        console.error("Error loading participants:", err);
      }
    };

    loadParticipants();
    setIsLoading(false);

    return () => {
      unsubscribeEvents();
      unsubscribeCategories();
    };
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.label : "Unknown Category";
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants[participantId];
    if (!participant) return "Unknown";

    if ("fullName" in participant) {
      return participant.fullName; // Player
    } else {
      return participant.name; // House
    }
  };

  const getScoreForPlacement = (event: Event, placement: number) => {
    return event.scoring[placement] || 0;
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Not scheduled";
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleEventExpanded = (eventId: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  // Filter events
  const filteredEvents = events.filter((event) => {
    if (statusFilter !== "all" && event.status !== statusFilter) return false;
    if (categoryFilter !== "all" && event.categoryId !== categoryFilter)
      return false;
    if (typeFilter !== "all" && event.type !== typeFilter) return false;
    return true;
  });

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
            ⏳
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
            Loading magical events... ✨
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
          🎯 Event Calendar ✨
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
          Browse all your family's scheduled activities and adventures! 📅
        </p>
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
            <div className="col-6 col-md-4">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as "all" | Event["status"])
                }
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
                <option value="all">All Status</option>
                <option value="scheduled">📅 Scheduled</option>
                <option value="in-progress">🔥 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>

            <div className="col-6 col-md-4">
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

            <div className="col-6 col-md-4">
              <select
                value={typeFilter}
                onChange={(e) =>
                  setTypeFilter(e.target.value as "all" | Event["type"])
                }
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
                <option value="all">All Types</option>
                <option value="individual">👤 Individual</option>
                <option value="group">👥 Group</option>
              </select>
            </div>
          </div>

          {/* Filter Results Count */}
          {(statusFilter !== "all" ||
            categoryFilter !== "all" ||
            typeFilter !== "all") && (
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
                  marginBottom: "var(--space-3)",
                }}
              >
                {filteredEvents.length === 0
                  ? "No events found"
                  : `${filteredEvents.length} of ${events.length} events shown`}{" "}
                ✨
              </div>
              <div>
                <button
                  onClick={() => {
                    setStatusFilter("all");
                    setCategoryFilter("all");
                    setTypeFilter("all");
                  }}
                  className="btn family-element"
                  style={{
                    background: "var(--bg-surface)",
                    color: "var(--text-secondary)",
                    border: "2px solid var(--border-color)",
                    borderRadius: "var(--radius-lg)",
                    padding: "var(--space-2) var(--space-4)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: "500",
                    fontFamily: "Fredoka, sans-serif",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--accent-purple-light)";
                    e.currentTarget.style.borderColor = "var(--accent-purple)";
                    e.currentTarget.style.color = "var(--accent-purple)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface)";
                    e.currentTarget.style.borderColor = "var(--border-color)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  🔄 Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div
          className="text-center py-5"
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-2xl)",
            border: "2px solid var(--border-accent)",
            boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
          }}
        >
          <div style={{ fontSize: "4rem", marginBottom: "var(--space-4)" }}>
            🎯
          </div>
          <h4
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-3)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            No Events Found
          </h4>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "var(--font-size-lg)",
              fontWeight: "500",
            }}
          >
            No events match your current filters. Try adjusting your selection!
            ✨
          </p>
        </div>
      ) : (
        <div className="d-flex flex-column" style={{ gap: "var(--space-4)" }}>
          {filteredEvents.map((event) => {
            const isExpanded = expandedEvents[event.id] || false;
            const getEventColor = (status: Event["status"]) => {
              switch (status) {
                case "scheduled":
                  return "var(--info-color)";
                case "in-progress":
                  return "var(--warning-color)";
                case "completed":
                  return "var(--success-color)";
                default:
                  return "var(--text-muted)";
              }
            };

            const getEventIcon = (status: Event["status"]) => {
              switch (status) {
                case "scheduled":
                  return "📅";
                case "in-progress":
                  return "🔥";
                case "completed":
                  return "🏆";
                default:
                  return "📌";
              }
            };

            const accentColor = getEventColor(event.status);
            const eventIcon = getEventIcon(event.status);
            const isLive = event.status === "in-progress";

            return (
              <ExpandableRow
                key={event.id}
                accentColor={accentColor}
                isExpanded={isExpanded}
                onToggle={() => toggleEventExpanded(event.id)}
                previewContent={
                  <div className="d-flex align-items-center justify-content-between w-100">
                    <div className="d-flex align-items-center mobile-gap-md flex-grow-1">
                      <div
                        style={{
                          background: accentColor,
                          borderRadius: "var(--radius-full)",
                          width: "48px",
                          height: "48px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "1.5rem",
                          boxShadow: `0 4px 15px ${accentColor}44`,
                          animation: isLive ? "pulse 2s infinite" : "none",
                        }}
                      >
                        {eventIcon}
                      </div>
                      <div className="min-width-0 flex-grow-1">
                        <div className="d-flex align-items-center mobile-gap-sm mb-1">
                          <h6
                            className="mb-0 fw-bold"
                            style={{
                              color: "var(--text-primary)",
                              fontFamily: "Fredoka, sans-serif",
                            }}
                          >
                            {event.name}
                          </h6>
                          {isLive && (
                            <span
                              className="badge"
                              style={{
                                background: "var(--warning-color)",
                                color: "white",
                                fontSize: "var(--font-size-xs)",
                                animation: "pulse 2s infinite",
                              }}
                            >
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center mobile-gap-sm flex-wrap">
                          <span
                            className="badge"
                            style={{
                              background: "var(--secondary-color)",
                              color: "white",
                              fontSize: "var(--font-size-xs)",
                            }}
                          >
                            {getCategoryName(event.categoryId)}
                          </span>
                          <span
                            className="badge"
                            style={{
                              background: "var(--accent-purple)",
                              color: "white",
                              fontSize: "var(--font-size-xs)",
                            }}
                          >
                            {event.type === "individual"
                              ? "👤 Individual"
                              : "👥 Group Event"}
                          </span>
                          {isExpanded && (
                            <span
                              className="badge"
                              style={{
                                background: accentColor,
                                color: "white",
                                fontSize: "var(--font-size-xs)",
                                animation: isLive
                                  ? "pulse 2s infinite"
                                  : "none",
                              }}
                            >
                              {event.status === "scheduled"
                                ? "📅 Scheduled"
                                : event.status === "in-progress"
                                ? "🔥 In Progress"
                                : "🏆 Completed"}
                            </span>
                          )}
                          <small
                            style={{
                              color: "var(--text-secondary)",
                              fontWeight: "500",
                            }}
                          >
                            {event.status === "scheduled" &&
                              formatDate(event.startTime)}
                            {event.status === "in-progress" &&
                              `Started: ${formatDate(event.startTime)}`}
                            {event.status === "completed" &&
                              formatDate(event.endTime)}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              >
                {/* Detailed information when expanded */}
                <div
                  className="d-flex flex-column"
                  style={{ gap: "var(--space-3)" }}
                >
                  <div
                    className="p-3 rounded"
                    style={{
                      background: "var(--bg-elevated)",
                      border: `1px solid ${accentColor}`,
                    }}
                  >
                    <div className="mb-3">
                      <div className="d-flex align-items-center mb-2">
                        <span
                          style={{
                            fontSize: "1.5rem",
                            marginRight: "var(--space-2)",
                          }}
                        >
                          🏆
                        </span>
                        <span
                          className="fw-bold"
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "Fredoka, sans-serif",
                          }}
                        >
                          Point System ({Object.entries(event.scoring).length}{" "}
                          placements)
                        </span>
                      </div>
                      <div
                        className="d-flex flex-wrap"
                        style={{ gap: "var(--space-2)" }}
                      >
                        {Object.entries(event.scoring)
                          .sort(([a], [b]) => parseInt(a) - parseInt(b))
                          .map(([placement, points]) => (
                            <span
                              key={placement}
                              className="badge"
                              style={{
                                background:
                                  placement === "1"
                                    ? "var(--warning-color)"
                                    : placement === "2"
                                    ? "#C0C0C0"
                                    : placement === "3"
                                    ? "#CD7F32"
                                    : "var(--info-color)",
                                color: "white",
                                fontSize: "var(--font-size-sm)",
                                padding: "var(--space-2) var(--space-4)",
                                fontFamily: "Fredoka, sans-serif",
                                fontWeight: "700",
                                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                              }}
                            >
                              {placement === "1"
                                ? "🥇"
                                : placement === "2"
                                ? "🥈"
                                : placement === "3"
                                ? "🥉"
                                : `#${placement}`}{" "}
                              → {points}pts
                            </span>
                          ))}
                      </div>
                    </div>
                    <div className="text-center">
                      <small
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "var(--font-size-sm)",
                          fontWeight: "500",
                        }}
                      >
                        Higher placements earn more points for your house! 🏠✨
                      </small>
                    </div>
                  </div>

                  {/* Results for Completed Events */}
                  {event.status === "completed" &&
                    event.results &&
                    event.results.length > 0 && (
                      <div
                        className="p-3 rounded"
                        style={{
                          background: "var(--bg-elevated)",
                          border: `1px solid ${accentColor}`,
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center">
                            <span
                              style={{
                                fontSize: "1.5rem",
                                marginRight: "var(--space-2)",
                              }}
                            >
                              🏅
                            </span>
                            <span
                              className="fw-bold"
                              style={{
                                color: "var(--text-primary)",
                                fontFamily: "Fredoka, sans-serif",
                              }}
                            >
                              Final Results
                            </span>
                          </div>
                          <div className="text-end">
                            <div
                              className="fw-bold"
                              style={{
                                color: accentColor,
                                fontFamily: "Fredoka, sans-serif",
                                fontSize: "var(--font-size-lg)",
                                textShadow: "0 1px 2px rgba(0, 0, 0, 0.2)",
                              }}
                            >
                              {event.results.length} participants
                            </div>
                            <small
                              style={{
                                color: "var(--text-secondary)",
                                fontWeight: "500",
                              }}
                            >
                              completed
                            </small>
                          </div>
                        </div>

                        <div
                          className="d-flex flex-column"
                          style={{ gap: "var(--space-2)" }}
                        >
                          {event.results
                            .sort((a, b) => a.placement - b.placement)
                            .map((result) => {
                              const participant =
                                participants[result.participantId];
                              const participantName = getParticipantName(
                                result.participantId
                              );
                              const isHouse =
                                participant && !("fullName" in participant);
                              const points = getScoreForPlacement(
                                event,
                                result.placement
                              );

                              return (
                                <div
                                  key={result.participantId}
                                  style={{
                                    background:
                                      result.placement <= 3
                                        ? `linear-gradient(135deg, ${
                                            result.placement === 1
                                              ? "var(--warning-color)"
                                              : result.placement === 2
                                              ? "#C0C0C0"
                                              : "#CD7F32"
                                          }, ${
                                            result.placement === 1
                                              ? "#FFD700"
                                              : result.placement === 2
                                              ? "#E8E8E8"
                                              : "#DEB887"
                                          })`
                                        : "var(--bg-surface)",
                                    color:
                                      result.placement <= 3
                                        ? "white"
                                        : "var(--text-primary)",
                                    borderRadius: "var(--radius-lg)",
                                    padding: "var(--space-3)",
                                    border:
                                      result.placement <= 3
                                        ? "none"
                                        : "1px solid var(--border-color)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    boxShadow:
                                      result.placement <= 3
                                        ? "0 4px 15px rgba(0, 0, 0, 0.2)"
                                        : "none",
                                  }}
                                >
                                  <div
                                    className="d-flex align-items-center"
                                    style={{ gap: "var(--space-3)" }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "1.5rem",
                                        minWidth: "40px",
                                        textAlign: "center",
                                      }}
                                    >
                                      {result.placement === 1
                                        ? "🥇"
                                        : result.placement === 2
                                        ? "🥈"
                                        : result.placement === 3
                                        ? "🥉"
                                        : `#${result.placement}`}
                                    </div>
                                    <div>
                                      <div
                                        className="fw-bold"
                                        style={{
                                          fontFamily: "Fredoka, sans-serif",
                                          fontSize: "var(--font-size-lg)",
                                          textShadow:
                                            result.placement <= 3
                                              ? "0 1px 2px rgba(0, 0, 0, 0.3)"
                                              : "none",
                                        }}
                                      >
                                        {participantName}
                                      </div>
                                      {!isHouse &&
                                        participant &&
                                        "houseId" in participant && (
                                          <small
                                            style={{
                                              opacity: "0.9",
                                              fontSize: "var(--font-size-sm)",
                                              fontWeight: "500",
                                            }}
                                          >
                                            🏠{" "}
                                            {getParticipantName(
                                              participant.houseId
                                            )}
                                          </small>
                                        )}
                                    </div>
                                  </div>
                                  <div className="text-end">
                                    <div
                                      className="fw-bold"
                                      style={{
                                        fontFamily: "Fredoka, sans-serif",
                                        fontSize: "var(--font-size-xl)",
                                        textShadow:
                                          result.placement <= 3
                                            ? "0 1px 2px rgba(0, 0, 0, 0.3)"
                                            : "none",
                                      }}
                                    >
                                      {points}
                                    </div>
                                    <small
                                      style={{
                                        opacity: "0.9",
                                        fontWeight: "500",
                                      }}
                                    >
                                      points
                                    </small>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {/* Winner Celebration */}
                        {event.results.length > 0 && (
                          <div
                            className="text-center mt-3 p-2 rounded"
                            style={{
                              background:
                                "linear-gradient(135deg, var(--warning-color), #FFD700)",
                              color: "white",
                              animation: "glow-pulse 3s infinite",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "1.2rem",
                                marginBottom: "var(--space-1)",
                              }}
                            >
                              🎉
                            </div>
                            <small
                              style={{
                                fontWeight: "700",
                                fontFamily: "Fredoka, sans-serif",
                                fontSize: "var(--font-size-sm)",
                                textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                              }}
                            >
                              Congratulations{" "}
                              {getParticipantName(
                                event.results.find((r) => r.placement === 1)
                                  ?.participantId || ""
                              )}
                              !
                            </small>
                          </div>
                        )}
                      </div>
                    )}

                  <div className="text-center">
                    <small
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--font-size-sm)",
                        fontWeight: "500",
                      }}
                    >
                      {event.status === "scheduled" &&
                        `📅 Starts ${formatDate(event.startTime)}`}
                      {event.status === "in-progress" &&
                        `🔥 Started ${formatDate(event.startTime)}`}
                      {event.status === "completed" &&
                        `✅ Completed ${formatDate(event.endTime)}`}
                    </small>
                  </div>
                </div>
              </ExpandableRow>
            );
          })}
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: "2rem" }}></div>
    </div>
  );
};

export default Agenda;
