import { useState } from 'react';
import { Player, House, PlayerCategory, LeaderboardEntry } from '../../types';

interface IndividualLeaderboardProps {
  players: Player[];
  houses: House[];
}

const IndividualLeaderboard = ({ players, houses }: IndividualLeaderboardProps) => {
  const [activeView, setActiveView] = useState<'overall' | PlayerCategory>('overall');

  const getHouseName = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    return house?.name || 'Unknown';
  };

  const getLeaderboardData = (): LeaderboardEntry[] => {
    let filteredPlayers = players;
    
    if (activeView !== 'overall') {
      filteredPlayers = players.filter(player => player.category === activeView);
    }

    return filteredPlayers
      .sort((a, b) => b.individualScore - a.individualScore)
      .map((player, index) => ({
        position: index + 1,
        name: player.name,
        score: player.individualScore,
        houseId: player.houseId,
        houseName: getHouseName(player.houseId),
        category: player.category
      }));
  };

  const getPositionBadge = (position: number) => {
    const badges = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      2: 'bg-gray-100 text-gray-800 border-gray-200',
      3: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return badges[position as keyof typeof badges] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  const getCategoryName = (category: PlayerCategory) => {
    const names = {
      kids: 'Kids',
      elders: 'Elders',
      adult_men: 'Men',
      adult_women: 'Women'
    };
    return names[category];
  };

  const getCategoryBadge = (category: PlayerCategory) => {
    const badges = {
      kids: 'bg-blue-100 text-blue-700',
      elders: 'bg-purple-100 text-purple-700',
      adult_men: 'bg-green-100 text-green-700',
      adult_women: 'bg-pink-100 text-pink-700'
    };
    return badges[category];
  };

  const leaderboardData = getLeaderboardData();

  return (
    <div className="card">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 sm:mb-0">
          Individual Leaderboard
        </h2>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView('overall')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              activeView === 'overall'
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Overall
          </button>
          {(['kids', 'elders', 'adult_men', 'adult_women'] as PlayerCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setActiveView(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                activeView === category
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {leaderboardData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No players available
          </div>
        ) : (
          leaderboardData.map((entry) => (
            <div
              key={`${entry.name}-${entry.houseId}-${activeView}`}
              className={`leaderboard-item rounded-lg ${
                entry.position <= 3 ? 'bg-gradient-to-r from-gray-50 to-white' : ''
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getPositionBadge(
                    entry.position
                  )}`}
                >
                  {entry.position}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{entry.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-gray-500">{entry.houseName}</span>
                    {activeView === 'overall' && (
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCategoryBadge(
                          entry.category!
                        )}`}
                      >
                        {getCategoryName(entry.category!)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <span className="text-lg font-bold text-blue-600">
                  {entry.score}
                </span>
                <p className="text-xs text-gray-500">points</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default IndividualLeaderboard;