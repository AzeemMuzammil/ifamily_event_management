import { useState, useEffect } from 'react';
import { Event, EventType, EventStatus, Category } from '../../types';
import { eventRepository, categoryRepository } from '../../database';
import ResultsRecordingModal from '../../components/admin/ResultsRecordingModal';

const EventManagement = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedEventForResults, setSelectedEventForResults] = useState<Event | null>(null);

  // Form state
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<EventType>('individual');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [scoringConfig, setScoringConfig] = useState<{ [placement: number]: number }>({
    1: 5,
    2: 3,
    3: 1
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribeEvents = eventRepository.subscribeToAllEvents((eventsData) => {
      setEvents(eventsData);
    });

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories((categoriesData) => {
      setCategories(categoriesData);
    });

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
        categoryRepository.getAllCategories()
      ]);
      setEvents(eventsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEventName('');
    setEventType('individual');
    setSelectedCategoryId('');
    setScoringConfig({ 1: 5, 2: 3, 3: 1 });
    setEditingEvent(null);
    setShowCreateForm(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!eventName.trim() || !selectedCategoryId || !eventType) {
      alert('Please fill in all required fields');
      return;
    }

    if (Object.keys(scoringConfig).length === 0) {
      alert('Please configure at least one scoring placement');
      return;
    }

    try {
      // Check if event name is already taken
      const nameTaken = await eventRepository.isEventNameTaken(
        eventName,
        editingEvent?.id
      );
      
      if (nameTaken) {
        alert('An event with this name already exists. Please choose a different name.');
        return;
      }

      const eventData = {
        name: eventName.trim(),
        type: eventType,
        categoryId: selectedCategoryId,
        status: 'scheduled' as EventStatus,
        scoring: scoringConfig
      };

      if (editingEvent) {
        await eventRepository.updateEvent(editingEvent.id, eventData);
      } else {
        await eventRepository.createEvent(eventData);
      }

      resetForm();
    } catch (err) {
      console.error('Error saving event:', err);
      if (err instanceof Error) {
        alert(`Failed to save event: ${err.message}`);
      } else {
        alert('Failed to save event');
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
      console.error('Error starting event:', err);
      if (err instanceof Error) {
        alert(`Failed to start event: ${err.message}`);
      } else {
        alert('Failed to start event');
      }
    }
  };

  const handleCompleteEvent = async (event: Event) => {
    setSelectedEventForResults(event);
    setShowResultsModal(true);
  };

  const handleResetEvent = async (event: Event) => {
    if (!confirm(`Are you sure you want to reset "${event.name}" back to scheduled status? This will clear all progress and results.`)) {
      return;
    }

    try {
      await eventRepository.resetEvent(event.id);
    } catch (err) {
      console.error('Error resetting event:', err);
      if (err instanceof Error) {
        alert(`Failed to reset event: ${err.message}`);
      } else {
        alert('Failed to reset event');
      }
    }
  };

  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await eventRepository.deleteEvent(event.id);
    } catch (err) {
      console.error('Error deleting event:', err);
      if (err instanceof Error) {
        alert(`Failed to delete event: ${err.message}`);
      } else {
        alert('Failed to delete event');
      }
    }
  };

  const addScoringPlacement = () => {
    const maxPlacement = Math.max(...Object.keys(scoringConfig).map(Number), 0);
    setScoringConfig({
      ...scoringConfig,
      [maxPlacement + 1]: 1
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
      [placement]: Math.max(0, points) // Ensure non-negative points
    });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.label || 'Unknown';
  };


  const formatDateTime = (date: Date | undefined) => {
    if (!date) return 'Not set';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
        <div className="text-center">
          <div className="spinner-custom mx-auto mb-3 pulse-animation"></div>
          <div style={{
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: '1.2rem',
            fontWeight: '600'
          }}>
            🎯 Loading events...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger glow-effect" style={{maxWidth: '400px'}} role="alert">
          <h5 className="alert-heading">🚨 Something went wrong</h5>
          {error}
        </div>
        <button onClick={loadData} className="btn btn-primary pulse-animation">
          🔄 Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid mobile-spacing-md">
      {/* Header */}
      <div className="text-center mb-5 fade-in-up">
        <h1 className="mobile-title" style={{
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          🎯 Event Management
        </h1>
        <p className="mobile-subtitle" style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '2rem'
        }}>
          Create, manage, and run your family events
        </p>

        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
          style={{
            borderRadius: '20px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
          }}
        >
          <span style={{ marginRight: '0.5rem' }}>➕</span>
          Create New Event
        </button>
      </div>

      {/* Create/Edit Event Form */}
      {showCreateForm && (
        <div className="card mb-5 fade-in-up" style={{
          border: 'none',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          <div className="card-header" style={{
            background: 'linear-gradient(135deg, #FF6B6B, #4ECDC4)',
            color: 'white',
            border: 'none',
            padding: '2rem'
          }}>
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="card-title mb-1" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                  {editingEvent ? '✏️ Edit Event' : '🎯 Create New Event'}
                </h5>
                <p className="mb-0" style={{ opacity: '0.9' }}>
                  {editingEvent ? 'Update event details and scoring' : 'Create a new family event with custom scoring'}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="btn-close btn-close-white"
                type="button"
                aria-label="Close"
                style={{ fontSize: '1.2rem' }}
              ></button>
            </div>
          </div>

          <div className="card-body mobile-spacing-xl">
            <form onSubmit={handleCreateEvent}>
              <div className="row g-4">
                <div className="col-12">
                  <label className="form-label fw-bold mb-3" style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem'
                  }}>
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
                      padding: '1rem 1.5rem',
                      fontSize: '1.1rem',
                      borderRadius: '16px',
                      border: '2px solid var(--border-color)',
                      background: 'var(--bg-light)'
                    }}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold mb-3" style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem'
                  }}>
                    👥 Event Type
                  </label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="form-select"
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '1.1rem',
                      borderRadius: '16px',
                      border: '2px solid var(--border-color)',
                      background: 'var(--bg-light)'
                    }}
                  >
                    <option value="individual">Individual Competition</option>
                    <option value="group">Group/Team Event</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-bold mb-3" style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem'
                  }}>
                    🏷️ Category
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="form-select"
                    required
                    style={{
                      padding: '1rem 1.5rem',
                      fontSize: '1.1rem',
                      borderRadius: '16px',
                      border: '2px solid var(--border-color)',
                      background: 'var(--bg-light)'
                    }}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className="form-label fw-bold mb-0" style={{
                      color: 'var(--text-primary)',
                      fontSize: '1.1rem'
                    }}>
                      🏆 Scoring Configuration
                    </label>
                    <button
                      type="button"
                      onClick={addScoringPlacement}
                      className="btn btn-outline-primary btn-sm"
                      style={{
                        borderRadius: '12px',
                        padding: '0.5rem 1rem',
                        fontWeight: '600'
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
                          <div className="card" style={{
                            background: 'var(--bg-light)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px'
                          }}>
                            <div className="card-body p-3">
                              <div className="d-flex align-items-center gap-3">
                                <div className="text-center" style={{
                                  fontSize: '1.5rem',
                                  minWidth: '40px'
                                }}>
                                  {placement === '1' ? '🥇' : placement === '2' ? '🥈' : placement === '3' ? '🥉' : `${placement}th`}
                                </div>
                                <div className="flex-grow-1">
                                  <div className="input-group">
                                    <input
                                      type="number"
                                      className="form-control"
                                      value={points}
                                      onChange={(e) => updateScoringPoints(Number(placement), Number(e.target.value))}
                                      min="0"
                                      required
                                      style={{
                                        borderRadius: '12px',
                                        border: '1px solid var(--border-color)'
                                      }}
                                    />
                                    <span className="input-group-text" style={{
                                      borderRadius: '12px',
                                      border: '1px solid var(--border-color)',
                                      background: 'var(--bg-light)'
                                    }}>pts</span>
                                  </div>
                                </div>
                                {Object.keys(scoringConfig).length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeScoringPlacement(Number(placement))}
                                    className="btn btn-outline-danger btn-sm"
                                    style={{
                                      borderRadius: '8px',
                                      width: '32px',
                                      height: '32px',
                                      padding: '0',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
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
                  className="btn btn-secondary"
                  style={{
                    borderRadius: '16px',
                    padding: '0.75rem 2rem',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={!selectedCategoryId}
                  style={{
                    borderRadius: '16px',
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  {editingEvent ? '💾 Update Event' : '🎯 Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Events List - Mobile-Optimized Cards */}
      <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
        {events.map((event) => {
          const categoryName = getCategoryName(event.categoryId);
          
          // Determine card color based on event status
          const getEventColor = (status: EventStatus) => {
            switch (status) {
              case 'scheduled': return '#4ECDC4';
              case 'in-progress': return '#FFB84D';
              case 'completed': return '#51CF66';
              default: return '#6c757d';
            }
          };
          
          const eventColor = getEventColor(event.status);
          
          return (
            <div key={event.id} className="mb-4">
              <div 
                className="card"
                style={{
                  background: `linear-gradient(135deg, ${eventColor}25, ${eventColor}15)`,
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${eventColor}40`,
                  borderRadius: '24px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 8px 25px ${eventColor}20`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 12px 35px ${eventColor}30`;
                  e.currentTarget.style.borderColor = `${eventColor}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${eventColor}20`;
                  e.currentTarget.style.borderColor = `${eventColor}40`;
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
                    {/* Left Side - Event Info */}
                    <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                      {/* Status Icon Circle */}
                      <div 
                        className="rounded-circle flex-shrink-0"
                        style={{
                          width: '50px',
                          height: '50px',
                          background: `linear-gradient(135deg, ${eventColor}, ${eventColor}dd)`,
                          border: '3px solid rgba(255,255,255,0.3)',
                          boxShadow: `0 4px 15px ${eventColor}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ 
                          fontSize: '1.5rem',
                          filter: 'brightness(0) invert(1)'
                        }}>
                          {event.status === 'scheduled' ? '📅' : event.status === 'in-progress' ? '🏃‍♂️' : '🏆'}
                        </span>
                      </div>
                      
                      {/* Event Details */}
                      <div className="flex-grow-1 min-width-0">
                        <h5 className="card-title mb-2" style={{
                          color: 'white',
                          fontWeight: '700',
                          fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
                          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          lineHeight: '1.2',
                          wordBreak: 'break-word'
                        }}>
                          {event.name}
                        </h5>
                        
                        <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
                          {/* Category Badge */}
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'white',
                            fontWeight: '600',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                          }}>
                            🏷️ {categoryName}
                          </span>
                          
                          {/* Type Badge */}
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'white',
                            fontWeight: '600',
                            background: event.type === 'individual' ? 'rgba(78, 205, 196, 0.3)' : 'rgba(81, 207, 102, 0.3)',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.3)'
                          }}>
                            {event.type === 'individual' ? '👤 Individual' : '👥 Group'}
                          </span>
                          
                          {/* Status Badge */}
                          <span style={{
                            fontSize: '0.75rem',
                            color: 'white',
                            fontWeight: '700',
                            background: `${eventColor}50`,
                            padding: '0.3rem 0.7rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)',
                            border: `2px solid ${eventColor}70`,
                            textTransform: 'capitalize'
                          }}>
                            {event.status === 'in-progress' ? 'In Progress' : event.status}
                          </span>
                        </div>
                        
                        {/* Timing & Scoring Info */}
                        <div className="d-flex flex-wrap gap-3 align-items-center">
                          {/* Timing */}
                          <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <span style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.9)',
                              fontWeight: '500'
                            }}>
                              {event.startTime && event.endTime ? 
                                `⏱️ ${formatDateTime(event.startTime)} - ${formatDateTime(event.endTime)}` :
                                event.startTime ? 
                                `🚀 Started: ${formatDateTime(event.startTime)}` :
                                '📅 Not started'
                              }
                            </span>
                          </div>
                          
                          {/* Scoring Preview */}
                          <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <span style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.9)',
                              fontWeight: '500'
                            }}>
                              🏆 {Object.entries(event.scoring).length} placements
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Action Buttons */}
                    <div className="d-flex flex-wrap gap-2 flex-shrink-0">
                      {event.status === 'scheduled' && (
                        <>
                          <button 
                            className="btn"
                            onClick={() => handleEditEvent(event)}
                            style={{
                              background: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>✏️</span>
                            <span className="d-none d-sm-inline">Edit</span>
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleStartEvent(event)}
                            style={{
                              background: 'rgba(81, 207, 102, 0.25)',
                              color: 'white',
                              border: '1px solid rgba(81, 207, 102, 0.4)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(81, 207, 102, 0.35)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(81, 207, 102, 0.25)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>🚀</span>
                            <span className="d-none d-sm-inline">Start</span>
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleDeleteEvent(event)}
                            style={{
                              background: 'rgba(255,99,99,0.25)',
                              color: 'white',
                              border: '1px solid rgba(255,99,99,0.4)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,99,99,0.35)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,99,99,0.25)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>🗑️</span>
                            <span className="d-none d-sm-inline">Delete</span>
                          </button>
                        </>
                      )}
                      
                      {event.status === 'in-progress' && (
                        <>
                          <button 
                            className="btn"
                            onClick={() => handleCompleteEvent(event)}
                            style={{
                              background: 'rgba(81, 207, 102, 0.25)',
                              color: 'white',
                              border: '1px solid rgba(81, 207, 102, 0.4)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(81, 207, 102, 0.35)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(81, 207, 102, 0.25)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>🏁</span>
                            <span className="d-none d-sm-inline">Complete</span>
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleResetEvent(event)}
                            style={{
                              background: 'rgba(255,184,77,0.25)',
                              color: 'white',
                              border: '1px solid rgba(255,184,77,0.4)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,184,77,0.35)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,184,77,0.25)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>🔄</span>
                            <span className="d-none d-sm-inline">Reset</span>
                          </button>
                        </>
                      )}
                      
                      {event.status === 'completed' && (
                        <>
                          <button 
                            className="btn"
                            onClick={() => handleCompleteEvent(event)}
                            style={{
                              background: 'rgba(78, 205, 196, 0.25)',
                              color: 'white',
                              border: '1px solid rgba(78, 205, 196, 0.4)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(78, 205, 196, 0.35)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(78, 205, 196, 0.25)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>👁️</span>
                            <span className="d-none d-sm-inline">Results</span>
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleResetEvent(event)}
                            style={{
                              background: 'rgba(255,184,77,0.25)',
                              color: 'white',
                              border: '1px solid rgba(255,184,77,0.4)',
                              borderRadius: '16px',
                              padding: '0.75rem 1rem',
                              fontWeight: '600',
                              backdropFilter: 'blur(10px)',
                              fontSize: '0.9rem',
                              minHeight: '48px',
                              transition: 'all 0.2s ease',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.5rem'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(255,184,77,0.35)';
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(255,184,77,0.25)';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <span style={{ fontSize: '1rem' }}>🔄</span>
                            <span className="d-none d-sm-inline">Reset</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Color Accent */}
                <div 
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: `linear-gradient(90deg, ${eventColor}, ${eventColor}aa)`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <div className="text-center py-5 fade-in-up" style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          border: '2px dashed rgba(255,255,255,0.2)',
          margin: '2rem 0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🎯</div>
          <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontWeight: '600' }}>
            No Events Created Yet
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Create your first event to start organizing family competitions
          </p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn btn-primary"
            style={{
              borderRadius: '20px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
            }}
          >
            🎯 Create First Event
          </button>
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: '2rem' }}></div>

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
