import { houseService, playerService, baseEventService, createEventInstances } from '../services/firestore';
import { PlayerCategory } from '../types';

/**
 * Creates sample data for testing the application
 * Run this function from browser console after setting up Firebase
 */
export const createSampleData = async () => {
  try {
    console.log('Creating sample data...');

    // 1. Create houses
    const houses = [
      {
        name: 'Red Dragons',
        totalScore: 0,
        categoryScores: {
          kids: 0,
          elders: 0,
          adult_men: 0,
          adult_women: 0
        }
      },
      {
        name: 'Blue Eagles',
        totalScore: 0,
        categoryScores: {
          kids: 0,
          elders: 0,
          adult_men: 0,
          adult_women: 0
        }
      },
      {
        name: 'Green Lions',
        totalScore: 0,
        categoryScores: {
          kids: 0,
          elders: 0,
          adult_men: 0,
          adult_women: 0
        }
      },
      {
        name: 'Yellow Tigers',
        totalScore: 0,
        categoryScores: {
          kids: 0,
          elders: 0,
          adult_men: 0,
          adult_women: 0
        }
      }
    ];

    const houseIds = [];
    for (const house of houses) {
      const houseId = await houseService.create(house);
      houseIds.push(houseId);
      console.log(`Created house: ${house.name}`);
    }

    // 2. Create sample players
    const players = [
      { name: 'Alice Johnson', category: 'adult_women' as const, houseIndex: 0 },
      { name: 'Bob Smith', category: 'adult_men' as const, houseIndex: 1 },
      { name: 'Carol Davis', category: 'adult_women' as const, houseIndex: 2 },
      { name: 'David Wilson', category: 'adult_men' as const, houseIndex: 3 },
      { name: 'Emma Brown', category: 'kids' as const, houseIndex: 0 },
      { name: 'Frank Miller', category: 'elders' as const, houseIndex: 1 },
      { name: 'Grace Taylor', category: 'adult_women' as const, houseIndex: 2 },
      { name: 'Henry Anderson', category: 'adult_men' as const, houseIndex: 3 },
      { name: 'Ivy Martinez', category: 'kids' as const, houseIndex: 0 },
      { name: 'Jack Thompson', category: 'elders' as const, houseIndex: 1 },
      { name: 'Karen White', category: 'adult_women' as const, houseIndex: 2 },
      { name: 'Leo Garcia', category: 'adult_men' as const, houseIndex: 3 }
    ];

    for (const player of players) {
      await playerService.create({
        name: player.name,
        houseId: houseIds[player.houseIndex],
        category: player.category,
        individualScore: 0,
        categoryScore: 0
      });
      console.log(`Created player: ${player.name}`);
    }

    // 3. Create sample events
    const events = [
      {
        name: 'Tug of War',
        type: 'group' as const,
        categories: ['adult_men', 'adult_women'] as PlayerCategory[],
        scoring: { firstPlace: 10, secondPlace: 6, thirdPlace: 3 }
      },
      {
        name: '100m Sprint',
        type: 'individual' as const,
        categories: ['kids', 'adult_men', 'adult_women'] as PlayerCategory[],
        scoring: { firstPlace: 8, secondPlace: 5, thirdPlace: 2 }
      },
      {
        name: 'Relay Race',
        type: 'group' as const,
        categories: ['kids', 'elders'] as PlayerCategory[],
        scoring: { firstPlace: 12, secondPlace: 8, thirdPlace: 4 }
      }
    ];

    for (const event of events) {
      const baseEventId = await baseEventService.create({
        name: event.name,
        type: event.type,
        categories: event.categories,
        scoring: event.scoring,
        createdAt: new Date()
      });
      
      // Create event instances for each category
      await createEventInstances(baseEventId, {
        id: baseEventId,
        name: event.name,
        type: event.type,
        categories: event.categories,
        scoring: event.scoring,
        createdAt: new Date()
      });
      
      console.log(`Created event: ${event.name} with ${event.categories.length} category instances`);
    }

    console.log('Sample data created successfully!');
    console.log('Admin login credentials are set in your .env file');
    
    return {
      message: 'Sample data created successfully!',
      housesCreated: houses.length,
      playersCreated: players.length,
      eventsCreated: events.length
    };
    
  } catch (error) {
    console.error('Error creating sample data:', error);
    throw error;
  }
};

// Make it available globally for browser console
(window as any).createSampleData = createSampleData;