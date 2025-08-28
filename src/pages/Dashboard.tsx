import { useState, useEffect } from 'react';
import { House, Player, EventInstance, SpecialAward } from '../types';
import { houseService, playerService, eventInstanceService, specialAwardService } from '../services/firestore';
import HouseLeaderboard from '../components/dashboard/HouseLeaderboard';
import IndividualLeaderboard from '../components/dashboard/IndividualLeaderboard';
import RecentEvents from '../components/dashboard/RecentEvents';
import UpcomingEvents from '../components/dashboard/UpcomingEvents';

const Dashboard = () => {
  const [houses, setHouses] = useState<House[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [recentEvents, setRecentEvents] = useState<EventInstance[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventInstance[]>([]);
  const [awards, setAwards] = useState<SpecialAward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // Set up real-time listeners
    const unsubscribeHouses = houseService.subscribeToAll((housesData) => {
      setHouses(housesData);
    });

    const unsubscribePlayers = playerService.subscribeToAll((playersData) => {
      setPlayers(playersData);
    });

    const unsubscribeCompletedEvents = eventInstanceService.subscribeToCompleted((completedEvents) => {
      setRecentEvents(completedEvents);
      
      // Load awards for recent events
      loadAwardsForEvents(completedEvents.slice(0, 5));
    });

    const unsubscribeUpcomingEvents = eventInstanceService.subscribeToUpcoming((upcomingEvents) => {
      setUpcomingEvents(upcomingEvents);
    });

    setIsLoading(false);

    // Cleanup listeners on unmount
    return () => {
      unsubscribeHouses();
      unsubscribePlayers();
      unsubscribeCompletedEvents();
      unsubscribeUpcomingEvents();
    };
  }, []);

  const loadAwardsForEvents = async (events: EventInstance[]) => {
    try {
      const allAwards: SpecialAward[] = [];
      for (const event of events) {
        const eventAwards = await specialAwardService.getByEventInstance(event.id);
        allAwards.push(...eventAwards);
      }
      setAwards(allAwards);
    } catch (err) {
      console.error('Error loading awards:', err);
    }
  };

  const loadDashboardData = async () => {
    // This function is kept for backwards compatibility but not used
    // Real-time listeners handle the data loading now
    try {
      setIsLoading(true);
      setError(null);

      const [housesData, playersData, eventsData] = await Promise.all([
        houseService.getAll(),
        playerService.getAll(),
        eventInstanceService.getAll()
      ]);

      const completedEvents = eventsData
        .filter(event => event.status === 'completed')
        .sort((a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0));

      const pendingEvents = eventsData
        .filter(event => event.status !== 'completed')
        .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0));

      const allAwards: SpecialAward[] = [];
      for (const event of completedEvents.slice(0, 5)) {
        const eventAwards = await specialAwardService.getByEventInstance(event.id);
        allAwards.push(...eventAwards);
      }

      setHouses(housesData);
      setPlayers(playersData);
      setRecentEvents(completedEvents);
      setUpcomingEvents(pendingEvents);
      setAwards(allAwards);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{height: '300px'}}>
        <div className="text-center">
          <div className="spinner-custom mx-auto mb-3"></div>
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-5">
        <div className="alert alert-danger mx-auto" style={{maxWidth: '400px'}} role="alert">
          {error}
        </div>
        <button 
          onClick={loadDashboardData}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid py-4">
      <div className="mb-4">
        <h1 className="h2 mb-2">Dashboard</h1>
        <p className="text-muted">Current standings and recent activity</p>
      </div>

      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          <HouseLeaderboard houses={houses} />
        </div>
        <div className="col-lg-6 mb-4">
          <IndividualLeaderboard players={players} houses={houses} />
        </div>
      </div>

      <div className="row">
        <div className="col-lg-6 mb-4">
          <RecentEvents events={recentEvents} awards={awards} />
        </div>
        <div className="col-lg-6 mb-4">
          <UpcomingEvents events={upcomingEvents} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;