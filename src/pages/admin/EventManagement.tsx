import { useState, useEffect } from 'react';
import { BaseEvent, EventInstance, PlayerCategory, House, Player } from '../../types';
import { baseEventService, eventInstanceService, houseService, playerService, createEventInstances } from '../../services/firestore';
import ResultsRecordingModal from '../../components/admin/ResultsRecordingModal';

const EventManagement = () => {
  const [eventInstances, setEventInstances] = useState<EventInstance[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingInstance, setEditingInstance] = useState<EventInstance | null>(null);

  // Form state
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState<'individual' | 'group'>('individual');
  const [selectedCategories, setSelectedCategories] = useState<PlayerCategory[]>([]);
  const [firstPlace, setFirstPlace] = useState(10);
  const [secondPlace, setSecondPlace] = useState(6);
  const [thirdPlace, setThirdPlace] = useState(3);

  const categories: { value: PlayerCategory; label: string }[] = [
    { value: 'kids', label: 'Kids' },
    { value: 'elders', label: 'Elders' },
    { value: 'adult_men', label: 'Adult Men' },
    { value: 'adult_women', label: 'Adult Women' }
  ];

  useEffect(() => {
    const unsubscribeEventInstances = eventInstanceService.subscribeToAll(setEventInstances);
    const unsubscribeHouses = houseService.subscribeToAll(setHouses);
    const unsubscribePlayers = playerService.subscribeToAll(setPlayers);

    return () => {
      unsubscribeEventInstances();
      unsubscribeHouses();
      unsubscribePlayers();
    };
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const baseEventData: Omit<BaseEvent, 'id'> = {
        name: eventName,
        type: eventType,
        categories: selectedCategories,
        scoring: {
          firstPlace,
          secondPlace,
          thirdPlace
        },
        createdAt: new Date()
      };

      const baseEventId = await baseEventService.create(baseEventData);
      await createEventInstances(baseEventId, { id: baseEventId, ...baseEventData });

      // Reset form
      setEventName('');
      setEventType('individual');
      setSelectedCategories([]);
      setFirstPlace(10);
      setSecondPlace(6);
      setThirdPlace(3);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const handleCategoryChange = (category: PlayerCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleStartEvent = async (instance: EventInstance) => {
    try {
      await eventInstanceService.update(instance.id!, {
        status: 'in-progress',
        startTime: new Date()
      });
    } catch (error) {
      console.error('Error starting event:', error);
      alert(`Failed to start event: ${error instanceof Error ? error.message : String(error)}`);
    }
  };


  const getCategoryLabel = (category: PlayerCategory) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-primary';
      case 'in_progress': return 'bg-warning';
      case 'completed': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Event Management</h1>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          Create New Event
        </button>
      </div>

      {/* Create Event Modal */}
      {showCreateForm && (
        <div className="modal d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New Event</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateForm(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateEvent}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Event Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={eventName}
                        onChange={(e) => setEventName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Event Type</label>
                      <select
                        className="form-select"
                        value={eventType}
                        onChange={(e) => setEventType(e.target.value as 'individual' | 'group')}
                      >
                        <option value="individual">Individual</option>
                        <option value="group">Group</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Categories</label>
                    <div className="row">
                      {categories.map((category) => (
                        <div key={category.value} className="col-md-6 mb-2">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id={category.value}
                              checked={selectedCategories.includes(category.value)}
                              onChange={() => handleCategoryChange(category.value)}
                            />
                            <label className="form-check-label" htmlFor={category.value}>
                              {category.label}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-4 mb-3">
                      <label className="form-label">1st Place Points</label>
                      <input
                        type="number"
                        className="form-control"
                        value={firstPlace}
                        onChange={(e) => setFirstPlace(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">2nd Place Points</label>
                      <input
                        type="number"
                        className="form-control"
                        value={secondPlace}
                        onChange={(e) => setSecondPlace(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-4 mb-3">
                      <label className="form-label">3rd Place Points</label>
                      <input
                        type="number"
                        className="form-control"
                        value={thirdPlace}
                        onChange={(e) => setThirdPlace(Number(e.target.value))}
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={selectedCategories.length === 0}
                  >
                    Create Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Event Instances List */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0">Event Instances</h5>
            </div>
            <div className="card-body">
              {eventInstances.length === 0 ? (
                <p className="text-muted text-center py-4">
                  No events created yet. Create your first event to get started!
                </p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Event Name</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Scoring</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {eventInstances.map((instance) => (
                        <tr key={instance.id}>
                          <td className="fw-bold">{instance.eventName}</td>
                          <td>
                            <span className="badge bg-info">
                              {getCategoryLabel(instance.category)}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${instance.type === 'individual' ? 'bg-primary' : 'bg-success'}`}>
                              {instance.type}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(instance.status)}`}>
                              {instance.status}
                            </span>
                          </td>
                          <td>
                            <small className="text-muted">
                              1st: {instance.scoring.firstPlace} | 
                              2nd: {instance.scoring.secondPlace} | 
                              3rd: {instance.scoring.thirdPlace}
                            </small>
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              {instance.status === 'scheduled' && (
                                <button
                                  className="btn btn-outline-success"
                                  onClick={() => handleStartEvent(instance)}
                                >
                                  Start
                                </button>
                              )}
                              {instance.status === 'in-progress' && (
                                <button
                                  className="btn btn-outline-primary"
                                  onClick={() => setEditingInstance(instance)}
                                >
                                  Record Results & Complete
                                </button>
                              )}
                              {instance.status === 'completed' && (
                                <button
                                  className="btn btn-outline-info"
                                  onClick={() => setEditingInstance(instance)}
                                >
                                  View Results
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Recording Modal */}
      {editingInstance && (
        <ResultsRecordingModal
          instance={editingInstance}
          houses={houses}
          players={players}
          onClose={() => setEditingInstance(null)}
          onSave={() => setEditingInstance(null)}
        />
      )}
    </div>
  );
};

export default EventManagement;