import React, { useState, useEffect } from "react";
import { Event, House, Player, Category } from "../types";
import {
  eventRepository,
  houseRepository,
  playerRepository,
  categoryRepository,
} from "../database";
import ExpandableRow from "../components/ExpandableRow";

interface HouseScore {
  houseId: string;
  houseName: string;
  houseColor: string;
  totalScore: number;
  eventsWon: number;
  categoryBreakdown: {
    [categoryId: string]: number;
  };
}

interface PlayerScore {
  playerId: string;
  playerName: string;
  houseId: string;
  houseName: string;
  houseColor: string;
  totalScore: number;
  eventsWon: number;
}

const Dashboard: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived data
  const [houseScores, setHouseScores] = useState<HouseScore[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);

  // Expanded state for expandable rows
  const [expandedRecentEvents, setExpandedRecentEvents] = useState<{
    [key: string]: boolean;
  }>({});
  const [expandedUpcomingEvents, setExpandedUpcomingEvents] = useState<{
    [key: string]: boolean;
  }>({});

  // Top Players filter state
  const [selectedCategoryFilter, setSelectedCategoryFilter] =
    useState<string>("all");

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribeEvents = eventRepository.subscribeToAllEvents(
      (eventsList: Event[]) => {
        setEvents(eventsList);

        // Filter recent and upcoming events
        const completed = eventsList
          .filter((e) => e.status === "completed")
          .sort(
            (a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0)
          )
          .slice(0, 5);

        const upcoming = eventsList
          .filter((e) => e.status === "scheduled" || e.status === "in-progress")
          .sort((a, b) => {
            const aTime = a.startTime?.getTime() || Number.MAX_SAFE_INTEGER;
            const bTime = b.startTime?.getTime() || Number.MAX_SAFE_INTEGER;
            return aTime - bTime;
          })
          .slice(0, 5);

        setRecentEvents(completed);
        setUpcomingEvents(upcoming);
      }
    );

    const unsubscribeHouses = houseRepository.subscribeToAllHouses(
      (housesList: House[]) => {
        setHouses(housesList);
      }
    );

    const unsubscribePlayers = playerRepository.subscribeToAllPlayers(
      (playersList: Player[]) => {
        setPlayers(playersList);
      }
    );

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories(
      (categoriesList: Category[]) => {
        setCategories(categoriesList);
      }
    );

    setIsLoading(false);

    return () => {
      unsubscribeEvents();
      unsubscribeHouses();
      unsubscribePlayers();
      unsubscribeCategories();
    };
  }, []);

  // Calculate scores whenever data changes
  useEffect(() => {
    if (events.length > 0 && houses.length > 0 && players.length > 0) {
      calculateScores();
    }
  }, [events, houses, players]);

  const calculateScores = () => {
    // Initialize house scores
    const houseScoreMap: { [houseId: string]: HouseScore } = {};
    houses.forEach((house) => {
      houseScoreMap[house.id] = {
        houseId: house.id,
        houseName: house.name,
        houseColor: house.colorHex,
        totalScore: 0,
        eventsWon: 0,
        categoryBreakdown: {},
      };
    });

    // Initialize player scores
    const playerScoreMap: { [playerId: string]: PlayerScore } = {};
    players.forEach((player) => {
      const house = houses.find((h) => h.id === player.houseId);
      if (house) {
        playerScoreMap[player.id] = {
          playerId: player.id,
          playerName: player.fullName,
          houseId: player.houseId,
          houseName: house.name,
          houseColor: house.colorHex,
          totalScore: 0,
          eventsWon: 0,
        };
      }
    });

    // Calculate scores from completed events
    const completedEvents = events.filter(
      (event) => event.status === "completed" && event.results
    );

    completedEvents.forEach((event) => {
      if (!event.results) return;

      event.results.forEach((result) => {
        const score = event.scoring[result.placement] || 0;

        if (event.type === "individual") {
          // Individual event - add score to player
          if (playerScoreMap[result.participantId]) {
            playerScoreMap[result.participantId].totalScore += score;
            if (result.placement === 1) {
              playerScoreMap[result.participantId].eventsWon += 1;
            }

            // Add to house score as well
            const player = players.find((p) => p.id === result.participantId);
            if (player && houseScoreMap[player.houseId]) {
              houseScoreMap[player.houseId].totalScore += score;
              if (result.placement === 1) {
                houseScoreMap[player.houseId].eventsWon += 1;
              }

              // Category breakdown
              if (
                !houseScoreMap[player.houseId].categoryBreakdown[
                  event.categoryId
                ]
              ) {
                houseScoreMap[player.houseId].categoryBreakdown[
                  event.categoryId
                ] = 0;
              }
              houseScoreMap[player.houseId].categoryBreakdown[
                event.categoryId
              ] += score;
            }
          }
        } else {
          // Group event - add score directly to house
          if (houseScoreMap[result.participantId]) {
            houseScoreMap[result.participantId].totalScore += score;
            if (result.placement === 1) {
              houseScoreMap[result.participantId].eventsWon += 1;
            }

            // Category breakdown
            if (
              !houseScoreMap[result.participantId].categoryBreakdown[
                event.categoryId
              ]
            ) {
              houseScoreMap[result.participantId].categoryBreakdown[
                event.categoryId
              ] = 0;
            }
            houseScoreMap[result.participantId].categoryBreakdown[
              event.categoryId
            ] += score;
          }
        }
      });
    });

    // Sort and set the scores
    const sortedHouseScores = Object.values(houseScoreMap).sort(
      (a, b) => b.totalScore - a.totalScore
    );

    const sortedPlayerScores = Object.values(playerScoreMap).sort(
      (a, b) => b.totalScore - a.totalScore
    );

    setHouseScores(sortedHouseScores);
    setPlayerScores(sortedPlayerScores);
  };

  // Filter players based on selected category
  const getFilteredPlayerScores = (): PlayerScore[] => {
    if (selectedCategoryFilter === "all") {
      return playerScores;
    }

    // First, filter players who belong to the selected category
    const categoryPlayers = players.filter(
      (player) => player.categoryId === selectedCategoryFilter
    );

    if (categoryPlayers.length === 0) {
      return [];
    }

    // Initialize scores for players in the selected category only
    const filteredPlayerScores: { [playerId: string]: PlayerScore } = {};

    categoryPlayers.forEach((player) => {
      const house = houses.find((h) => h.id === player.houseId);
      if (house) {
        filteredPlayerScores[player.id] = {
          playerId: player.id,
          playerName: player.fullName,
          houseId: player.houseId,
          houseName: house.name,
          houseColor: house.colorHex,
          totalScore: 0,
          eventsWon: 0,
        };
      }
    });

    // Calculate scores from all individual events (not just the category events)
    // This gives the total performance of players in the selected category
    const completedEvents = events.filter(
      (event) =>
        event.status === "completed" &&
        event.results &&
        event.type === "individual"
    );

    completedEvents.forEach((event) => {
      if (!event.results) return;

      event.results.forEach((result) => {
        // Only count scores for players in our filtered category
        if (filteredPlayerScores[result.participantId]) {
          const score = event.scoring[result.placement] || 0;
          filteredPlayerScores[result.participantId].totalScore += score;
          if (result.placement === 1) {
            filteredPlayerScores[result.participantId].eventsWon += 1;
          }
        }
      });
    });

    // Sort players in the selected category by score, then alphabetically
    const sortedFiltered = Object.values(filteredPlayerScores).sort((a, b) => {
      // If points are equal, sort alphabetically
      if (a.totalScore === b.totalScore) {
        return a.playerName.localeCompare(b.playerName);
      }
      return b.totalScore - a.totalScore;
    });

    return sortedFiltered;
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.label : "Unknown Category";
  };

  const formatDate = (date?: Date) => {
    if (!date) return "Not scheduled";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const toggleRecentEventExpanded = (eventId: string) => {
    setExpandedRecentEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const toggleUpcomingEventExpanded = (eventId: string) => {
    setExpandedUpcomingEvents((prev) => ({
      ...prev,
      [eventId]: !prev[eventId],
    }));
  };

  const getStats = () => {
    const completedCount = events.filter(
      (e) => e.status === "completed"
    ).length;
    const inProgressCount = events.filter(
      (e) => e.status === "in-progress"
    ).length;
    const scheduledCount = events.filter(
      (e) => e.status === "scheduled"
    ).length;

    return {
      totalEvents: events.length,
      completedEvents: completedCount,
      inProgressEvents: inProgressCount,
      scheduledEvents: scheduledCount,
      totalHouses: houses.length,
      totalPlayers: players.length,
    };
  };

  if (isLoading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ minHeight: "400px" }}
      >
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading dashboard...</span>
          </div>
          <p className="text-muted mt-3">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div
          className="alert alert-danger mx-auto"
          style={{ maxWidth: "400px" }}
        >
          {error}
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container-fluid mobile-spacing-md">
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
          🌟 iFamily Games Dashboard ✨
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
          Track your family's amazing achievements and magical adventures! 🎮
        </p>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-5">
        <div className="col-6 col-md-3">
          <div
            className="family-element"
            style={{
              background:
                "linear-gradient(135deg, var(--primary-color), var(--primary-600))",
              border: "1px solid rgba(139, 95, 255, 0.3)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-6)",
              textAlign: "center",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow:
                "0 8px 32px rgba(139, 95, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                marginBottom: "var(--space-3)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
              }}
            >
              🏘️
            </div>
            <div
              className="h2 mb-2 fw-bold text-white"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {stats.totalHouses}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "500",
              }}
            >
              Houses
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="family-element"
            style={{
              background:
                "linear-gradient(135deg, var(--secondary-color), var(--secondary-600))",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-6)",
              textAlign: "center",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow:
                "0 8px 32px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                marginBottom: "var(--space-3)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
              }}
            >
              👨‍👩‍👧‍👦
            </div>
            <div
              className="h2 mb-2 fw-bold text-white"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {stats.totalPlayers}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "500",
              }}
            >
              Family Members
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="family-element"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-orange), #D97706)",
              border: "1px solid rgba(251, 146, 60, 0.3)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-6)",
              textAlign: "center",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow:
                "0 8px 32px rgba(251, 146, 60, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                marginBottom: "var(--space-3)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
              }}
            >
              🏆
            </div>
            <div
              className="h2 mb-2 fw-bold text-white"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {stats.completedEvents}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "500",
              }}
            >
              Completed
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div
            className="family-element"
            style={{
              background:
                "linear-gradient(135deg, var(--accent-purple), #7C3AED)",
              border: "1px solid rgba(167, 139, 250, 0.3)",
              borderRadius: "var(--radius-2xl)",
              padding: "var(--space-6)",
              textAlign: "center",
              minHeight: "140px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              boxShadow:
                "0 8px 32px rgba(167, 139, 250, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                fontSize: "clamp(2.5rem, 5vw, 3.5rem)",
                marginBottom: "var(--space-3)",
                filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
              }}
            >
              🗓️
            </div>
            <div
              className="h2 mb-2 fw-bold text-white"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {stats.scheduledEvents}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "rgba(255, 255, 255, 0.9)",
                fontWeight: "500",
              }}
            >
              Coming Up
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* House Leaderboard */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100"
            style={{
              background: "var(--bg-elevated)",
              border: "2px solid var(--border-accent)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              className="card-header"
              style={{
                background:
                  "linear-gradient(135deg, var(--primary-bg), var(--bg-surface))",
                borderBottom: "2px solid var(--primary-color)",
                padding: "var(--space-5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="d-flex align-items-center mobile-gap-md">
                <span style={{ fontSize: "2rem" }}>🏘️</span>
                <div>
                  <h5
                    className="mb-1 fw-bold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    House Leaders
                  </h5>
                  <p
                    className="mb-0"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    Top scoring family teams
                  </p>
                </div>
              </div>
              {houseScores.length > 0 && (
                <div className="d-flex align-items-center mobile-gap-sm">
                  <div
                    className="position-badge"
                    style={{
                      background: houseScores[0].houseColor,
                      width: "32px",
                      height: "32px",
                      fontSize: "1rem",
                    }}
                  >
                    🥇
                  </div>
                  <span
                    className="fw-bold"
                    style={{
                      fontSize: "var(--font-size-lg)",
                      color: "var(--primary-color)",
                    }}
                  >
                    {houseScores[0].totalScore}
                  </span>
                </div>
              )}
            </div>
            <div className="card-body" style={{ padding: "var(--space-5)" }}>
              {houseScores.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    🏠
                  </div>
                  <h5
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    Ready for Action!
                  </h5>
                  <p style={{ color: "var(--text-muted)" }}>
                    Houses will appear here once events begin. Let the games
                    begin! 🎆
                  </p>
                </div>
              ) : (
                <div
                  className="d-flex flex-column"
                  style={{ gap: "var(--space-4)" }}
                >
                  {houseScores.slice(0, 3).map((houseScore, index) => (
                    <div
                      key={houseScore.houseId}
                      className="family-element"
                      style={{
                        background:
                          index === 0
                            ? "linear-gradient(135deg, var(--accent-yellow), rgba(252, 211, 77, 0.2))"
                            : index === 1
                            ? "linear-gradient(135deg, var(--border-light), rgba(209, 213, 219, 0.2))"
                            : index === 2
                            ? "linear-gradient(135deg, rgba(146, 64, 14, 0.3), rgba(180, 83, 9, 0.1))"
                            : "var(--bg-surface)",
                        border: `2px solid ${
                          index < 3
                            ? index === 0
                              ? "var(--accent-yellow)"
                              : index === 1
                              ? "var(--border-light)"
                              : "#B45309"
                            : "var(--border-color)"
                        }`,
                        borderRadius: "var(--radius-xl)",
                        padding: "var(--space-5)",
                        boxShadow:
                          index < 3
                            ? "0 8px 25px rgba(0,0,0,0.15)"
                            : "0 4px 15px rgba(0,0,0,0.1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center mobile-gap-md">
                          <div
                            className="position-badge"
                            style={{
                              background: houseScore.houseColor,
                              width: "56px",
                              height: "56px",
                              fontSize: "1.5rem",
                              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                            }}
                          >
                            {index === 0
                              ? "🥇"
                              : index === 1
                              ? "🥈"
                              : index === 2
                              ? "🥉"
                              : index + 1}
                          </div>
                          <div>
                            <h5
                              className="mb-1 fw-bold"
                              style={{
                                color: "var(--text-primary)",
                                fontFamily: "Fredoka, sans-serif",
                              }}
                            >
                              {houseScore.houseName}
                            </h5>
                            <div className="d-flex align-items-center mobile-gap-sm">
                              <span
                                className="badge"
                                style={{
                                  background: "var(--success-color)",
                                  color: "white",
                                  fontSize: "var(--font-size-xs)",
                                }}
                              >
                                🏆 {houseScore.eventsWon} wins
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-end">
                          <div
                            className="h2 mb-1 fw-bold"
                            style={{
                              color: "var(--accent-yellow)",
                              fontFamily: "Fredoka, sans-serif",
                              textShadow: "0 0 15px rgba(252, 211, 77, 0.5)",
                              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                            }}
                          >
                            {houseScore.totalScore}
                          </div>
                          <small
                            style={{
                              color: "var(--text-primary)",
                              fontWeight: "600",
                              fontSize: "var(--font-size-sm)",
                            }}
                          >
                            total points
                          </small>
                        </div>
                      </div>

                      {/* Enhanced magical effects for top 3 */}
                      {index < 3 && (
                        <>
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              fontSize: "2rem",
                              animation: "twinkle 2s infinite",
                              filter:
                                "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                            }}
                          >
                            ✨
                          </div>
                          <div
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              fontSize: "1.2rem",
                              animation: "twinkle 2s infinite",
                              animationDelay: "1s",
                              filter:
                                "drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))",
                            }}
                          >
                            🌟
                          </div>
                          {index === 0 && (
                            <div
                              style={{
                                position: "absolute",
                                inset: "-4px",
                                background:
                                  "linear-gradient(45deg, var(--accent-yellow)22, transparent, var(--accent-yellow)11)",
                                borderRadius: "var(--radius-xl)",
                                zIndex: -1,
                                animation: "glow-pulse 3s infinite",
                              }}
                            />
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Leaderboard */}
        <div className="col-12 col-lg-6">
          <div
            className="card h-100"
            style={{
              background: "var(--bg-elevated)",
              border: "2px solid var(--border-accent)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              className="card-header"
              style={{
                background:
                  "linear-gradient(135deg, var(--secondary-bg), var(--bg-surface))",
                borderBottom: "2px solid var(--secondary-color)",
                padding: "var(--space-5)",
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="d-flex align-items-center mobile-gap-md">
                  <span style={{ fontSize: "2rem" }}>🌟</span>
                  <div>
                    <h5
                      className="mb-1 fw-bold"
                      style={{
                        color: "var(--text-primary)",
                        fontFamily: "Fredoka, sans-serif",
                      }}
                    >
                      Top Players
                    </h5>
                    <p
                      className="mb-0"
                      style={{
                        color: "var(--text-secondary)",
                        fontSize: "var(--font-size-sm)",
                      }}
                    >
                      Best individual performers
                    </p>
                  </div>
                </div>
                {(() => {
                  const filteredPlayers = getFilteredPlayerScores();
                  return filteredPlayers.length > 0 ? (
                    <div className="d-flex align-items-center mobile-gap-sm">
                      <div
                        className="position-badge"
                        style={{
                          background: filteredPlayers[0].houseColor,
                          width: "32px",
                          height: "32px",
                          fontSize: "1rem",
                        }}
                      >
                        🌟
                      </div>
                      <span
                        className="fw-bold"
                        style={{
                          fontSize: "var(--font-size-lg)",
                          color: "var(--secondary-color)",
                        }}
                      >
                        {filteredPlayers[0].totalScore}
                      </span>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Category Filter */}
              <div className="d-flex align-items-center mobile-gap-sm">
                <label
                  style={{
                    fontSize: "var(--font-size-sm)",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    fontFamily: "Fredoka, sans-serif",
                    marginBottom: 0,
                  }}
                >
                  🏷️ Category:
                </label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="form-select"
                  style={{
                    background: "var(--bg-surface)",
                    border: "2px solid var(--secondary-color)",
                    borderRadius: "var(--radius-lg)",
                    color: "var(--text-primary)",
                    fontSize: "var(--font-size-sm)",
                    fontFamily: "Fredoka, sans-serif",
                    fontWeight: "500",
                    padding: "var(--space-2) var(--space-3)",
                    minWidth: "140px",
                    maxWidth: "200px",
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="card-body" style={{ padding: "var(--space-5)" }}>
              {(() => {
                const filteredPlayers = getFilteredPlayerScores();

                if (filteredPlayers.length === 0) {
                  return (
                    <div className="text-center py-5">
                      <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                        🌟
                      </div>
                      <h5
                        style={{
                          color: "var(--text-secondary)",
                          fontFamily: "Fredoka, sans-serif",
                        }}
                      >
                        {selectedCategoryFilter === "all"
                          ? "Future Stars!"
                          : `No ${
                              categories.find(
                                (c) => c.id === selectedCategoryFilter
                              )?.label
                            } champions yet!`}
                      </h5>
                      <p style={{ color: "var(--text-muted)" }}>
                        {selectedCategoryFilter === "all"
                          ? "Individual achievements will shine here. Who will be the first champion? 🏅"
                          : `Individual achievements in ${
                              categories.find(
                                (c) => c.id === selectedCategoryFilter
                              )?.label
                            } will appear here. 🏅`}
                      </p>
                    </div>
                  );
                }

                return (
                  <div
                    className="d-flex flex-column"
                    style={{ gap: "var(--space-4)" }}
                  >
                    {filteredPlayers.slice(0, 3).map((playerScore, index) => (
                      <div
                        key={playerScore.playerId}
                        className="family-element"
                        style={{
                          background:
                            index === 0
                              ? "linear-gradient(135deg, var(--accent-yellow), rgba(252, 211, 77, 0.2))"
                              : index === 1
                              ? "linear-gradient(135deg, var(--border-light), rgba(209, 213, 219, 0.2))"
                              : index === 2
                              ? "linear-gradient(135deg, rgba(146, 64, 14, 0.3), rgba(180, 83, 9, 0.1))"
                              : "var(--bg-surface)",
                          border: `2px solid ${
                            index < 3
                              ? index === 0
                                ? "var(--accent-yellow)"
                                : index === 1
                                ? "var(--border-light)"
                                : "#B45309"
                              : "var(--border-color)"
                          }`,
                          borderRadius: "var(--radius-xl)",
                          padding: "var(--space-5)",
                          boxShadow:
                            index < 3
                              ? "0 8px 25px rgba(0,0,0,0.15)"
                              : "0 4px 15px rgba(0,0,0,0.1)",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center mobile-gap-md">
                            <div
                              className="position-badge"
                              style={{
                                background: playerScore.houseColor,
                                width: "56px",
                                height: "56px",
                                fontSize: "1.5rem",
                                boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                              }}
                            >
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : index + 1}
                            </div>
                            <div>
                              <h5
                                className="mb-1 fw-bold"
                                style={{
                                  color: "var(--text-primary)",
                                  fontFamily: "Fredoka, sans-serif",
                                }}
                              >
                                {playerScore.playerName}
                              </h5>
                              <div className="d-flex align-items-center mobile-gap-sm flex-wrap">
                                <span
                                  className="badge"
                                  style={{
                                    background: playerScore.houseColor,
                                    color: "white",
                                    fontSize: "var(--font-size-xs)",
                                  }}
                                >
                                  {playerScore.houseName}
                                </span>
                                <span
                                  className="badge"
                                  style={{
                                    background: "var(--success-color)",
                                    color: "white",
                                    fontSize: "var(--font-size-xs)",
                                  }}
                                >
                                  🏆 {playerScore.eventsWon} wins
                                </span>
                                {selectedCategoryFilter !== "all" && (
                                  <span
                                    className="badge"
                                    style={{
                                      background: "var(--info-color)",
                                      color: "white",
                                      fontSize: "var(--font-size-xs)",
                                    }}
                                  >
                                    {
                                      categories.find(
                                        (c) => c.id === selectedCategoryFilter
                                      )?.label
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-end">
                            <div
                              className="h2 mb-1 fw-bold"
                              style={{
                                color: "var(--accent-yellow)",
                                fontFamily: "Fredoka, sans-serif",
                                textShadow: "0 0 15px rgba(252, 211, 77, 0.5)",
                                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                              }}
                            >
                              {playerScore.totalScore}
                            </div>
                            <small
                              style={{
                                color: "var(--text-primary)",
                                fontWeight: "600",
                                fontSize: "var(--font-size-sm)",
                              }}
                            >
                              {selectedCategoryFilter === "all"
                                ? "total points"
                                : "category points"}
                            </small>
                          </div>
                        </div>

                        {/* Enhanced magical effects for top performers */}
                        {index < 3 && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                top: "12px",
                                right: "12px",
                                fontSize: "2rem",
                                animation: "twinkle 2s infinite",
                                animationDelay: `${index * 0.3}s`,
                                filter:
                                  "drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))",
                              }}
                            >
                              🌟
                            </div>
                            <div
                              style={{
                                position: "absolute",
                                top: "8px",
                                left: "8px",
                                fontSize: "1.2rem",
                                animation: "twinkle 2s infinite",
                                animationDelay: `${index * 0.3 + 1}s`,
                                filter:
                                  "drop-shadow(0 0 6px rgba(255, 255, 255, 0.6))",
                              }}
                            >
                              ✨
                            </div>
                            {index === 0 && (
                              <div
                                style={{
                                  position: "absolute",
                                  inset: "-4px",
                                  background:
                                    "linear-gradient(45deg, var(--accent-yellow)22, transparent, var(--accent-yellow)11)",
                                  borderRadius: "var(--radius-xl)",
                                  zIndex: -1,
                                  animation: "glow-pulse 3s infinite",
                                }}
                              />
                            )}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Victory Chronicles */}
        <div className="col-12">
          <div
            className="card h-100"
            style={{
              background: "var(--bg-elevated)",
              border: "2px solid var(--border-accent)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              className="card-header"
              style={{
                background:
                  "linear-gradient(135deg, var(--success-bg), var(--bg-surface))",
                borderBottom: "2px solid var(--success-color)",
                padding: "var(--space-5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="d-flex align-items-center mobile-gap-md">
                <span style={{ fontSize: "2rem" }}>🎆</span>
                <div>
                  <h5
                    className="mb-1 fw-bold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    Recent Wins
                  </h5>
                  <p
                    className="mb-0"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    Recently completed activities
                  </p>
                </div>
              </div>
              {recentEvents.length > 0 && (
                <span
                  className="badge"
                  style={{
                    background: "var(--success-color)",
                    color: "white",
                    fontSize: "var(--font-size-sm)",
                    padding: "var(--space-2) var(--space-4)",
                  }}
                >
                  🏆 {recentEvents.length} completed
                </span>
              )}
            </div>
            <div className="card-body" style={{ padding: "var(--space-5)" }}>
              {recentEvents.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    🎆
                  </div>
                  <h5
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    Victory Awaits!
                  </h5>
                  <p style={{ color: "var(--text-muted)" }}>
                    Completed activities will appear here. ✨
                  </p>
                </div>
              ) : (
                <div
                  className="d-flex flex-column"
                  style={{ gap: "var(--space-4)" }}
                >
                  {recentEvents.map((event) => {
                    const isExpanded = expandedRecentEvents[event.id] || false;

                    return (
                      <ExpandableRow
                        key={event.id}
                        accentColor="var(--success-color)"
                        isExpanded={isExpanded}
                        onToggle={() => toggleRecentEventExpanded(event.id)}
                        previewContent={
                          <div className="d-flex align-items-center justify-content-between w-100">
                            <div className="d-flex align-items-center mobile-gap-md flex-grow-1">
                              <div
                                style={{
                                  background: "var(--success-color)",
                                  borderRadius: "var(--radius-full)",
                                  width: "48px",
                                  height: "48px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.5rem",
                                  boxShadow:
                                    "0 4px 15px rgba(16, 185, 129, 0.3)",
                                }}
                              >
                                🏆
                              </div>
                              <div className="min-width-0 flex-grow-1">
                                <h6
                                  className="mb-1 fw-bold"
                                  style={{
                                    color: "var(--text-primary)",
                                    fontFamily: "Fredoka, sans-serif",
                                  }}
                                >
                                  {event.name}
                                </h6>
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
                                  {isExpanded && (
                                    <>
                                      <span
                                        className="badge"
                                        style={{
                                          background: "var(--info-color)",
                                          color: "white",
                                          fontSize: "var(--font-size-xs)",
                                        }}
                                      >
                                        {event.type === "individual"
                                          ? "👤 Individual"
                                          : "👥 Team Event"}
                                      </span>
                                      <span
                                        className="badge"
                                        style={{
                                          background: "var(--success-color)",
                                          color: "white",
                                          fontSize: "var(--font-size-xs)",
                                        }}
                                      >
                                        ✅ Completed
                                      </span>
                                    </>
                                  )}
                                  <small style={{ color: "var(--text-muted)" }}>
                                    {formatDate(event.endTime)}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        {/* Simplified detailed information */}
                        <div
                          className="d-flex flex-column"
                          style={{ gap: "var(--space-3)" }}
                        >
                          {event.results && event.results.length > 0 && (
                            <div
                              className="p-3 rounded"
                              style={{
                                background: "var(--bg-elevated)",
                                border: "1px solid var(--success-color)",
                              }}
                            >
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
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
                                    Champion:
                                  </span>
                                </div>
                                <div className="text-end">
                                  {(() => {
                                    const winner = event.results.find(
                                      (r) => r.placement === 1
                                    );
                                    if (!winner) return "No winner recorded";

                                    const winnerName =
                                      event.type === "individual"
                                        ? players.find(
                                            (p) => p.id === winner.participantId
                                          )?.fullName || "Unknown Player"
                                        : houses.find(
                                            (h) => h.id === winner.participantId
                                          )?.name || "Unknown House";
                                    const score =
                                      event.scoring[winner.placement] || 0;

                                    return (
                                      <div>
                                        <div
                                          className="fw-bold"
                                          style={{
                                            color: "var(--success-color)",
                                          }}
                                        >
                                          {winnerName}
                                        </div>
                                        <small
                                          style={{ color: "var(--text-muted)" }}
                                        >
                                          {score} points
                                        </small>
                                      </div>
                                    );
                                  })()}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-center">
                            <small
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "var(--font-size-xs)",
                              }}
                            >
                              🕰️ Completed {formatDate(event.endTime)}
                            </small>
                          </div>
                        </div>
                      </ExpandableRow>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Adventures */}
        <div className="col-12">
          <div
            className="card h-100"
            style={{
              background: "var(--bg-elevated)",
              border: "2px solid var(--border-accent)",
              borderRadius: "var(--radius-2xl)",
              boxShadow: "0 8px 25px rgba(0, 0, 0, 0.15)",
            }}
          >
            <div
              className="card-header"
              style={{
                background:
                  "linear-gradient(135deg, var(--info-bg), var(--bg-surface))",
                borderBottom: "2px solid var(--info-color)",
                padding: "var(--space-5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div className="d-flex align-items-center mobile-gap-md">
                <span style={{ fontSize: "2rem" }}>🌠</span>
                <div>
                  <h5
                    className="mb-1 fw-bold"
                    style={{
                      color: "var(--text-primary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    Coming Up
                  </h5>
                  <p
                    className="mb-0"
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--font-size-sm)",
                    }}
                  >
                    Upcoming events and challenges
                  </p>
                </div>
              </div>
              {upcomingEvents.length > 0 && (
                <div className="d-flex align-items-center mobile-gap-sm">
                  {upcomingEvents.filter((e) => e.status === "in-progress")
                    .length > 0 && (
                    <span
                      className="badge"
                      style={{
                        background: "var(--warning-color)",
                        color: "white",
                        fontSize: "var(--font-size-xs)",
                        animation: "pulse 2s infinite",
                      }}
                    >
                      🔥 LIVE
                    </span>
                  )}
                  <span
                    className="badge"
                    style={{
                      background: "var(--info-color)",
                      color: "white",
                      fontSize: "var(--font-size-sm)",
                      padding: "var(--space-2) var(--space-4)",
                    }}
                  >
                    📅 {upcomingEvents.length} upcoming
                  </span>
                </div>
              )}
            </div>
            <div className="card-body" style={{ padding: "var(--space-5)" }}>
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-5">
                  <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>
                    🌠
                  </div>
                  <h5
                    style={{
                      color: "var(--text-secondary)",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    Adventure Awaits!
                  </h5>
                  <p style={{ color: "var(--text-muted)" }}>
                    Upcoming events will appear here. 🌈
                  </p>
                </div>
              ) : (
                <div
                  className="d-flex flex-column"
                  style={{ gap: "var(--space-4)" }}
                >
                  {upcomingEvents.map((event) => {
                    const isLive = event.status === "in-progress";
                    const accentColor = isLive
                      ? "var(--warning-color)"
                      : "var(--info-color)";
                    const isExpanded =
                      expandedUpcomingEvents[event.id] || false;

                    return (
                      <ExpandableRow
                        key={event.id}
                        accentColor={accentColor}
                        isExpanded={isExpanded}
                        onToggle={() => toggleUpcomingEventExpanded(event.id)}
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
                                  animation: isLive
                                    ? "pulse 2s infinite"
                                    : "none",
                                }}
                              >
                                {isLive ? "🔥" : "📅"}
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
                                  {isExpanded && (
                                    <>
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
                                          : "👥 Team Challenge"}
                                      </span>
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
                                        {isLive
                                          ? "🔥 HAPPENING NOW!"
                                          : "🕰️ Scheduled"}
                                      </span>
                                    </>
                                  )}
                                  <small style={{ color: "var(--text-muted)" }}>
                                    {isLive ? "Started:" : "Scheduled:"}{" "}
                                    {formatDate(event.startTime)}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        {/* Simplified detailed information for upcoming events */}
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
                            <div className="d-flex align-items-center justify-content-between">
                              <div>
                                <span
                                  style={{
                                    fontSize: "1.5rem",
                                    marginRight: "var(--space-2)",
                                  }}
                                >
                                  🕰️
                                </span>
                                <span
                                  className="fw-bold"
                                  style={{
                                    color: "var(--text-primary)",
                                    fontFamily: "Fredoka, sans-serif",
                                  }}
                                >
                                  {isLive ? "Started:" : "Begins:"}
                                </span>
                              </div>
                              <div className="text-end">
                                <div
                                  className="fw-bold"
                                  style={{
                                    color: accentColor,
                                    fontFamily: "Fredoka, sans-serif",
                                  }}
                                >
                                  {formatDate(event.startTime)}
                                </div>
                                <small style={{ color: "var(--text-muted)" }}>
                                  {event.type === "individual"
                                    ? "Individual event"
                                    : "Team challenge"}
                                </small>
                              </div>
                            </div>
                          </div>

                          {isLive && (
                            <div
                              className="text-center p-3 rounded"
                              style={{
                                background:
                                  "linear-gradient(135deg, var(--warning-color), #F59E0B)",
                                color: "white",
                                animation: "glow-pulse 3s infinite",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "1.5rem",
                                  marginRight: "var(--space-2)",
                                }}
                              >
                                🎉
                              </span>
                              <span
                                className="fw-bold"
                                style={{ fontFamily: "Fredoka, sans-serif" }}
                              >
                                Join the excitement - this is happening now!
                              </span>
                            </div>
                          )}

                          <div className="text-center">
                            <small
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "var(--font-size-xs)",
                              }}
                            >
                              🎆 Get ready for family fun!
                            </small>
                          </div>
                        </div>
                      </ExpandableRow>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
