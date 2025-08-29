import { useState, useEffect } from "react";
import { Event, EventResult, Player, House } from "../../types";
import {
  eventRepository,
  playerRepository,
  houseRepository,
} from "../../database";

interface ResultsRecordingModalProps {
  event: Event;
  onClose: () => void;
  onSave: () => void;
}

const ResultsRecordingModal: React.FC<ResultsRecordingModalProps> = ({
  event,
  onClose,
  onSave,
}) => {
  const [participants, setParticipants] = useState<(Player | House)[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Removed expandedPlacements state - not needed for ResultsRecordingModal

  // Load participants based on event type
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let participantsList: (Player | House)[] = [];

        if (event.type === "individual") {
          // Load players from the event's category
          participantsList = await playerRepository.getPlayersByCategory(
            event.categoryId
          );
        } else {
          // Load all houses for group events
          participantsList = await houseRepository.getAllHouses();
        }

        setParticipants(participantsList);

        // Initialize results - pre-populate all placements from event scoring
        if (event.results && event.results.length > 0) {
          // Use existing results
          setResults([...event.results]);
        } else {
          // Pre-populate all placements based on event scoring
          const availablePlacements = Object.keys(event.scoring)
            .map(Number)
            .sort((a, b) => a - b);
          const prepopulatedResults = availablePlacements.map((placement) => ({
            placement,
            participantId: "", // No participant selected initially
          }));
          setResults(prepopulatedResults);
        }
      } catch (err) {
        console.error("Error loading participants:", err);
        setError("Failed to load participants");
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();
  }, [event]);

  const getScoreForPlacement = (placement: number) => {
    return event.scoring[placement] || 0;
  };

  const isParticipantSelected = (participantId: string) => {
    return results.some((r) => r.participantId === participantId);
  };

  const updateParticipantForPlacement = (
    placement: number,
    participantId: string
  ) => {
    const newResults = results.map((result) =>
      result.placement === placement ? { ...result, participantId } : result
    );
    setResults(newResults);
  };

  const validateResults = () => {
    // Filter out results where no participant is selected
    const assignedResults = results.filter((r) => r.participantId !== "");

    if (assignedResults.length === 0) {
      return "At least one placement must be assigned";
    }

    // Check for duplicate participants
    const participantIds = assignedResults.map((r) => r.participantId);
    const uniqueIds = new Set(participantIds);
    if (uniqueIds.size !== participantIds.length) {
      return "Each participant can only be assigned to one placement";
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateResults();
    if (validationError) {
      alert(validationError);
      return;
    }

    try {
      setIsSaving(true);
      // Only save results where participants are assigned
      const assignedResults = results.filter((r) => r.participantId !== "");
      await eventRepository.completeEvent(event.id, assignedResults);
      onSave();
    } catch (err) {
      console.error("Error saving results:", err);
      if (err instanceof Error) {
        alert(`Failed to save results: ${err.message}`);
      } else {
        alert("Failed to save results");
      }
    } finally {
      setIsSaving(false);
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
            🎯
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
            Loading participants... ✨
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
    <>
      <div
        className="modal-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="modal-content-wrapper"
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="container-fluid mobile-spacing-md"
            style={{
              minHeight: "100vh",
              background: "var(--bg-primary)",
              paddingTop: "var(--space-4)",
              paddingBottom: "var(--space-4)",
              flex: 1,
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
                📝 Record Results ✨
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
                {event.name} •{" "}
                {event.type === "individual" ? "👤 Individual" : "👥 Group"}{" "}
                Event
              </p>

              <div className="d-flex justify-content-center gap-3 flex-wrap mt-4">
                <button
                  onClick={onClose}
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
                  ❌ Cancel
                </button>

                <button
                  onClick={handleSave}
                  className="btn family-element"
                  disabled={
                    isSaving ||
                    results.filter((r) => r.participantId !== "").length === 0
                  }
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
                    opacity:
                      isSaving ||
                      results.filter((r) => r.participantId !== "").length === 0
                        ? "0.5"
                        : "1",
                    cursor:
                      isSaving ||
                      results.filter((r) => r.participantId !== "").length === 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {isSaving ? (
                    <>
                      <div
                        style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite",
                          display: "inline-block",
                          marginRight: "var(--space-2)",
                        }}
                      ></div>
                      Saving...
                    </>
                  ) : (
                    <>🏁 Complete Event</>
                  )}
                </button>
              </div>
            </div>

            {/* Instructions */}
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
                <div className="text-center">
                  <h5
                    className="card-title mb-1"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    💡 Instructions
                  </h5>
                  <p
                    className="mb-0"
                    style={{
                      opacity: "0.9",
                      fontFamily: "Fredoka, sans-serif",
                    }}
                  >
                    Select participants for each placement. Leave unassigned if
                    no one earned that position.
                  </p>
                </div>
              </div>
            </div>

            {/* No Participants Warning */}
            {participants.length === 0 ? (
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
                  ⚠️
                </div>
                <h4
                  style={{
                    color: "var(--text-secondary)",
                    marginBottom: "var(--space-3)",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  No Participants Available
                </h4>
                <p
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "var(--font-size-lg)",
                    marginBottom: "var(--space-4)",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  {event.type === "individual"
                    ? "No players found in this category. Please add players first."
                    : "No houses found. Please create houses first."}
                </p>
                <button
                  onClick={onClose}
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
                  🔙 Go Back
                </button>
              </div>
            ) : (
              /* Results/Placements List - Following HouseManagement pattern */
              <div
                className="d-flex flex-column"
                style={{ gap: "var(--space-4)" }}
              >
                {results.map((result) => {
                  const medalEmoji =
                    result.placement === 1
                      ? "🥇"
                      : result.placement === 2
                      ? "🥈"
                      : result.placement === 3
                      ? "🥉"
                      : "🏅";
                  const placementColor =
                    result.placement === 1
                      ? "#FFD700"
                      : result.placement === 2
                      ? "#C0C0C0"
                      : result.placement === 3
                      ? "#CD7F32"
                      : "#8B9DC3";

                  return (
                    <div
                      key={result.placement}
                      className="family-element"
                      style={{
                        background: `linear-gradient(135deg, ${placementColor}15, ${placementColor}05)`,
                        border: `2px solid ${placementColor}44`,
                        borderRadius: "var(--radius-xl)",
                        boxShadow: `0 4px 20px ${placementColor}22`,
                        position: "relative",
                        overflow: "hidden",
                        transition:
                          "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(-2px) scale(1.02)";
                        e.currentTarget.style.boxShadow = `0 12px 35px ${placementColor}33`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform =
                          "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = `0 4px 20px ${placementColor}22`;
                      }}
                    >
                      {/* Main placement row */}
                      <div
                        className="d-flex align-items-center justify-content-between"
                        style={{ padding: "var(--space-5)" }}
                      >
                        <div className="d-flex align-items-center mobile-gap-md">
                          {/* Medal/Placement Icon */}
                          <div
                            className="position-badge"
                            style={{
                              background: placementColor,
                              width: "56px",
                              height: "56px",
                              fontSize: "1.5rem",
                              boxShadow: `0 4px 15px ${placementColor}44`,
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: "3px solid rgba(255,255,255,0.3)",
                            }}
                          >
                            {medalEmoji}
                          </div>

                          {/* Placement Details */}
                          <div style={{ flexGrow: 1, minWidth: 0 }}>
                            <h6
                              className="mb-1 fw-bold"
                              style={{
                                color: "var(--text-primary)",
                                fontFamily: "Fredoka, sans-serif",
                                fontSize: "clamp(1.3rem, 4vw, 1.5rem)",
                              }}
                            >
                              {result.placement === 1
                                ? "1st Place"
                                : result.placement === 2
                                ? "2nd Place"
                                : result.placement === 3
                                ? "3rd Place"
                                : `${result.placement}th Place`}
                            </h6>
                            <div className="d-flex align-items-center mobile-gap-sm flex-wrap">
                              <span
                                className="badge"
                                style={{
                                  background: "var(--accent-purple)",
                                  color: "white",
                                  fontSize: "var(--font-size-xs)",
                                }}
                              >
                                🏆 {getScoreForPlacement(result.placement)}{" "}
                                points
                              </span>
                              {result.participantId && (
                                <span
                                  className="badge"
                                  style={{
                                    background: "var(--success-color)",
                                    color: "white",
                                    fontSize: "var(--font-size-xs)",
                                  }}
                                >
                                  ✅ Assigned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Participant Selection */}
                        <div className="text-end" style={{ minWidth: "200px" }}>
                          <select
                            value={result.participantId}
                            onChange={(e) =>
                              updateParticipantForPlacement(
                                result.placement,
                                e.target.value
                              )
                            }
                            className="form-select"
                            style={{
                              padding: "var(--space-4)",
                              fontSize: "var(--font-size-lg)",
                              borderRadius: "var(--radius-xl)",
                              border: "2px solid var(--border-color)",
                              background: "var(--bg-surface)",
                              color: "var(--text-primary)",
                              fontFamily: "Fredoka, sans-serif",
                              minWidth: "200px",
                            }}
                          >
                            <option value="">Select participant</option>
                            {participants.map((participant) => {
                              const isSelected =
                                isParticipantSelected(participant.id) &&
                                participant.id !== result.participantId;
                              return (
                                <option
                                  key={participant.id}
                                  value={participant.id}
                                  disabled={isSelected}
                                >
                                  {"fullName" in participant
                                    ? participant.fullName
                                    : participant.name}
                                  {isSelected ? " (already assigned)" : ""}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Spacing */}
            <div style={{ height: "2rem" }}></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResultsRecordingModal;
