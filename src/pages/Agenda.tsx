import { useState, useEffect } from 'react';
import { EventInstance, SpecialAward, PlayerCategory, EventStatus } from '../types';
import { eventInstanceService, specialAwardService } from '../services/firestore';

const Agenda = () => {
  const [events, setEvents] = useState<EventInstance[]>([]);
  const [awards, setAwards] = useState<SpecialAward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | EventStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | PlayerCategory>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [selectedEvent, setSelectedEvent] = useState<EventInstance | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listener for all events
    const unsubscribeEvents = eventInstanceService.subscribeToAll((eventsData) => {
      setEvents(eventsData);
      
      // Load awards for completed events
      loadAwardsForEvents(eventsData.filter(event => event.status === 'completed'));
    });

    setIsLoading(false);

    // Cleanup listener on unmount
    return () => {
      unsubscribeEvents();
    };
  }, []);

  const loadAwardsForEvents = async (completedEvents: EventInstance[]) => {
    try {
      const allAwards: SpecialAward[] = [];
      for (const event of completedEvents) {
        const eventAwards = await specialAwardService.getByEventInstance(event.id);
        allAwards.push(...eventAwards);
      }
      setAwards(allAwards);
    } catch (err) {
      console.error('Error loading awards:', err);
    }
  };

  const loadEvents = async () => {
    // This function is kept for backwards compatibility but not used
    // Real-time listeners handle the data loading now
    try {
      setIsLoading(true);
      setError(null);

      const eventsData = await eventInstanceService.getAll();
      
      const allAwards: SpecialAward[] = [];
      const completedEvents = eventsData.filter(event => event.status === 'completed');
      
      for (const event of completedEvents) {
        const eventAwards = await specialAwardService.getByEventInstance(event.id);
        allAwards.push(...eventAwards);
      }

      setEvents(eventsData);
      setAwards(allAwards);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      kids: 'Kids',
      elders: 'Elders',
      adult_men: 'Men',
      adult_women: 'Women'
    };
    return names[category] || category;
  };

  const getStatusBadge = (status: EventStatus) => {
    const badges = {
      scheduled: 'bg-gray-100 text-gray-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700'
    };
    return badges[status];
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

  const getEventAwards = (eventId: string) => {
    return awards.filter(award => award.eventInstanceId === eventId);
  };

  const filteredEvents = events.filter(event => {
    if (statusFilter !== 'all' && event.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && event.category !== categoryFilter) return false;
    if (typeFilter !== 'all' && event.type !== typeFilter) return false;
    return true;
  });

  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const key = event.baseEventName;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(event);
    return groups;
  }, {} as Record<string, EventInstance[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading events...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={loadEvents}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Events Agenda</h1>
        <p className="text-gray-600 mt-2">View all scheduled, ongoing, and completed events</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | EventStatus)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as 'all' | PlayerCategory)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="kids">Kids</option>
                <option value="elders">Elders</option>
                <option value="adult_men">Men</option>
                <option value="adult_women">Women</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as 'all' | 'individual' | 'group')}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="individual">Individual</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No events match the selected filters
          </div>
        ) : (
          Object.entries(groupedEvents).map(([eventName, eventInstances]) => (
            <div key={eventName} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">{eventName}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {eventInstances.length} categor{eventInstances.length !== 1 ? 'ies' : 'y'}
                </p>
              </div>
              
              <div className="divide-y divide-gray-200">
                {eventInstances
                  .sort((a, b) => {
                    const statusOrder = { 'scheduled': 1, 'in-progress': 2, 'completed': 3 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  })
                  .map((event) => {
                    const eventAwards = getEventAwards(event.id);
                    const winner = event.results.find(r => r.position === 1);
                    
                    return (
                      <div key={event.id} className="p-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
                                {getCategoryName(event.category)}
                              </span>
                              
                              <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-700 rounded-full">
                                {event.type === 'individual' ? 'Individual' : 'Group'}
                              </span>
                              
                              <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(event.status)}`}>
                                {event.status === 'in-progress' ? 'In Progress' : 
                                 event.status === 'completed' ? 'Completed' : 'Scheduled'}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>1st: {event.scoring.firstPlace} pts</span>
                                <span>2nd: {event.scoring.secondPlace} pts</span>
                                <span>3rd: {event.scoring.thirdPlace} pts</span>
                              </div>

                              {event.status === 'completed' && winner && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Winner: </span>
                                  <span className="font-medium text-gray-900">
                                    {event.type === 'individual' 
                                      ? `${winner.playerName} (${winner.houseName})`
                                      : winner.houseName
                                    }
                                  </span>
                                </div>
                              )}

                              {eventAwards.length > 0 && (
                                <div className="text-sm">
                                  <span className="text-gray-600">Special Awards: </span>
                                  <span className="text-gray-900">
                                    {eventAwards.map(award => `${award.category}: ${award.winnerName}`).join(', ')}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right mt-3 sm:mt-0 text-sm text-gray-500">
                            {event.status === 'completed' && event.endTime ? (
                              <div>Completed: {formatDate(event.endTime)}</div>
                            ) : event.status === 'in-progress' && event.startTime ? (
                              <div>Started: {formatDate(event.startTime)}</div>
                            ) : event.startTime ? (
                              <div>Scheduled: {formatDate(event.startTime)}</div>
                            ) : (
                              <div>Not scheduled</div>
                            )}
                          </div>
                        </div>

                        {(event.status === 'completed' && event.results.length > 1) && (
                          <button
                            onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                            className="mt-3 text-sm text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            {selectedEvent?.id === event.id ? 'Hide Results' : 'Show Full Results'}
                          </button>
                        )}

                        {selectedEvent?.id === event.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h4 className="font-medium text-gray-900 mb-2">Full Results</h4>
                            <div className="space-y-1">
                              {selectedEvent.results
                                .sort((a, b) => a.position - b.position)
                                .map((result) => (
                                  <div key={result.position} className="flex items-center justify-between text-sm">
                                    <span>
                                      {result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : result.position === 3 ? '🥉' : `${result.position}.`}
                                      {' '}
                                      {selectedEvent.type === 'individual' 
                                        ? `${result.playerName} (${result.houseName})`
                                        : result.houseName
                                      }
                                    </span>
                                    <span className="text-gray-600">
                                      {result.position === 1 ? selectedEvent.scoring.firstPlace :
                                       result.position === 2 ? selectedEvent.scoring.secondPlace :
                                       result.position === 3 ? selectedEvent.scoring.thirdPlace : 0} pts
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Agenda;