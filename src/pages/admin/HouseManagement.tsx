import { useState, useEffect } from 'react';
import { House } from '../../types';
import { houseService } from '../../services/firestore';

const HouseManagement = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listener for houses
    const unsubscribeHouses = houseService.subscribeToAll((housesData) => {
      setHouses(housesData.sort((a, b) => b.totalScore - a.totalScore));
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
      const housesData = await houseService.getAll();
      setHouses(housesData.sort((a, b) => b.totalScore - a.totalScore));
    } catch (err) {
      console.error('Error loading houses:', err);
      setError('Failed to load houses');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '' });
    setEditingHouse(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a house name');
      return;
    }

    try {
      if (editingHouse) {
        await houseService.update(editingHouse.id, {
          name: formData.name.trim()
        });
      } else {
        const houseData = {
          name: formData.name.trim(),
          totalScore: 0,
          categoryScores: {
            kids: 0,
            elders: 0,
            adult_men: 0,
            adult_women: 0
          }
        };
        await houseService.create(houseData);
      }

      await loadHouses();
      resetForm();
    } catch (err) {
      console.error('Error saving house:', err);
      alert('Failed to save house');
    }
  };

  const handleEdit = (house: House) => {
    setFormData({ name: house.name });
    setEditingHouse(house);
    setShowForm(true);
  };

  const handleDelete = async (house: House) => {
    if (!confirm(`Are you sure you want to delete "${house.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await houseService.delete(house.id);
      await loadHouses();
    } catch (err) {
      console.error('Error deleting house:', err);
      alert('Failed to delete house');
    }
  };

  const getPositionBadge = (position: number) => {
    const badges = {
      1: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      2: 'bg-gray-100 text-gray-800 border-gray-200',
      3: 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return badges[position as keyof typeof badges] || 'bg-gray-50 text-gray-600 border-gray-100';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading houses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button onClick={loadHouses} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">House Management</h1>
          <p className="text-gray-600 mt-2">Add, edit, and manage houses/groups</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary mt-4 sm:mt-0"
        >
          Add House
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {editingHouse ? 'Edit House' : 'Add New House'}
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                House Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full max-w-md border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter house name"
                required
              />
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
                {editingHouse ? 'Update House' : 'Add House'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {houses.map((house, index) => (
          <div key={house.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span
                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold border ${getPositionBadge(
                    index + 1
                  )}`}
                >
                  {index + 1}
                </span>
                <h3 className="text-lg font-semibold text-gray-900">{house.name}</h3>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(house)}
                  className="text-gray-400 hover:text-gray-600"
                  title="Edit house"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(house)}
                  className="text-red-400 hover:text-red-600"
                  title="Delete house"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {house.totalScore}
                </div>
                <div className="text-sm text-gray-500">Total Points</div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Kids:</span>
                  <span className="font-medium">{house.categoryScores.kids} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Elders:</span>
                  <span className="font-medium">{house.categoryScores.elders} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Men:</span>
                  <span className="font-medium">{house.categoryScores.adult_men} pts</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Women:</span>
                  <span className="font-medium">{house.categoryScores.adult_women} pts</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {houses.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-xl mb-2">No houses found</div>
          <p>Add your first house to get started</p>
        </div>
      )}
    </div>
  );
};

export default HouseManagement;