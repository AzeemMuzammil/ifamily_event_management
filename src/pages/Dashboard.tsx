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
    <div className="container-fluid mobile-spacing-md">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="mobile-title fw-bold mb-2" style={{
          background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color), var(--accent-orange))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          🏆 iFamily Games Dashboard
        </h1>
        <p className="mobile-subtitle">Track your family's amazing achievements and upcoming adventures!</p>
      </div>

      {/* Quick Stats */}
      <div className="row mobile-gap-md mb-4">
        <div className="col-6 col-md-3">
          <div className="card family-element" style={{
            background: 'linear-gradient(135deg, var(--primary-color), var(--primary-600))',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '120px'
          }}>
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🏘️</div>
              <div className="h3 mb-1 fw-bold">{stats.totalHouses}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>Houses</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card family-element" style={{
            background: 'linear-gradient(135deg, var(--secondary-color), var(--secondary-600))',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '120px'
          }}>
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>👥</div>
              <div className="h3 mb-1 fw-bold">{stats.totalPlayers}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>Players</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card family-element" style={{
            background: 'linear-gradient(135deg, var(--accent-orange), #D97706)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '120px'
          }}>
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>🎉</div>
              <div className="h3 mb-1 fw-bold">{stats.completedEvents}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>Completed</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card family-element" style={{
            background: 'linear-gradient(135deg, var(--accent-purple), #7C3AED)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            minHeight: '120px'
          }}>
            <div className="card-body text-center d-flex flex-column justify-content-center">
              <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-2)' }}>📅</div>
              <div className="h3 mb-1 fw-bold">{stats.scheduledEvents}</div>
              <div style={{ fontSize: 'var(--font-size-sm)', opacity: '0.9' }}>Upcoming</div>
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
                    <div key={houseScore.houseId} className="d-flex align-items-center justify-content-between interactive" style={{
                      background: index === 0 
                        ? 'linear-gradient(135deg, var(--warning-light), rgba(252, 211, 77, 0.1))'
                        : index === 1
                        ? 'linear-gradient(135deg, var(--text-light), rgba(209, 213, 219, 0.1))'
                        : index === 2
                        ? 'linear-gradient(135deg, rgba(146, 64, 14, 0.1), rgba(180, 83, 9, 0.05))'
                        : 'var(--bg-secondary)',
                      border: `1px solid ${index < 3 ? 'var(--border-color)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      boxShadow: index < 3 ? 'var(--shadow-sm)' : 'var(--shadow-xs)'
                    }}>
                      <div className="d-flex align-items-center mobile-gap-md">
                        <div className="position-badge" style={{
                          background: houseScore.houseColor,
                          width: '48px',
                          height: '48px',
                          fontSize: 'var(--font-size-lg)'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                        </div>
                        <div>
                          <h6 className="mb-1" style={{ color: 'var(--text-primary)' }}>{houseScore.houseName}</h6>
                          <small style={{ color: 'var(--text-secondary)' }}>{houseScore.eventsWon} events won</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="h5 mb-0" style={{ color: 'var(--primary-color)' }}>{houseScore.totalScore}</div>
                        <small style={{ color: 'var(--text-muted)' }}>points</small>
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
                    <div key={playerScore.playerId} className="d-flex align-items-center justify-content-between interactive" style={{
                      background: index === 0 
                        ? 'linear-gradient(135deg, var(--warning-light), rgba(252, 211, 77, 0.1))'
                        : index === 1
                        ? 'linear-gradient(135deg, var(--text-light), rgba(209, 213, 219, 0.1))'
                        : index === 2
                        ? 'linear-gradient(135deg, rgba(146, 64, 14, 0.1), rgba(180, 83, 9, 0.05))'
                        : 'var(--bg-secondary)',
                      border: `1px solid ${index < 3 ? 'var(--border-color)' : 'var(--border-light)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      boxShadow: index < 3 ? 'var(--shadow-sm)' : 'var(--shadow-xs)'
                    }}>
                      <div className="d-flex align-items-center mobile-gap-md">
                        <div className="position-badge" style={{
                          background: playerScore.houseColor,
                          width: '48px',
                          height: '48px',
                          fontSize: 'var(--font-size-lg)'
                        }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : (index + 1)}
                        </div>
                        <div>
                          <h6 className="mb-1" style={{ color: 'var(--text-primary)' }}>{playerScore.playerName}</h6>
                          <small style={{ color: 'var(--text-secondary)' }}>{playerScore.houseName} • {playerScore.eventsWon} events won</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="h5 mb-0" style={{ color: 'var(--primary-color)' }}>{playerScore.totalScore}</div>
                        <small style={{ color: 'var(--text-muted)' }}>points</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                🎉 Recent Events
              </h5>
            </div>
            <div className="card-body">
              {recentEvents.length === 0 ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                  <p className="text-muted">No completed events yet</p>
                </div>
              ) : (
                <div className="d-flex flex-column mobile-gap-md">
                  {recentEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="interactive" style={{
                      background: 'linear-gradient(135deg, var(--success-light), rgba(16, 185, 129, 0.05))',
                      border: '1px solid var(--success-color)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      borderLeft: `4px solid var(--success-color)`
                    }}>
                      <div className="mb-3">
                        <h6 className="mb-1" style={{ color: 'var(--text-primary)' }}>
                          {event.name}
                        </h6>
                      </div>
                      <div className="d-flex flex-wrap mobile-gap-sm mb-3">
                        <span className="badge bg-secondary">
                          {getCategoryName(event.categoryId)}
                        </span>
                        <span className="badge bg-info">
                          {event.type === 'individual' ? '👤 Individual' : '👥 Group'}
                        </span>
                        <span className="badge bg-success">
                          ✅ Completed
                        </span>
                      </div>
                      {event.results && event.results.length > 0 && (
                        <div className="mb-2">
                          <small style={{ color: 'var(--text-secondary)' }}>Winner: </small>
                          <small style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
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
                          </small>
                        </div>
                      )}
                      <small style={{ color: 'var(--text-muted)' }}>
                        Completed: {formatDate(event.endTime)}
                      </small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">
                📅 Upcoming Events
              </h5>
            </div>
            <div className="card-body">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-4">
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
                  <p className="text-muted">No upcoming events scheduled</p>
                </div>
              ) : (
                <div className="d-flex flex-column mobile-gap-md">
                  {upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="interactive" style={{
                      background: event.status === 'in-progress' 
                        ? 'linear-gradient(135deg, var(--warning-light), rgba(245, 158, 11, 0.05))'
                        : 'linear-gradient(135deg, var(--info-light), rgba(59, 130, 246, 0.05))',
                      border: `1px solid ${event.status === 'in-progress' ? 'var(--warning-color)' : 'var(--info-color)'}`,
                      borderRadius: 'var(--radius-lg)',
                      padding: 'var(--space-4)',
                      borderLeft: `4px solid ${event.status === 'in-progress' ? 'var(--warning-color)' : 'var(--info-color)'}`
                    }}>
                      <div className="mb-3">
                        <h6 className="mb-1" style={{ color: 'var(--text-primary)' }}>
                          {event.name}
                        </h6>
                      </div>
                      <div className="d-flex flex-wrap mobile-gap-sm mb-3">
                        <span className="badge bg-secondary">
                          {getCategoryName(event.categoryId)}
                        </span>
                        <span className="badge bg-info">
                          {event.type === 'individual' ? '👤 Individual' : '👥 Group'}
                        </span>
                        <span className={`badge ${event.status === 'in-progress' ? 'bg-warning' : 'bg-primary'}`}>
                          {event.status === 'in-progress' ? '⏳ In Progress' : '📅 Scheduled'}
                        </span>
                      </div>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {event.status === 'in-progress' ? 'Started: ' : 'Scheduled: '} 
                        {formatDate(event.startTime)}
                      </small>
                    </div>
                  ))}
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
