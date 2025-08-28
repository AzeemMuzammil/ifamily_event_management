import { useState, useEffect } from 'react';
import { Player, House, PlayerCategory } from '../../types';
import { playerService, houseService } from '../../services/firestore';

const PlayerManagement = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    houseId: '',
    category: 'kids' as PlayerCategory
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribePlayers = playerService.subscribeToAll((playersData) => {
      setPlayers(playersData);
    });

    const unsubscribeHouses = houseService.subscribeToAll((housesData) => {
      setHouses(housesData);
    });

    setIsLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribePlayers();
      unsubscribeHouses();
    };
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [playersData, housesData] = await Promise.all([
        playerService.getAll(),
        houseService.getAll()
      ]);
      setPlayers(playersData);
      setHouses(housesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', houseId: '', category: 'kids' });
    setEditingPlayer(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.houseId) {
      alert('Please fill in all fields');
      return;
    }

    try {
      const playerData = {
        name: formData.name.trim(),
        houseId: formData.houseId,
        category: formData.category,
        individualScore: 0,
        categoryScore: 0
      };

      if (editingPlayer) {
        await playerService.update(editingPlayer.id, playerData);
      } else {
        await playerService.create(playerData);
      }

      await loadData();
      resetForm();
    } catch (err) {
      console.error('Error saving player:', err);
      alert('Failed to save player');
    }
  };

  const handleEdit = (player: Player) => {
    setFormData({
      name: player.name,
      houseId: player.houseId,
      category: player.category
    });
    setEditingPlayer(player);
    setShowForm(true);
  };

  const handleDelete = async (player: Player) => {
    if (!confirm(`Are you sure you want to delete ${player.name}?`)) {
      return;
    }

    try {
      await playerService.delete(player.id);
      await loadData();
    } catch (err) {
      console.error('Error deleting player:', err);
      alert('Failed to delete player');
    }
  };

  const getHouseName = (houseId: string) => {
    const house = houses.find(h => h.id === houseId);
    return house?.name || 'Unknown';
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading players...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={loadData} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Player Management</h1>
          <p className="text-gray-600 mt-2">Add, edit, and manage players</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary mt-4 sm:mt-0"
        >
          Add Player
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </h2>
            <button
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  House
                </label>
                <select
                  value={formData.houseId}
                  onChange={(e) => setFormData({ ...formData, houseId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select a house</option>
                  {houses.map((house) => (
                    <option key={house.id} value={house.id}>
                      {house.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as PlayerCategory })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="kids">Kids</option>
                  <option value="elders">Elders</option>
                  <option value="adult_men">Men</option>
                  <option value="adult_women">Women</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {editingPlayer ? 'Update Player' : 'Add Player'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Players ({players.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  House
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {player.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getHouseName(player.houseId)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryBadge(player.category)}`}>
                      {getCategoryName(player.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.individualScore} pts
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(player)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(player)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {players.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No players found
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerManagement;