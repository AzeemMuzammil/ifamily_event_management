import React, { useState, useEffect } from 'react';
import { Event, House, Player, Category } from '../types';
import { eventRepository, houseRepository, playerRepository, categoryRepository } from '../database';

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

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribeEvents = eventRepository.subscribeToAllEvents((eventsList: Event[]) => {
      setEvents(eventsList);
      
      // Filter recent and upcoming events
      const completed = eventsList.filter(e => e.status === 'completed')
        .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0))
        .slice(0, 5);
      
      const upcoming = eventsList.filter(e => e.status === 'scheduled' || e.status === 'in-progress')
        .sort((a, b) => {
          const aTime = a.startTime?.getTime() || Number.MAX_SAFE_INTEGER;
          const bTime = b.startTime?.getTime() || Number.MAX_SAFE_INTEGER;
          return aTime - bTime;
        })
        .slice(0, 5);

      setRecentEvents(completed);
      setUpcomingEvents(upcoming);
    });

    const unsubscribeHouses = houseRepository.subscribeToAllHouses((housesList: House[]) => {
      setHouses(housesList);
    });

    const unsubscribePlayers = playerRepository.subscribeToAllPlayers((playersList: Player[]) => {
      setPlayers(playersList);
    });

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories((categoriesList: Category[]) => {
      setCategories(categoriesList);
    });

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
    houses.forEach(house => {
      houseScoreMap[house.id] = {
        houseId: house.id,
        houseName: house.name,
        houseColor: house.colorHex,
        totalScore: 0,
        eventsWon: 0,
        categoryBreakdown: {}
      };
    });

    // Initialize player scores
    const playerScoreMap: { [playerId: string]: PlayerScore } = {};
    players.forEach(player => {
      const house = houses.find(h => h.id === player.houseId);
      if (house) {
        playerScoreMap[player.id] = {
          playerId: player.id,
          playerName: player.fullName,
          houseId: player.houseId,
          houseName: house.name,
          houseColor: house.colorHex,
          totalScore: 0,
          eventsWon: 0
        };
      }
    });

    // Calculate scores from completed events
    const completedEvents = events.filter(event => event.status === 'completed' && event.results);
    
    completedEvents.forEach(event => {
      if (!event.results) return;

      event.results.forEach(result => {
        const score = event.scoring[result.placement] || 0;

        if (event.type === 'individual') {
          // Individual event - add score to player
          if (playerScoreMap[result.participantId]) {
            playerScoreMap[result.participantId].totalScore += score;
            if (result.placement === 1) {
              playerScoreMap[result.participantId].eventsWon += 1;
            }

            // Add to house score as well
            const player = players.find(p => p.id === result.participantId);
            if (player && houseScoreMap[player.houseId]) {
              houseScoreMap[player.houseId].totalScore += score;
              if (result.placement === 1) {
                houseScoreMap[player.houseId].eventsWon += 1;
              }
              
              // Category breakdown
              if (!houseScoreMap[player.houseId].categoryBreakdown[event.categoryId]) {
                houseScoreMap[player.houseId].categoryBreakdown[event.categoryId] = 0;
              }
              houseScoreMap[player.houseId].categoryBreakdown[event.categoryId] += score;
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
            if (!houseScoreMap[result.participantId].categoryBreakdown[event.categoryId]) {
              houseScoreMap[result.participantId].categoryBreakdown[event.categoryId] = 0;
            }
            houseScoreMap[result.participantId].categoryBreakdown[event.categoryId] += score;
          }
        }
      });
    });

    // Sort and set the scores
    const sortedHouseScores = Object.values(houseScoreMap)
      .sort((a, b) => b.totalScore - a.totalScore);

    const sortedPlayerScores = Object.values(playerScoreMap)
      .sort((a, b) => b.totalScore - a.totalScore);

    setHouseScores(sortedHouseScores);
    setPlayerScores(sortedPlayerScores);
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.label : 'Unknown Category';
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Not scheduled';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    const completedCount = events.filter(e => e.status === 'completed').length;
    const inProgressCount = events.filter(e => e.status === 'in-progress').length;
    const scheduledCount = events.filter(e => e.status === 'scheduled').length;

    return {
      totalEvents: events.length,
      completedEvents: completedCount,
      inProgressEvents: inProgressCount,
      scheduledEvents: scheduledCount,
      totalHouses: houses.length,
      totalPlayers: players.length
    };
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
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
        <div className="alert alert-danger mx-auto" style={{ maxWidth: '400px' }}>
          {error}
        </div>
      </div>
    );
  }

  const stats = getStats();

  return (
    <div className="container-fluid py-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="display-5 fw-bold mb-2" style={{
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #FFB84D)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          🏆 iFamily Games Dashboard
        </h1>
        <p className="text-muted">Track your family's amazing achievements and upcoming adventures!</p>
      </div>

      {/* Quick Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, #FF6B6B, #E55555)',
            borderRadius: '16px',
            minHeight: '100px'
          }}>
            <div className="card-body text-center">
              <div style={{ fontSize: '2rem' }}>🏘️</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.totalHouses}</div>
              <div style={{ fontSize: '0.85rem', opacity: '0.9' }}>Houses</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, #4ECDC4, #45B7B8)',
            borderRadius: '16px',
            minHeight: '100px'
          }}>
            <div className="card-body text-center">
              <div style={{ fontSize: '2rem' }}>👥</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.totalPlayers}</div>
              <div style={{ fontSize: '0.85rem', opacity: '0.9' }}>Players</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, #FFB84D, #E6B93A)',
            borderRadius: '16px',
            minHeight: '100px'
          }}>
            <div className="card-body text-center">
              <div style={{ fontSize: '2rem' }}>🎉</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.completedEvents}</div>
              <div style={{ fontSize: '0.85rem', opacity: '0.9' }}>Completed</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card text-white" style={{
            background: 'linear-gradient(135deg, #A8E6CF, #98E4D6)',
            borderRadius: '16px',
            minHeight: '100px',
            color: '#2D3436'
          }}>
            <div className="card-body text-center">
              <div style={{ fontSize: '2rem' }}>📅</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>{stats.scheduledEvents}</div>
              <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>Upcoming</div>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* House Leaderboard */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                🏘️ House Leaderboard
              </h5>
            </div>
            <div className="card-body">
              {houseScores.length === 0 ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏠</div>
                  <p className="text-muted">No scoring data yet</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {houseScores.slice(0, 5).map((houseScore, index) => (
                    <div key={houseScore.houseId} className="d-flex align-items-center justify-content-between p-3 rounded" style={{
                      background: index === 0 
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.1))'
                        : index === 1
                        ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(160, 160, 160, 0.1))'
                        : index === 2
                        ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(184, 115, 46, 0.1))'
                        : 'rgba(0, 0, 0, 0.05)',
                      border: index < 3 ? '2px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}>
                      <div className="d-flex align-items-center">
                        <div className="me-3" style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: houseScore.houseColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                        </div>
                        <div>
                          <h6 className="mb-1">{houseScore.houseName}</h6>
                          <small className="text-muted">{houseScore.eventsWon} events won</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="h5 mb-0 text-primary">{houseScore.totalScore}</div>
                        <small className="text-muted">points</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Individual Leaderboard */}
        <div className="col-12 col-lg-6">
          <div className="card h-100">
            <div className="card-header">
              <h5 className="card-title mb-0">
                👤 Individual Leaderboard
              </h5>
            </div>
            <div className="card-body">
              {playerScores.length === 0 ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👤</div>
                  <p className="text-muted">No individual scores yet</p>
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {playerScores.slice(0, 5).map((playerScore, index) => (
                    <div key={playerScore.playerId} className="d-flex align-items-center justify-content-between p-3 rounded" style={{
                      background: index === 0 
                        ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.1))'
                        : index === 1
                        ? 'linear-gradient(135deg, rgba(192, 192, 192, 0.2), rgba(160, 160, 160, 0.1))'
                        : index === 2
                        ? 'linear-gradient(135deg, rgba(205, 127, 50, 0.2), rgba(184, 115, 46, 0.1))'
                        : 'rgba(0, 0, 0, 0.05)',
                      border: index < 3 ? '2px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}>
                      <div className="d-flex align-items-center">
                        <div className="me-3" style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: playerScore.houseColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                        </div>
                        <div>
                          <h6 className="mb-1">{playerScore.playerName}</h6>
                          <small className="text-muted">{playerScore.houseName} • {playerScore.eventsWon} events won</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="h5 mb-0 text-primary">{playerScore.totalScore}</div>
                        <small className="text-muted">points</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="mobile-section">
          <div className="mobile-section-header" style={{
            background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05))',
            borderRadius: '16px 16px 0 0',
            padding: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h5 style={{ margin: 0, fontWeight: '600', color: '#333' }}>
              🎉 Recent Events
            </h5>
          </div>
          <div className="mobile-section-body" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '0 0 16px 16px',
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {recentEvents.length === 0 ? (
              <div className="mobile-empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
                <p style={{ color: '#666', margin: 0 }}>No completed events yet</p>
              </div>
            ) : (
              <div className="mobile-card-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="mobile-event-card" style={{
                    background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(40, 167, 69, 0.05))',
                    border: '1px solid rgba(40, 167, 69, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    borderLeft: '4px solid #28a745'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333', marginBottom: '0.5rem' }}>
                      {event.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        color: '#6c757d',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getCategoryName(event.categoryId)}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(13, 202, 240, 0.1)',
                        color: '#0dcaf0',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {event.type === 'individual' ? '👤 Individual' : '👥 Group'}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(25, 135, 84, 0.1)',
                        color: '#198754',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        ✅ Completed
                      </span>
                    </div>
                    {event.results && event.results.length > 0 && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', color: '#666' }}>Winner: </span>
                        <span style={{ fontSize: '0.75rem', fontWeight: '500', color: '#333' }}>
                          {(() => {
                            const winner = event.results.find(r => r.placement === 1);
                            if (!winner) return 'No winner recorded';
                            
                            if (event.type === 'individual') {
                              const player = players.find(p => p.id === winner.participantId);
                              return player ? player.fullName : 'Unknown Player';
                            } else {
                              const house = houses.find(h => h.id === winner.participantId);
                              return house ? house.name : 'Unknown House';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      Completed: {formatDate(event.endTime)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="mobile-section">
          <div className="mobile-section-header" style={{
            background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.05))',
            borderRadius: '16px 16px 0 0',
            padding: '1rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h5 style={{ margin: 0, fontWeight: '600', color: '#333' }}>
              📅 Upcoming Events
            </h5>
          </div>
          <div className="mobile-section-body" style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '0 0 16px 16px',
            padding: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            {upcomingEvents.length === 0 ? (
              <div className="mobile-empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📅</div>
                <p style={{ color: '#666', margin: 0 }}>No upcoming events scheduled</p>
              </div>
            ) : (
              <div className="mobile-card-stack" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {upcomingEvents.slice(0, 3).map(event => (
                  <div key={event.id} className="mobile-event-card" style={{
                    background: event.status === 'in-progress' 
                      ? 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 193, 7, 0.05))'
                      : 'linear-gradient(135deg, rgba(13, 110, 253, 0.1), rgba(13, 110, 253, 0.05))',
                    border: event.status === 'in-progress' 
                      ? '1px solid rgba(255, 193, 7, 0.2)'
                      : '1px solid rgba(13, 110, 253, 0.2)',
                    borderRadius: '12px',
                    padding: '1rem',
                    borderLeft: event.status === 'in-progress' 
                      ? '4px solid #ffc107'
                      : '4px solid #0d6efd'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '1rem', color: '#333', marginBottom: '0.5rem' }}>
                      {event.name}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        backgroundColor: 'rgba(108, 117, 125, 0.1)',
                        color: '#6c757d',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {getCategoryName(event.categoryId)}
                      </span>
                      <span style={{
                        backgroundColor: 'rgba(13, 202, 240, 0.1)',
                        color: '#0dcaf0',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {event.type === 'individual' ? '👤 Individual' : '👥 Group'}
                      </span>
                      <span style={{
                        backgroundColor: event.status === 'in-progress' 
                          ? 'rgba(255, 193, 7, 0.1)'
                          : 'rgba(13, 110, 253, 0.1)',
                        color: event.status === 'in-progress' 
                          ? '#ffc107'
                          : '#0d6efd',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {event.status === 'in-progress' ? '⏳ In Progress' : '📅 Scheduled'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {event.status === 'in-progress' ? 'Started: ' : 'Scheduled: '} 
                      {formatDate(event.startTime)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
