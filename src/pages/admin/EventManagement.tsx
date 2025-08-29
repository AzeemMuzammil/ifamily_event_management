import { useState, useEffect } from "react";
import { Event, EventType, EventStatus, Category } from "../../types";
import {
  eventRepository,
  categoryRepository,
  configRepository,
} from "../../database";
import ResultsRecordingModal from "../../components/admin/ResultsRecordingModal";
import ExpandableRow from "../../components/ExpandableRow";

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedEventForResults, setSelectedEventForResults] =
    useState<Event | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | Event["status"]>(
    "all"
  );
  const [categoryFilter, setCategoryFilter] = useState<"all" | string>("all");
  const [typeFilter, setTypeFilter] = useState<"all" | Event["type"]>("all");

  // Form state
  const [eventName, setEventName] = useState("");
  const [eventType, setEventType] = useState<EventType>("individual");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [scoringConfig, setScoringConfig] = useState<{
    [placement: number]: number;
  }>({
    1: 5,
    2: 3,
    3: 1,
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribeEvents = eventRepository.subscribeToAllEvents(
      (eventsData) => {
        setEvents(eventsData);
      }
    );

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories(
      (categoriesData) => {
        setCategories(categoriesData);
      }
    );

    setIsLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeEvents();
      unsubscribeCategories();
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [eventsData, categoriesData] = await Promise.all([
        eventRepository.getAllEvents(),
        categoryRepository.getAllCategories(),
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  };

  // Load placement configuration for a category and event type
  const loadPlacementConfig = async (
    categoryId: string,
    eventType: EventType
  ) => {
    try {
      const config = await configRepository.getPlacementConfig(
        categoryId,
        eventType
      );
      if (config && config.placements) {
        setScoringConfig(config.placements);
      } else {
        // Use default if no config exists
        setScoringConfig({ 1: 5, 2: 3, 3: 1 });
      }
    } catch (error) {
      console.error("Error loading placement config:", error);
      // Use default on error
      setScoringConfig({ 1: 5, 2: 3, 3: 1 });
    }
  };

  const resetForm = () => {
    setEventName("");
    setEventType("individual");
    setSelectedCategoryId("");
    setScoringConfig({ 1: 5, 2: 3, 3: 1 });
    setEditingEvent(null);
    setShowCreateForm(false);
  };

  // Load placement config when category or event type changes (only for new events, not when editing)
  useEffect(() => {
    if (!editingEvent && selectedCategoryId && eventType) {
      loadPlacementConfig(selectedCategoryId, eventType);
    }
  }, [selectedCategoryId, eventType, editingEvent]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eventName.trim() || !selectedCategoryId || !eventType) {
      alert("Please fill in all required fields");
      return;
    }

    if (Object.keys(scoringConfig).length === 0) {
      alert("Please configure at least one scoring placement");
      return;
    }

    // Validate scoring configuration - ensure all values are positive numbers
    const invalidScoring = Object.entries(scoringConfig).find(
      ([_, points]) => !Number.isInteger(points) || points < 0
    );

    if (invalidScoring) {
      alert("Please ensure all scoring values are valid positive numbers");
      return;
    }

    try {
      // Check if event name is already taken
      const nameTaken = await eventRepository.isEventNameTaken(
        eventName,
        editingEvent?.id
      );

      if (nameTaken) {
        alert(
          "An event with this name already exists. Please choose a different name."
        );
        return;
      }

      const eventData = {
        name: eventName.trim(),
        type: eventType,
        categoryId: selectedCategoryId,
        status: "scheduled" as EventStatus,
        scoring: scoringConfig,
      };

      if (editingEvent) {
        await eventRepository.updateEvent(editingEvent.id, eventData);
      } else {
        await eventRepository.createEvent(eventData);
      }

      resetForm();
    } catch (err) {
      console.error("Error saving event:", err);
      if (err instanceof Error) {
        alert(`Failed to save event: ${err.message}`);
      } else {
        alert("Failed to save event");
      }
    }
  };

  const handleEditEvent = (event: Event) => {
    setEventName(event.name);
    setEventType(event.type);
    setSelectedCategoryId(event.categoryId);
    setScoringConfig(event.scoring);
    setEditingEvent(event);
    setShowCreateForm(true);
  };

  const handleStartEvent = async (event: Event) => {
    if (!confirm(`Are you sure you want to start "${event.name}"?`)) {
      return;
    }

    try {
      await eventRepository.startEvent(event.id);
    } catch (err) {
      console.error("Error starting event:", err);
      if (err instanceof Error) {
        alert(`Failed to start event: ${err.message}`);
      } else {
        alert("Failed to start event");
      }
    }
  };

  const handleCompleteEvent = async (event: Event) => {
    setSelectedEventForResults(event);
    setShowResultsModal(true);
  };

  const handleResetEvent = async (event: Event) => {
    if (
      !confirm(
        `Are you sure you want to reset "${event.name}" back to scheduled status? This will clear all progress and results.`
      )
    ) {
      return;
    }

    try {
      await eventRepository.resetEvent(event.id);
    } catch (err) {
      console.error("Error resetting event:", err);
      if (err instanceof Error) {
        alert(`Failed to reset event: ${err.message}`);
      } else {
        alert("Failed to reset event");
      }
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (
      !confirm(
        `Are you sure you want to delete "${event.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await eventRepository.deleteEvent(event.id);
    } catch (err) {
      console.error("Error deleting event:", err);
      if (err instanceof Error) {
        alert(`Failed to delete event: ${err.message}`);
      } else {
        alert("Failed to delete event");
      }
    }
  };

  const addScoringPlacement = () => {
    const maxPlacement = Math.max(...Object.keys(scoringConfig).map(Number), 0);
    setScoringConfig({
      ...scoringConfig,
      [maxPlacement + 1]: 1,
    });
  };

  const removeScoringPlacement = (placement: number) => {
    const newConfig = { ...scoringConfig };
    delete newConfig[placement];
    setScoringConfig(newConfig);
  };

  const updateScoringPoints = (placement: number, points: number) => {
    setScoringConfig({
      ...scoringConfig,
      [placement]: Math.max(0, points), // Ensure non-negative points
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.label || "Unknown";
  };

  // Helper function to get emoji for category
  const getCategoryEmoji = () => {
    return "🏷️"; // All categories use the same tag emoji
  };

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const formatDateTime = (date: Date | undefined) => {
    if (!date) return "Not set";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
            🎪
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
            Loading event studio... ✨
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
          <button
            onClick={loadData}
            className="btn family-element mt-3"
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              color: "white",
              border: "2px solid rgba(255, 255, 255, 0.3)",
              borderRadius: "var(--radius-xl)",
              padding: "var(--space-3) var(--space-5)",
              fontWeight: "600",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            🔄 Try Again
          </button>
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
          🎪 Event Studio ✨
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
          Create, manage, and run your family's amazing activities! 🏆
        </p>

        <button
          onClick={() => setShowCreateForm(true)}
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
          Create New Event
        </button>
      </div>

      {/* Filters Section */}
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

      {/* Create/Edit Event Form */}
      {showCreateForm && (
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
                  {editingEvent ? "✏️ Edit Event" : "🎯 Create New Event"}
                </h5>
                <p
                  className="mb-0"
                  style={{
                    opacity: "0.9",
                    fontFamily: "Fredoka, sans-serif",
                  }}
                >
                  {editingEvent
                    ? "Update event details and scoring configuration"
                    : "Create a new family event with custom scoring system"}
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
            <form onSubmit={handleCreateEvent}>
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
                    🎯 Event Name
                  </label>
                  <input
                    type="text"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    className="form-control"
                    placeholder="Enter event name (e.g., Swimming Race, Chess Tournament)"
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
                    👥 Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="form-select"
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
                    <option value="individual">
                      👤 Individual Competition
                    </option>
                    <option value="group">👥 Group/Team Event</option>
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
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
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
                        {getCategoryEmoji()} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label
                      className="form-label fw-bold mb-0"
                      style={{
                        color: "var(--text-primary)",
                        fontSize: "1.1rem",
                        fontFamily: "Fredoka, sans-serif",
                      }}
                    >
                      🏆 Scoring Configuration
                    </label>
                    <button
                      type="button"
                      onClick={addScoringPlacement}
                      className="btn family-element"
                      style={{
                        background: "var(--bg-surface)",
                        color: "var(--primary-color)",
                        border: "2px solid var(--primary-color)",
                        borderRadius: "var(--radius-xl)",
                        padding: "var(--space-2) var(--space-4)",
                        fontWeight: "600",
                        fontSize: "var(--font-size-sm)",
                        fontFamily: "Fredoka, sans-serif",
                      }}
                    >
                      ➕ Add Placement
                    </button>
                  </div>

                  <div className="row g-3">
                    {Object.entries(scoringConfig)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([placement, points]) => (
                        <div key={placement} className="col-sm-6 col-md-4">
                          <div
                            className="card"
                            style={{
                              background: "var(--bg-surface)",
                              border: "2px solid var(--border-color)",
                              borderRadius: "var(--radius-xl)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              className="card-body"
                              style={{ padding: "var(--space-4)" }}
                            >
                              <div className="d-flex align-items-center gap-3">
                                <div
                                  className="text-center position-badge"
                                  style={{
                                    background:
                                      placement === "1"
                                        ? "var(--warning-color)"
                                        : placement === "2"
                                        ? "#C0C0C0"
                                        : placement === "3"
                                        ? "#CD7F32"
                                        : "var(--info-color)",
                                    width: "40px",
                                    height: "40px",
                                    fontSize: "1.2rem",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "white",
                                    fontWeight: "700",
                                    fontFamily: "Fredoka, sans-serif",
                                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                                  }}
                                >
                                  {placement === "1"
                                    ? "🥇"
                                    : placement === "2"
                                    ? "🥈"
                                    : placement === "3"
                                    ? "🥉"
                                    : `#${placement}`}
                                </div>
                                <div className="flex-grow-1">
                                  <div
                                    className="d-flex align-items-center"
                                    style={{
                                      border: "2px solid var(--border-color)",
                                      borderRadius: "var(--radius-lg)",
                                      background: "var(--bg-elevated)",
                                      padding: "0",
                                      overflow: "hidden",
                                    }}
                                  >
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={points}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        // Allow numbers only, including empty string for editing
                                        if (
                                          value === "" ||
                                          /^\d+$/.test(value)
                                        ) {
                                          updateScoringPoints(
                                            Number(placement),
                                            value === "" ? 0 : Number(value)
                                          );
                                        }
                                      }}
                                      placeholder="0"
                                      required
                                      style={{
                                        border: "none",
                                        background: "transparent",
                                        color: "var(--text-primary)",
                                        fontFamily: "Fredoka, sans-serif",
                                        fontWeight: "600",
                                        borderRadius: "0",
                                        boxShadow: "none",
                                      }}
                                    />
                                    <span
                                      style={{
                                        padding:
                                          "var(--space-3) var(--space-4)",
                                        background: "transparent",
                                        color: "var(--text-secondary)",
                                        fontFamily: "Fredoka, sans-serif",
                                        fontWeight: "500",
                                        borderLeft:
                                          "1px solid var(--border-color)",
                                      }}
                                    >
                                      pts
                                    </span>
                                  </div>
                                </div>
                                {Object.keys(scoringConfig).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeScoringPlacement(Number(placement))
                                    }
                                    className="btn family-element"
                                    style={{
                                      background: "var(--bg-elevated)",
                                      color: "var(--danger-color)",
                                      border: "2px solid var(--danger-color)",
                                      borderRadius: "var(--radius-lg)",
                                      padding: "var(--space-2)",
                                      minHeight: "40px",
                                      minWidth: "40px",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: "1.2rem",
                                      fontWeight: "600",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--danger-color)";
                                      e.currentTarget.style.color = "white";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background =
                                        "var(--bg-elevated)";
                                      e.currentTarget.style.color =
                                        "var(--danger-color)";
                                    }}
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
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
                  disabled={!selectedCategoryId}
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
                    opacity: !selectedCategoryId ? "0.5" : "1",
                    cursor: !selectedCategoryId ? "not-allowed" : "pointer",
                  }}
                >
                  {editingEvent ? "💾 Update Event" : "🎯 Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List - Using ExpandableRow pattern from Agenda */}
      <div className="d-flex flex-column" style={{ gap: "var(--space-4)" }}>
        {filteredEvents.map((event) => {
          const categoryName = getCategoryName(event.categoryId);
          const isExpanded = expandedEvents.has(event.id);

          // Determine card color based on event status
          const getEventColor = (status: EventStatus) => {
            switch (status) {
              case "scheduled":
                return "#4ECDC4";
              case "in-progress":
                return "#FFB84D";
              case "completed":
                return "#51CF66";
              default:
                return "#6c757d";
            }
          };

          const eventColor = getEventColor(event.status);

          return (
            <ExpandableRow
              key={event.id}
              accentColor={eventColor}
              isExpanded={isExpanded}
              onToggle={() => toggleEventExpansion(event.id)}
              previewContent={
                <div className="d-flex align-items-center justify-content-between w-100">
                  <div className="d-flex align-items-center mobile-gap-md flex-grow-1">
                    {/* Event Status Icon */}
                    <div
                      className="position-badge"
                      style={{
                        background: eventColor,
                        width: "56px",
                        height: "56px",
                        fontSize: "1.5rem",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: "700",
                        border: "3px solid rgba(255,255,255,0.3)",
                        boxShadow: `0 4px 15px ${eventColor}44`,
                      }}
                    >
                      {event.status === "scheduled"
                        ? "📅"
                        : event.status === "in-progress"
                        ? "🏃‍♂️"
                        : "🏆"}
                    </div>

                    {/* Event Details */}
                    <div className="min-width-0 flex-grow-1">
                      <div className="d-flex align-items-center mobile-gap-sm mb-1">
                        <h6
                          className="mb-0 fw-bold"
                          style={{
                            color: "var(--text-primary)",
                            fontFamily: "Fredoka, sans-serif",
                            fontSize: "clamp(1.3rem, 4vw, 1.5rem)",
                          }}
                        >
                          {event.name}
                        </h6>
                      </div>
                      <div className="d-flex align-items-center mobile-gap-sm flex-wrap">
                        <span
                          className="badge"
                          style={{
                            background: eventColor,
                            color: "white",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          {event.status === "scheduled"
                            ? "📅 Scheduled"
                            : event.status === "in-progress"
                            ? "⏳ In Progress"
                            : "✅ Completed"}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background: "var(--accent-purple)",
                            color: "white",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          🏷️ {categoryName}
                        </span>
                        <span
                          className="badge"
                          style={{
                            background:
                              event.type === "individual"
                                ? "var(--secondary-color)"
                                : "var(--info-color)",
                            color: "white",
                            fontSize: "var(--font-size-xs)",
                          }}
                        >
                          {event.type === "individual"
                            ? "👤 Individual"
                            : "👥 Group"}
                        </span>
                        <div
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "var(--font-size-base)",
                            fontWeight: "500",
                          }}
                        >
                          🏆 {Object.entries(event.scoring).length} placements
                        </div>
                        <small
                          style={{
                            color: "var(--text-secondary)",
                            fontWeight: "500",
                          }}
                        >
                          {event.startTime && event.endTime
                            ? `⏱️ ${formatDateTime(
                                event.startTime
                              )} - ${formatDateTime(event.endTime)}`
                            : event.startTime
                            ? `🚀 Started: ${formatDateTime(event.startTime)}`
                            : "📅 Not started"}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className="d-flex"
                    style={{ gap: "var(--space-2)" }}
                    onClick={(e) => e.stopPropagation()} // Prevent expand/collapse when clicking buttons
                  >
                    {event.status === "scheduled" && (
                      <>
                        <button
                          onClick={() => handleEditEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
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
                            e.currentTarget.style.color =
                              "var(--primary-color)";
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
                          onClick={() => handleStartEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--success-50)";
                            e.currentTarget.style.borderColor =
                              "var(--success-color)";
                            e.currentTarget.style.color =
                              "var(--success-color)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-elevated)";
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          🚀
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--danger-50)";
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
                      </>
                    )}

                    {event.status === "in-progress" && (
                      <>
                        <button
                          onClick={() => handleCompleteEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--success-50)";
                            e.currentTarget.style.borderColor =
                              "var(--success-color)";
                            e.currentTarget.style.color =
                              "var(--success-color)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-elevated)";
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          🏁
                        </button>
                        <button
                          onClick={() => handleResetEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--warning-50)";
                            e.currentTarget.style.borderColor =
                              "var(--warning-color)";
                            e.currentTarget.style.color =
                              "var(--warning-color)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-elevated)";
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          🔄
                        </button>
                      </>
                    )}

                    {event.status === "completed" && (
                      <>
                        <button
                          onClick={() => handleCompleteEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--info-50)";
                            e.currentTarget.style.borderColor =
                              "var(--info-color)";
                            e.currentTarget.style.color = "var(--info-color)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-elevated)";
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          👁️
                        </button>
                        <button
                          onClick={() => handleResetEvent(event)}
                          className="btn family-element"
                          style={{
                            background: "var(--bg-elevated)",
                            color: "var(--text-primary)",
                            border: "2px solid var(--border-color)",
                            borderRadius: "var(--radius-lg)",
                            padding: "var(--space-2)",
                            minHeight: "40px",
                            minWidth: "40px",
                            transition: "all 0.3s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--warning-50)";
                            e.currentTarget.style.borderColor =
                              "var(--warning-color)";
                            e.currentTarget.style.color =
                              "var(--warning-color)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "var(--bg-elevated)";
                            e.currentTarget.style.borderColor =
                              "var(--border-color)";
                            e.currentTarget.style.color = "var(--text-primary)";
                          }}
                        >
                          🔄
                        </button>
                      </>
                    )}
                  </div>
                </div>
              }
            >
              {/* Expanded Content - Point System Details */}
              <div
                className="d-flex flex-column"
                style={{ gap: "var(--space-3)" }}
              >
                {/* Point System Details - Following Agenda page pattern */}
                <div
                  className="p-3 rounded"
                  style={{
                    background: "var(--bg-elevated)",
                    border: `1px solid ${eventColor}`,
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

                {/* Event Details */}
                <div
                  className="p-3 rounded text-center"
                  style={{
                    background: "var(--bg-elevated)",
                    border: `1px solid ${eventColor}`,
                  }}
                >
                  <small
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "var(--font-size-sm)",
                      fontWeight: "500",
                    }}
                  >
                    {event.status === "scheduled" &&
                      `📅 Scheduled for ${formatDateTime(event.startTime)}`}
                    {event.status === "in-progress" &&
                      `🔥 Started ${formatDateTime(event.startTime)}`}
                    {event.status === "completed" &&
                      `✅ Completed ${formatDateTime(event.endTime)}`}
                  </small>
                </div>
              </div>
            </ExpandableRow>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredEvents.length === 0 && events.length === 0 && (
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
            🎯
          </div>
          <h4
            style={{
              color: "var(--text-secondary)",
              marginBottom: "var(--space-3)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            No Events Created Yet
          </h4>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "var(--font-size-lg)",
              marginBottom: "var(--space-4)",
              fontFamily: "Fredoka, sans-serif",
            }}
          >
            Create your first event to start organizing family competitions! ✨
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
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
            🎯 Create First Event
          </button>
        </div>
      )}

      {/* No Results from Filters */}
      {filteredEvents.length === 0 && events.length > 0 && (
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
            🔍
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
      )}

      {/* Bottom Spacing */}
      <div style={{ height: "2rem" }}></div>

      {/* Results Recording Modal */}
      {showResultsModal && selectedEventForResults && (
        <ResultsRecordingModal
          event={selectedEventForResults}
          onClose={() => {
            setShowResultsModal(false);
            setSelectedEventForResults(null);
          }}
          onSave={() => {
            setShowResultsModal(false);
            setSelectedEventForResults(null);
          }}
        />
      )}
    </div>
  );
};

export default EventManagement;
