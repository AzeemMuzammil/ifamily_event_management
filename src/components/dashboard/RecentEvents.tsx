import { EventInstance, SpecialAward } from '../../types';

interface RecentEventsProps {
  events: EventInstance[];
  awards: SpecialAward[];
}

const RecentEvents = ({ events, awards }: RecentEventsProps) => {
  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      kids: 'Kids',
      elders: 'Elders',
      adult_men: 'Men',
      adult_women: 'Women'
    };
    return names[category] || category;
  };

  const getEventAwards = (eventId: string) => {
    return awards.filter(award => award.eventInstanceId === eventId);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getWinnerDisplay = (event: EventInstance) => {
    const winner = event.results.find(r => r.position === 1);
    if (!winner) return 'No winner recorded';
    
    if (event.type === 'individual') {
      return `${winner.playerName} (${winner.houseName})`;
    } else {
      return winner.houseName;
    }
  };

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Events</h2>
      
      <div className="space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent events
          </div>
        ) : (
          events.slice(0, 5).map((event) => {
            const eventAwards = getEventAwards(event.id);
            
            return (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {event.baseEventName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                        {getCategoryName(event.category)}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                        {event.type === 'individual' ? 'Individual' : 'Group'}
                      </span>
                    </div>
                  </div>
                  
                  {event.endTime && (
                    <span className="text-xs text-gray-500 mt-2 sm:mt-0">
                      {formatDate(event.endTime)}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <div className="text-sm">
                    <span className="text-gray-600">Winner: </span>
                    <span className="font-medium text-gray-900">
                      {getWinnerDisplay(event)}
                    </span>
                  </div>

                  {event.results.length > 1 && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="flex flex-wrap gap-4">
                        {event.results.slice(1, 3).map((result) => (
                          <span key={result.position}>
                            {result.position === 2 ? '2nd: ' : '3rd: '}
                            {event.type === 'individual' 
                              ? `${result.playerName} (${result.houseName})`
                              : result.houseName
                            }
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {eventAwards.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <div className="text-sm text-gray-600 mb-1">Special Awards:</div>
                      <div className="space-y-1">
                        {eventAwards.map((award) => (
                          <div key={award.id} className="text-sm">
                            <span className="font-medium text-gray-700">{award.category}:</span>{' '}
                            <span className="text-gray-600">{award.winnerName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentEvents;