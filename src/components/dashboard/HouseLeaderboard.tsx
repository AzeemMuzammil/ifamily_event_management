import { useState, memo } from 'react';
import { House, PlayerCategory, LeaderboardEntry } from '../../types';

interface HouseLeaderboardProps {
  houses: House[];
}

const HouseLeaderboard = ({ houses }: HouseLeaderboardProps) => {
  const [activeView, setActiveView] = useState<'overall' | PlayerCategory>('overall');

  const getLeaderboardData = (): LeaderboardEntry[] => {
    if (activeView === 'overall') {
      return houses
        .sort((a, b) => b.totalScore - a.totalScore)
        .map((house, index) => ({
          position: index + 1,
          name: house.name,
          score: house.totalScore,
          houseId: house.id,
          houseName: house.name
        }));
    } else {
      return houses
        .sort((a, b) => b.categoryScores[activeView] - a.categoryScores[activeView])
        .map((house, index) => ({
          position: index + 1,
          name: house.name,
          score: house.categoryScores[activeView],
          houseId: house.id,
          houseName: house.name,
          category: activeView
        }));
    }
  };

  const getPositionBadge = (position: number) => {
    const badges = {
      1: 'position-1',
      2: 'position-2',
      3: 'position-3'
    };
    return badges[position as keyof typeof badges] || 'position-badge bg-light text-muted border';
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

  const leaderboardData = getLeaderboardData();

  return (
    <div className="card h-100">
      <div className="card-header d-flex flex-column flex-sm-row justify-content-between align-items-start">
        <h2 className="card-title h5 mb-2 mb-sm-0">House Leaderboard</h2>
        
        <div className="d-flex flex-wrap gap-1">
          <button
            onClick={() => setActiveView('overall')}
            className={`btn btn-sm ${
              activeView === 'overall'
                ? 'btn-primary'
                : 'btn-outline-secondary'
            }`}
          >
            Overall
          </button>
          {(['kids', 'elders', 'adult_men', 'adult_women'] as PlayerCategory[]).map((category) => (
            <button
              key={category}
              onClick={() => setActiveView(category)}
              className={`btn btn-sm ${
                activeView === category
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
            >
              {getCategoryName(category)}
            </button>
          ))}
        </div>
      </div>

      <div className="card-body">
        {leaderboardData.length === 0 ? (
          <div className="text-center py-4 text-muted">
            No houses available
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {leaderboardData.map((entry) => (
              <div
                key={`${entry.houseId}-${activeView}`}
                className={`list-group-item d-flex justify-content-between align-items-center ${
                  entry.position <= 3 ? 'bg-light' : ''
                }`}
              >
                <div className="d-flex align-items-center">
                  <span className={`position-badge me-3 ${getPositionBadge(entry.position)}`}>
                    {entry.position}
                  </span>
                  <div>
                    <h6 className="mb-0">{entry.name}</h6>
                    {activeView !== 'overall' && (
                      <small className="text-muted">
                        {getCategoryName(activeView)} Category
                      </small>
                    )}
                  </div>
                </div>
                
                <div className="text-end">
                  <span className="h5 text-primary mb-0">
                    {entry.score}
                  </span>
                  <br />
                  <small className="text-muted">points</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(HouseLeaderboard);