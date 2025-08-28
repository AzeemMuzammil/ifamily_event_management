import { EventInstance } from '../../types';

interface UpcomingEventsProps {
  events: EventInstance[];
}

const UpcomingEvents = ({ events }: UpcomingEventsProps) => {
  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      kids: 'Kids',
      elders: 'Elders',
      adult_men: 'Men',
      adult_women: 'Women'
    };
    return names[category] || category;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'scheduled') {
      return 'bg-gray-100 text-gray-700';
    } else if (status === 'in-progress') {
      return 'bg-yellow-100 text-yellow-700';
    }
    return 'bg-gray-100 text-gray-700';
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Events</h2>
      
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No upcoming events
          </div>
        ) : (
          events.slice(0, 6).map((event) => (
            <div key={event.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 mb-1">
                    {event.baseEventName}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      {getCategoryName(event.category)}
                    </span>
                    
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                      {event.type === 'individual' ? 'Individual' : 'Group'}
                    </span>
                    
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(event.status)}`}>
                      {event.status === 'scheduled' ? 'Scheduled' : 
                       event.status === 'in-progress' ? 'In Progress' : 
                       event.status}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-4">
                      <span>
                        1st: {event.scoring.firstPlace} pts
                      </span>
                      <span>
                        2nd: {event.scoring.secondPlace} pts
                      </span>
                      <span>
                        3rd: {event.scoring.thirdPlace} pts
                      </span>
                    </div>
                  </div>
                </div>

                {event.startTime && (
                  <div className="text-right mt-2 sm:mt-0">
                    <span className="text-xs text-gray-500">
                      {formatDate(event.startTime)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingEvents;