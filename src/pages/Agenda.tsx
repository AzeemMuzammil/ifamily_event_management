import React, { useState, useEffect } from 'react';
import { Event, Category, Player, House } from '../types';
import { eventRepository, categoryRepository, playerRepository, houseRepository } from '../database';

const Agenda: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [participants, setParticipants] = useState<Record<string, Player | House>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | Event['status']>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | Event['type']>('all');

  // Load data
  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribeEvents = eventRepository.subscribeToAllEvents((eventsList: Event[]) => {
      setEvents(eventsList);
    });

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories((categoriesList: Category[]) => {
      setCategories(categoriesList);
    });

    // Load participants (both players and houses) for name lookup
    const loadParticipants = async () => {
      try {
        const [players, houses] = await Promise.all([
          playerRepository.getAllPlayers(),
          houseRepository.getAllHouses()
        ]);
        
        const participantsMap: Record<string, Player | House> = {};
        players.forEach(player => participantsMap[player.id] = player);
        houses.forEach(house => participantsMap[house.id] = house);
        
        setParticipants(participantsMap);
      } catch (err) {
        console.error('Error loading participants:', err);
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
    const category = categories.find(c => c.id === categoryId);
    return category ? category.label : 'Unknown Category';
  };

  const getParticipantName = (participantId: string) => {
    const participant = participants[participantId];
    if (!participant) return 'Unknown';
    
    if ('fullName' in participant) {
      return participant.fullName; // Player
    } else {
      return participant.name; // House
    }
  };

  const getScoreForPlacement = (event: Event, placement: number) => {
    return event.scoring[placement] || 0;
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not scheduled';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    if (statusFilter !== 'all' && event.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && event.categoryId !== categoryFilter) return false;
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    return true;
  });

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
            📅 Loading agenda...
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
          📅 Events Agenda
        </h1>
        <p className="mobile-subtitle" style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '2rem'
        }}>
          Track all scheduled, ongoing, and completed events
        </p>
      </div>

      {/* Filters */}
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
          <div className="text-center">
            <h5 className="card-title mb-1" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
              🔍 Filter Events
            </h5>
            <p className="mb-0" style={{ opacity: '0.9' }}>
              Customize your view by status, category, and type
            </p>
          </div>
        </div>
        <div className="card-body mobile-spacing-xl">
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label fw-bold mb-3" style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem'
              }}>
                📊 Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | Event['status'])}
                className="form-select"
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '16px',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-light)'
                }}
              >
                <option value="all">All Status</option>
                <option value="scheduled">📅 Scheduled</option>
                <option value="in-progress">⏳ In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label fw-bold mb-3" style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem'
              }}>
                🏷️ Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-select"
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '16px',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-light)'
                }}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label fw-bold mb-3" style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem'
              }}>
                👥 Type
              </label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | Event['type'])}
                className="form-select"
                style={{
                  padding: '1rem 1.5rem',
                  fontSize: '1.1rem',
                  borderRadius: '16px',
                  border: '2px solid var(--border-color)',
                  background: 'var(--bg-light)'
                }}
              >
                <option value="all">All Types</option>
                <option value="individual">👤 Individual</option>
                <option value="group">👥 Group</option>
              </select>
            </div>

            <div className="col-12 col-md-6 col-lg-3">
              <label className="form-label fw-bold mb-3" style={{
                color: 'var(--text-primary)',
                fontSize: '1.1rem'
              }}>
                📈 Results
              </label>
              <div style={{
                background: 'linear-gradient(135deg, #4ECDC4, #51CF66)',
                padding: '1rem 1.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                border: '2px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  marginBottom: '0.25rem'
                }}>
                  {filteredEvents.length}
                </div>
                <div style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: '500'
                }}>
                  Events Found
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events List - Modern Card Design */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-5 fade-in-up" style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          border: '2px dashed rgba(255,255,255,0.2)',
          margin: '2rem 0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📅</div>
          <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontWeight: '600' }}>
            No Events Found
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            No events match the selected filters. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
          {filteredEvents.map((event) => {
            const getEventColor = (status: Event['status']) => {
              switch (status) {
                case 'scheduled': return '#4ECDC4';
                case 'in-progress': return '#FFB84D';
                case 'completed': return '#51CF66';
                default: return '#6c757d';
              }
            };
            
            const getEventIcon = (status: Event['status']) => {
              switch (status) {
                case 'scheduled': return '📅';
                case 'in-progress': return '🏃‍♂️';
                case 'completed': return '🏆';
                default: return '📌';
              }
            };
            
            const eventColor = getEventColor(event.status);
            const eventIcon = getEventIcon(event.status);
            
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
                            {eventIcon}
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
                          
                          <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
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
                              🏷️ {getCategoryName(event.categoryId)}
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
                          
                          {/* Timing & Additional Info */}
                          <div className="d-flex flex-wrap gap-3 align-items-center mb-3">
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
                                {event.status === 'scheduled' && `📅 ${formatDate(event.startTime)}`}
                                {event.status === 'in-progress' && `🚀 Started: ${formatDate(event.startTime)}`}
                                {event.status === 'completed' && `🏁 Completed: ${formatDate(event.endTime)}`}
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

                          {/* Results for Completed Events */}
                          {event.status === 'completed' && event.results && event.results.length > 0 && (
                            <div className="mt-3">
                              <div className="d-flex flex-wrap gap-2">
                                {event.results
                                  .sort((a, b) => a.placement - b.placement)
                                  .slice(0, 3)
                                  .map(result => (
                                    <div 
                                      key={result.participantId}
                                      style={{
                                        background: 'rgba(255,255,255,0.15)',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '12px',
                                        backdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        fontSize: '0.8rem',
                                        color: 'white',
                                        fontWeight: '600'
                                      }}
                                    >
                                      {result.placement === 1 ? '🥇' : result.placement === 2 ? '🥈' : result.placement === 3 ? '🥉' : `${result.placement}th`}{' '}
                                      {getParticipantName(result.participantId)} ({getScoreForPlacement(event, result.placement)}pts)
                                    </div>
                                  ))}
                                {event.results.length > 3 && (
                                  <div style={{
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '0.4rem 0.8rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    color: 'rgba(255,255,255,0.8)',
                                    fontWeight: '500'
                                  }}>
                                    +{event.results.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
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
      )}

      {/* Bottom Spacing */}
      <div style={{ height: '2rem' }}></div>
    </div>
  );
};

export default Agenda;