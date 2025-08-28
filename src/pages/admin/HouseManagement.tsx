import { useState, useEffect } from 'react';
import { House } from '../../types';
import { houseRepository } from '../../database';

const HouseManagement = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({ 
    name: '', 
    colorHex: '#E53935' // Default red color
  });

  // Predefined color palette for house selection
  const colorPalette = [
    { name: 'Coral Red', hex: '#FF6B6B' },
    { name: 'Ocean Blue', hex: '#4ECDC4' },
    { name: 'Sunset Orange', hex: '#FFB84D' },
    { name: 'Forest Green', hex: '#51CF66' },
    { name: 'Royal Purple', hex: '#9775FA' },
    { name: 'Rose Pink', hex: '#FF8CC8' },
    { name: 'Golden Yellow', hex: '#FFD43B' },
    { name: 'Sky Blue', hex: '#74C0FC' },
    { name: 'Mint Green', hex: '#8CE99A' },
    { name: 'Lavender', hex: '#D0BFFF' },
    { name: 'Salmon', hex: '#FFA8A8' },
    { name: 'Teal', hex: '#3BC9DB' },
    { name: 'Lime', hex: '#94D82D' },
    { name: 'Peach', hex: '#FFDEEB' },
    { name: 'Indigo', hex: '#5C7CFA' },
    { name: 'Emerald', hex: '#12B886' },
    { name: 'Ruby', hex: '#E03131' },
    { name: 'Amber', hex: '#FAB005' },
    { name: 'Violet', hex: '#7950F2' },
    { name: 'Cyan', hex: '#15AABF' }
  ];

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listener for houses
    const unsubscribeHouses = houseRepository.subscribeToAllHouses((housesData) => {
      setHouses(housesData);
    });

    setIsLoading(false);

    // Cleanup listener on unmount
    return () => {
      unsubscribeHouses();
    };
  }, []);

  const loadHouses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const housesData = await houseRepository.getAllHouses();
      setHouses(housesData);
    } catch (err) {
      console.error('Error loading houses:', err);
      setError('Failed to load houses');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', colorHex: '#E53935' });
    setEditingHouse(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a house name');
      return;
    }

    if (!formData.colorHex.trim()) {
      alert('Please select a house color');
      return;
    }

    try {
      // Check if name is already taken
      const nameTaken = await houseRepository.isNameTaken(
        formData.name, 
        editingHouse?.id
      );
      
      if (nameTaken) {
        alert('A house with this name already exists. Please choose a different name.');
        return;
      }

      if (editingHouse) {
        await houseRepository.updateHouse(editingHouse.id, {
          name: formData.name.trim(),
          colorHex: formData.colorHex
        });
      } else {
        await houseRepository.createHouse({
          name: formData.name.trim(),
          colorHex: formData.colorHex
        });
      }

      resetForm();
    } catch (err) {
      console.error('Error saving house:', err);
      if (err instanceof Error) {
        alert(`Failed to save house: ${err.message}`);
      } else {
        alert('Failed to save house');
      }
    }
  };

  const handleEdit = (house: House) => {
    setFormData({ 
      name: house.name, 
      colorHex: house.colorHex 
    });
    setEditingHouse(house);
    setShowForm(true);
  };

  const handleDelete = async (house: House) => {
    if (!confirm(`Are you sure you want to delete "${house.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await houseRepository.deleteHouse(house.id);
    } catch (err) {
      console.error('Error deleting house:', err);
      if (err instanceof Error) {
        alert(`Failed to delete house: ${err.message}`);
      } else {
        alert('Failed to delete house');
      }
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
            🏘️ Loading houses...
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
        <button onClick={loadHouses} className="btn btn-primary pulse-animation">
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
          🏘️ House Management
        </h1>
        <p className="mobile-subtitle" style={{
          color: 'rgba(255, 255, 255, 0.9)',
          fontWeight: '500',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          marginBottom: '2rem'
        }}>
          Create and manage your family houses
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
          Add New House
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
                  {editingHouse ? '✏️ Edit House' : '🏠 Create New House'}
                </h5>
                <p className="mb-0" style={{ opacity: '0.9' }}>
                  {editingHouse ? 'Update house details' : 'Add a new house to your family games'}
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
                    🏷️ House Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-control"
                    placeholder="Enter house name (e.g., Phoenix Warriors, Dragon Champions)"
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

                <div className="col-12">
                  <label className="form-label fw-bold mb-3" style={{
                    color: 'var(--text-primary)',
                    fontSize: '1.1rem'
                  }}>
                    🎨 Choose House Color
                  </label>
                  
                  {/* Color Palette Grid - Compact */}
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    {colorPalette.map((color) => (
                      <div
                        key={color.hex}
                        onClick={() => setFormData({ ...formData, colorHex: color.hex })}
                        title={color.name}
                        style={{
                          width: '40px',
                          height: '40px',
                          background: `linear-gradient(135deg, ${color.hex}, ${color.hex}dd)`,
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          border: formData.colorHex === color.hex 
                            ? '3px solid white' 
                            : '2px solid rgba(255,255,255,0.3)',
                          boxShadow: formData.colorHex === color.hex
                            ? `0 6px 20px ${color.hex}50`
                            : '0 2px 8px rgba(0,0,0,0.1)',
                          transform: formData.colorHex === color.hex ? 'scale(1.1)' : 'scale(1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        onMouseEnter={(e) => {
                          if (formData.colorHex !== color.hex) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = `0 4px 15px ${color.hex}40`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (formData.colorHex !== color.hex) {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                          }
                        }}
                      >
                        {formData.colorHex === color.hex && (
                          <span style={{ color: 'white', fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                            ✓
                          </span>
                        )}
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
                  style={{
                    borderRadius: '16px',
                    padding: '0.75rem 2rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
                  }}
                >
                  {editingHouse ? '💾 Update House' : '🏠 Create House'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Houses Grid - Mobile-Optimized Cards */}
      <div className="fade-in-up" style={{ animationDelay: '0.3s' }}>
        {houses.map((house) => (
          <div key={house.id} className="mb-4">
            <div 
              className="card"
              style={{
                background: `linear-gradient(135deg, ${house.colorHex}25, ${house.colorHex}15)`,
                backdropFilter: 'blur(20px)',
                border: `2px solid ${house.colorHex}40`,
                borderRadius: '24px',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 8px 25px ${house.colorHex}20`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = `0 12px 35px ${house.colorHex}30`;
                e.currentTarget.style.borderColor = `${house.colorHex}60`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 8px 25px ${house.colorHex}20`;
                e.currentTarget.style.borderColor = `${house.colorHex}40`;
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
                  {/* Left Side - House Info */}
                  <div className="d-flex align-items-center gap-3 flex-grow-1 min-width-0">
                    {/* Color Circle - Larger and more prominent */}
                    <div 
                      className="rounded-circle flex-shrink-0"
                      style={{
                        width: '50px',
                        height: '50px',
                        background: `linear-gradient(135deg, ${house.colorHex}, ${house.colorHex}dd)`,
                        border: '3px solid rgba(255,255,255,0.3)',
                        boxShadow: `0 4px 15px ${house.colorHex}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <div 
                        className="rounded-circle"
                        style={{
                          width: '20px',
                          height: '20px',
                          background: 'rgba(255,255,255,0.8)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                        }}
                      />
                    </div>
                    
                    {/* House Details */}
                    <div className="flex-grow-1 min-width-0">
                      <h5 className="card-title mb-1" style={{
                        color: 'white',
                        fontWeight: '700',
                        fontSize: 'clamp(1.2rem, 5vw, 1.6rem)',
                        textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        lineHeight: '1.2',
                        wordBreak: 'break-word',
                        marginBottom: '0.25rem'
                      }}>
                        {house.name}
                      </h5>
                      <div className="d-flex align-items-center gap-2">
                        <span style={{
                          fontSize: '0.8rem',
                          color: 'rgba(255,255,255,0.8)',
                          fontWeight: '500',
                          fontFamily: 'monospace',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '8px',
                          backdropFilter: 'blur(10px)'
                        }}>
                          {house.colorHex}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Action Buttons */}
                  <div className="d-flex gap-2 flex-shrink-0">
                    <button 
                      className="btn"
                      onClick={() => handleEdit(house)}
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
                      onClick={() => handleDelete(house)}
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
                  background: `linear-gradient(90deg, ${house.colorHex}, ${house.colorHex}aa)`
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {houses.length === 0 && (
        <div className="text-center py-5 fade-in-up" style={{
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '24px',
          border: '2px dashed rgba(255,255,255,0.2)',
          margin: '2rem 0'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🏠</div>
          <h4 style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '1rem', fontWeight: '600' }}>
            No Houses Created Yet
          </h4>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '2rem' }}>
            Create your first house to start organizing family games
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
            🏠 Create First House
          </button>
        </div>
      )}

      {/* Bottom Spacing */}
      <div style={{ height: '2rem' }}></div>
    </div>
  );
};

export default HouseManagement;
