import React, { useState, useEffect } from 'react';
import { Event, EventResult, Player, House } from '../../types';
import { eventRepository, playerRepository, houseRepository } from '../../database';

interface ResultsRecordingModalProps {
  event: Event;
  onClose: () => void;
  onSave: () => void;
}

const ResultsRecordingModal: React.FC<ResultsRecordingModalProps> = ({
  event,
  onClose,
  onSave
}) => {
  const [participants, setParticipants] = useState<(Player | House)[]>([]);
  const [results, setResults] = useState<EventResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load participants based on event type
  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setIsLoading(true);
        setError(null);

        let participantsList: (Player | House)[] = [];

        if (event.type === 'individual') {
          // Load players from the event's category
          participantsList = await playerRepository.getPlayersByCategory(event.categoryId);
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
          const availablePlacements = Object.keys(event.scoring).map(Number).sort((a, b) => a - b);
          const prepopulatedResults = availablePlacements.map(placement => ({
            placement,
            participantId: '' // No participant selected initially
          }));
          setResults(prepopulatedResults);
        }

      } catch (err) {
        console.error('Error loading participants:', err);
        setError('Failed to load participants');
      } finally {
        setIsLoading(false);
      }
    };

    loadParticipants();
  }, [event]);

  const getParticipantName = (participantId: string) => {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return 'Not assigned';
    
    if ('fullName' in participant) {
      return participant.fullName; // Player
    } else {
      return participant.name; // House
    }
  };

  const getScoreForPlacement = (placement: number) => {
    return event.scoring[placement] || 0;
  };

  const isParticipantSelected = (participantId: string) => {
    return results.some(r => r.participantId === participantId);
  };

  const updateParticipantForPlacement = (placement: number, participantId: string) => {
    const newResults = results.map(result => 
      result.placement === placement 
        ? { ...result, participantId }
        : result
    );
    setResults(newResults);
  };

  const validateResults = () => {
    // Filter out results where no participant is selected
    const assignedResults = results.filter(r => r.participantId !== '');
    
    if (assignedResults.length === 0) {
      return 'At least one placement must be assigned';
    }

    // Check for duplicate participants
    const participantIds = assignedResults.map(r => r.participantId);
    const uniqueIds = new Set(participantIds);
    if (uniqueIds.size !== participantIds.length) {
      return 'Each participant can only be assigned to one placement';
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
      const assignedResults = results.filter(r => r.participantId !== '');
      await eventRepository.completeEvent(event.id, assignedResults);
      onSave();
    } catch (err) {
      console.error('Error saving results:', err);
      if (err instanceof Error) {
        alert(`Failed to save results: ${err.message}`);
      } else {
        alert('Failed to save results');
      }
    } finally {
      setIsSaving(false);
    }
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
            🎯 Loading participants...
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
        <button onClick={onClose} className="btn btn-primary pulse-animation">
          🔄 Close
        </button>
      </div>
    );
  }

  return (
    <div 
      className="modal-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1050,
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        // Close modal only if clicking the overlay itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="modal-content-wrapper"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
      >
        <div className="container-fluid mobile-spacing-md" style={{ 
          flex: 1,
          paddingTop: '2rem',
          paddingBottom: '2rem'
        }}>
      {/* Header */}
      <div className="text-center mb-5 fade-in-up">
        <h1 className="mobile-title" style={{
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: '700',
          marginBottom: '0.5rem'
        }}>
          {event.status === 'completed' ? '🏆 View Results' : '📝 Record Results'}
        </h1>
        <p className="mobile-subtitle" style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '2rem'
        }}>
          {event.name} • {event.type === 'individual' ? '👤 Individual' : '👥 Group'} Event
        </p>

        <button
          onClick={onClose}
          className="btn btn-secondary"
          style={{
            borderRadius: '20px',
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: '600',
            marginRight: '1rem'
          }}
        >
          <span style={{ marginRight: '0.5rem' }}>✖️</span>
          {event.status === 'completed' ? 'Close' : 'Cancel'}
        </button>

        {event.status !== 'completed' && (
          <button
            onClick={handleSave}
            className="btn btn-primary"
            disabled={isSaving || results.filter(r => r.participantId !== '').length === 0}
            style={{
              borderRadius: '20px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
            }}
          >
            {isSaving ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Saving...
              </>
            ) : (
              <>
                <span style={{ marginRight: '0.5rem' }}>🏁</span>
                Complete Event
              </>
            )}
          </button>
        )}
      </div>

      {/* Instructions */}
      {event.status !== 'completed' && (
        <div className="card mb-5 fade-in-up" style={{
          border: 'none',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          overflow: 'hidden'
        }}>
          <div className="card-header" style={{
            background: 'linear-gradient(135deg, #4ECDC4, #51CF66)',
            color: 'white',
            border: 'none',
            padding: '2rem'
          }}>
            <div className="text-center">
              <h5 className="card-title mb-1" style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                💡 Instructions
              </h5>
              <p className="mb-0" style={{ opacity: '0.9' }}>
                Select participants for each placement. Leave unassigned if no one earned that position.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* No Participants Warning */}
      {participants.length === 0 ? (
        <div className="text-center py-5 fade-in-up" style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          border: '2px dashed rgba(255,255,255,0.2)',
          margin: '2rem 0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⚠️</div>
          <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontWeight: '600' }}>
            No Participants Available
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            {event.type === 'individual' 
              ? 'No players found in this category. Please add players first.' 
              : 'No houses found. Please create houses first.'}
          </p>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{
              borderRadius: '20px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
            }}
          >
            🔙 Go Back
          </button>
        </div>
      ) : (
        <>
          {/* Placement Cards - Following HouseManagement pattern */}
          <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
            {results.map((result) => {
              const medalEmoji = result.placement === 1 ? '🥇' : 
                               result.placement === 2 ? '🥈' : 
                               result.placement === 3 ? '🥉' : '🏅';
              const placementColor = result.placement === 1 ? '#FFD700' : 
                                    result.placement === 2 ? '#C0C0C0' : 
                                    result.placement === 3 ? '#CD7F32' : '#4ECDC4';
              
              return (
                <div key={result.placement} className="mb-4">
                  <div 
                    className="card"
                    style={{
                      background: `linear-gradient(135deg, ${placementColor}25, ${placementColor}15)`,
                      backdropFilter: 'blur(20px)',
                      border: `2px solid ${placementColor}40`,
                      borderRadius: '24px',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 8px 25px ${placementColor}20`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = `0 12px 35px ${placementColor}30`;
                      e.currentTarget.style.borderColor = `${placementColor}60`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = `0 8px 25px ${placementColor}20`;
                      e.currentTarget.style.borderColor = `${placementColor}40`;
                    }}
                  >
                    <div className="card-body p-4">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                        {/* Left Side - Placement Info */}
                        <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                          {/* Medal Circle */}
                          <div 
                            className="rounded-circle flex-shrink-0"
                            style={{
                              width: '50px',
                              height: '50px',
                              background: `linear-gradient(135deg, ${placementColor}, ${placementColor}dd)`,
                              border: '3px solid rgba(255,255,255,0.3)',
                              boxShadow: `0 4px 15px ${placementColor}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span style={{ 
                              fontSize: '1.5rem',
                              filter: 'brightness(0) invert(1)'
                            }}>
                              {medalEmoji}
                            </span>
                          </div>
                          
                          {/* Placement Details */}
                          <div className="flex-grow-1 min-width-0">
                            <h5 className="card-title mb-2" style={{
                              color: 'white',
                              fontWeight: '700',
                              fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
                              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                              lineHeight: '1.2',
                              wordBreak: 'break-word'
                            }}>
                              {result.placement === 1 ? '1st Place' :
                               result.placement === 2 ? '2nd Place' :
                               result.placement === 3 ? '3rd Place' :
                               `${result.placement}th Place`}
                            </h5>
                            
                            <div className="d-flex align-items-center gap-2 mb-3">
                              {/* Points Badge */}
                              <span style={{
                                fontSize: '0.8rem',
                                color: 'rgba(255,255,255,0.9)',
                                fontWeight: '500',
                                background: 'rgba(0,0,0,0.2)',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)'
                              }}>
                                🏆 {getScoreForPlacement(result.placement)} points
                              </span>
                            </div>

                            {/* Participant Display/Selection */}
                            {event.status === 'completed' ? (
                              <div style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                backdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255,255,255,0.3)'
                              }}>
                                <strong style={{
                                  color: 'white',
                                  fontSize: '1.1rem',
                                  textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                }}>
                                  {getParticipantName(result.participantId)}
                                </strong>
                              </div>
                            ) : (
                              <select
                                className="form-select"
                                value={result.participantId}
                                onChange={(e) => updateParticipantForPlacement(result.placement, e.target.value)}
                                style={{
                                  padding: '0.75rem 1rem',
                                  fontSize: '1rem',
                                  borderRadius: '16px',
                                  border: '2px solid var(--border-color)',
                                  background: 'var(--bg-light)'
                                }}
                              >
                                <option value="">Select participant</option>
                                {participants.map(participant => {
                                  const isSelected = isParticipantSelected(participant.id) && participant.id !== result.participantId;
                                  return (
                                    <option 
                                      key={participant.id} 
                                      value={participant.id}
                                      disabled={isSelected}
                                    >
                                      {'fullName' in participant ? participant.fullName : participant.name}
                                      {isSelected ? ' (already assigned)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
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
                        background: `linear-gradient(90deg, ${placementColor}, ${placementColor}aa)`
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

        </>
      )}

          {/* Bottom Spacing */}
          <div style={{ height: '2rem' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ResultsRecordingModal;