import { useState, useEffect } from 'react';
import { Player, House, Category } from '../../types';
import { playerRepository, houseRepository, categoryRepository } from '../../database';

const PlayerManagement = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    houseId: '',
    categoryId: ''
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribePlayers = playerRepository.subscribeToAllPlayers((playersData) => {
      setPlayers(playersData);
    });

    const unsubscribeHouses = houseRepository.subscribeToAllHouses((housesData) => {
      setHouses(housesData);
    });

    const unsubscribeCategories = categoryRepository.subscribeToAllCategories((categoriesData) => {
      setCategories(categoriesData);
    });

    setIsLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribePlayers();
      unsubscribeHouses();
      unsubscribeCategories();
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [playersData, housesData, categoriesData] = await Promise.all([
        playerRepository.getAllPlayers(),
        houseRepository.getAllHouses(),
        categoryRepository.getAllCategories()
      ]);
      setPlayers(playersData);
      setHouses(housesData);
      setCategories(categoriesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ fullName: '', houseId: '', categoryId: '' });
    setEditingPlayer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName.trim() || !formData.houseId || !formData.categoryId) {
      alert('Please fill in all fields');
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
        alert('A player with this name already exists in the same house and category. Please choose a different name.');
        return;
      }

      const playerData = {
        fullName: formData.fullName.trim(),
        houseId: formData.houseId,
        categoryId: formData.categoryId
      };

      if (editingPlayer) {
        await playerRepository.updatePlayer(editingPlayer.id, playerData);
      } else {
        await playerRepository.createPlayer(playerData);
      }

      resetForm();
    } catch (err) {
      console.error('Error saving player:', err);
      if (err instanceof Error) {
        alert(`Failed to save player: ${err.message}`);
      } else {
        alert('Failed to save player');
      }
    }
  };

  const handleEdit = (player: Player) => {
    setFormData({
      fullName: player.fullName,
      houseId: player.houseId,
      categoryId: player.categoryId
    });
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = async (player: Player) => {
    if (!confirm(`Are you sure you want to delete ${player.fullName}?`)) {
      return;
    }

    try {
      await playerRepository.deletePlayer(player.id);
    } catch (err) {
      console.error('Error deleting player:', err);
      if (err instanceof Error) {
        alert(`Failed to delete player: ${err.message}`);
      } else {
        alert('Failed to delete player');
      }
    }
  };

  const getHouseName = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    return house?.name || 'Unknown';
  };

  const getHouseColor = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    return house?.colorHex || '#6c757d';
  };

  const getCategoryLabel = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.label || 'Unknown';
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
            👥 Loading players...
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
          👥 Player Management
        </h1>
        <p className="mobile-subtitle" style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '2rem'
        }}>
          Add and manage your family players
        </p>

        <button
          onClick={() => setShowForm(true)}
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
          Add New Player
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
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
                  {editingPlayer ? '✏️ Edit Player' : '👤 Create New Player'}
                </h5>
                <p className="mb-0" style={{ opacity: '0.9' }}>
                  {editingPlayer ? 'Update player details' : 'Add a new player to your family games'}
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
            <form onSubmit={handleSubmit}>
              <div className="row g-4">
                <div className="col-12">
                  <label className="form-label fw-bold mb-3" style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem'
                  }}>
                    👤 Player Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="form-control"
                    placeholder="Enter player's full name (e.g., John Smith)"
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
                    🏘️ House
                  </label>
                  <select
                    value={formData.houseId}
                    onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
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
                    <option value="">Select a house</option>
                    {houses.map((house) => (
                      <option key={house.id} value={house.id}>
                        {house.name}
                      </option>
                    ))}
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
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
                    <option value="">Select a category</option>
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
                  style={{
                    borderRadius: '16px',
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  {editingPlayer ? '💾 Update Player' : '👤 Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Players List - Mobile-Optimized Cards */}
      <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
        {players.map((player) => {
          const houseColor = getHouseColor(player.houseId);
          const houseName = getHouseName(player.houseId);
          const categoryLabel = getCategoryLabel(player.categoryId);
          
          return (
            <div key={player.id} className="mb-4">
              <div 
                className="card"
                style={{
                  background: `linear-gradient(135deg, ${houseColor}25, ${houseColor}15)`,
                  backdropFilter: 'blur(20px)',
                  border: `2px solid ${houseColor}40`,
                  borderRadius: '24px',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: `0 8px 25px ${houseColor}20`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-3px)';
                  e.currentTarget.style.boxShadow = `0 12px 35px ${houseColor}30`;
                  e.currentTarget.style.borderColor = `${houseColor}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 8px 25px ${houseColor}20`;
                  e.currentTarget.style.borderColor = `${houseColor}40`;
                }}
              >
                <div className="card-body p-4">
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                    {/* Left Side - Player Info */}
                    <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                      {/* House Color Circle - Prominent */}
                      <div 
                        className="rounded-circle flex-shrink-0"
                        style={{
                          width: '50px',
                          height: '50px',
                          background: `linear-gradient(135deg, ${houseColor}, ${houseColor}dd)`,
                          border: '3px solid rgba(255,255,255,0.3)',
                          boxShadow: `0 4px 15px ${houseColor}40`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ 
                          fontSize: '1.5rem',
                          filter: 'brightness(0) invert(1)'
                        }}>
                          👤
                        </span>
                      </div>
                      
                      {/* Player Details */}
                      <div className="flex-grow-1 min-width-0">
                        <h5 className="card-title mb-2" style={{
                          color: 'white',
                          fontWeight: '700',
                          fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
                          textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                          lineHeight: '1.2',
                          wordBreak: 'break-word',
                          marginBottom: '0.5rem'
                        }}>
                          {player.fullName}
                        </h5>
                        
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                          {/* House Badge */}
                          <div className="d-flex align-items-center gap-2" style={{
                            background: 'rgba(0,0,0,0.2)',
                            padding: '0.3rem 0.7rem',
                            borderRadius: '12px',
                            backdropFilter: 'blur(10px)'
                          }}>
                            <div 
                              className="rounded-circle"
                              style={{
                                width: '12px',
                                height: '12px',
                                background: houseColor,
                                border: '1px solid rgba(255,255,255,0.5)',
                                boxShadow: `0 1px 4px ${houseColor}50`
                              }}
                            />
                            <span style={{
                              fontSize: '0.8rem',
                              color: 'rgba(255,255,255,0.9)',
                              fontWeight: '500'
                            }}>
                              {houseName}
                            </span>
                          </div>
                          
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
                            {categoryLabel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Side - Action Buttons */}
                    <div className="d-flex gap-2 flex-shrink-0">
                      <button 
                        className="btn"
                        onClick={() => handleEdit(player)}
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
                          minWidth: '60px',
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
                        onClick={() => handleDelete(player)}
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
                          minWidth: '60px',
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
                    background: `linear-gradient(90deg, ${houseColor}, ${houseColor}aa)`
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="text-center py-5 fade-in-up" style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          border: '2px dashed rgba(255,255,255,0.2)',
          margin: '2rem 0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>👥</div>
          <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontWeight: '600' }}>
            No Players Added Yet
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Add your first player to start organizing family games
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{
              borderRadius: '20px',
              padding: '0.75rem 2rem',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
            }}
          >
            👤 Add First Player
          </button>
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: '2rem' }}></div>
    </div>
  );
};

export default PlayerManagement;
