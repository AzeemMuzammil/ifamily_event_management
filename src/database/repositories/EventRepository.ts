import { orderBy, where, deleteField } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { Event, EventStatus, EventResult } from '../../types';

/**
 * Repository for managing Event entities
 * Provides full CRUD operations with additional query methods for event management
 */
export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super('events');
  }

  /**
   * Get all events ordered by status priority and name
   */
  async getAllEvents(): Promise<Event[]> {
    const events = await this.getAll();
    // Sort in memory by status priority and then by name
    return events.sort((a, b) => {
      const statusOrder = { 'scheduled': 0, 'in-progress': 1, 'completed': 2 };
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Subscribe to all events with real-time updates (sorted by status and name)
   */
  subscribeToAllEvents(callback: (events: Event[]) => void) {
    return this.subscribeToAll((events) => {
      // Sort by status priority and name
      const sorted = events.sort((a, b) => {
        const statusOrder = { 'scheduled': 0, 'in-progress': 1, 'completed': 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.name.localeCompare(b.name);
      });
      callback(sorted);
    }, 'name', 'asc');
  }

  /**
   * Get events by status
   */
  async getEventsByStatus(status: EventStatus): Promise<Event[]> {
    return this.getWithQuery(
      where('status', '==', status),
      orderBy('name', 'asc')
    );
  }

  /**
   * Subscribe to events by status with real-time updates
   */
  subscribeToEventsByStatus(status: EventStatus, callback: (events: Event[]) => void) {
    return this.subscribeWithQuery(
      callback,
      where('status', '==', status),
      orderBy('name', 'asc')
    );
  }

  /**
   * Get events by category ID
   */
  async getEventsByCategory(categoryId: string): Promise<Event[]> {
    return this.getWithQuery(
      where('categoryId', '==', categoryId),
      orderBy('name', 'asc')
    );
  }

  /**
   * Subscribe to events by category with real-time updates
   */
  subscribeToEventsByCategory(categoryId: string, callback: (events: Event[]) => void) {
    return this.subscribeWithQuery(
      callback,
      where('categoryId', '==', categoryId),
      orderBy('name', 'asc')
    );
  }

  /**
   * Get upcoming events (scheduled and in-progress)
   */
  async getUpcomingEvents(): Promise<Event[]> {
    const allEvents = await this.getAllEvents();
    return allEvents
      .filter(event => event.status === 'scheduled' || event.status === 'in-progress')
      .sort((a, b) => {
        // Sort by startTime if available, otherwise by name
        if (a.startTime && b.startTime) {
          return a.startTime.getTime() - b.startTime.getTime();
        }
        return a.name.localeCompare(b.name);
      });
  }

  /**
   * Subscribe to upcoming events with real-time updates
   */
  subscribeToUpcomingEvents(callback: (events: Event[]) => void) {
    return this.subscribeToAll((events) => {
      const upcoming = events
        .filter(event => event.status === 'scheduled' || event.status === 'in-progress')
        .sort((a, b) => {
          if (a.startTime && b.startTime) {
            return a.startTime.getTime() - b.startTime.getTime();
          }
          return a.name.localeCompare(b.name);
        });
      callback(upcoming);
    });
  }

  /**
   * Get completed events
   */
  async getCompletedEvents(): Promise<Event[]> {
    const events = await this.getEventsByStatus('completed');
    return events.sort((a, b) => {
      // Sort by endTime if available (newest first), otherwise by name
      if (a.endTime && b.endTime) {
        return b.endTime.getTime() - a.endTime.getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Subscribe to completed events with real-time updates
   */
  subscribeToCompletedEvents(callback: (events: Event[]) => void) {
    return this.subscribeToEventsByStatus('completed', (events) => {
      const sorted = events.sort((a, b) => {
        if (a.endTime && b.endTime) {
          return b.endTime.getTime() - a.endTime.getTime();
        }
        return a.name.localeCompare(b.name);
      });
      callback(sorted);
    });
  }

  /**
   * Create a new event with validation
   */
  async createEvent(eventData: Omit<Event, 'id'>): Promise<string> {
    // Validate required fields
    if (!eventData.name?.trim()) {
      throw new Error('Event name is required');
    }
    if (!eventData.categoryId?.trim()) {
      throw new Error('Event category is required');
    }
    if (!eventData.type) {
      throw new Error('Event type is required');
    }
    if (!eventData.scoring || Object.keys(eventData.scoring).length === 0) {
      throw new Error('Event scoring configuration is required');
    }

    // Validate scoring configuration
    const placements = Object.keys(eventData.scoring).map(Number).sort((a, b) => a - b);
    if (placements[0] !== 1) {
      throw new Error('Scoring must start with 1st place');
    }
    
    // Check for consecutive placements
    for (let i = 1; i < placements.length; i++) {
      if (placements[i] !== placements[i - 1] + 1) {
        throw new Error('Scoring placements must be consecutive (1, 2, 3, ...)');
      }
    }

    // Clean the data
    const cleanedData = {
      ...eventData,
      name: eventData.name.trim(),
      status: eventData.status || 'scheduled' as EventStatus
    };

    return this.create(cleanedData);
  }

  /**
   * Update an event with validation
   */
  async updateEvent(id: string, eventData: Partial<Omit<Event, 'id'>>): Promise<void> {
    // Validate fields if they are provided
    if (eventData.name !== undefined) {
      if (!eventData.name?.trim()) {
        throw new Error('Event name is required');
      }
      eventData.name = eventData.name.trim();
    }

    if (eventData.categoryId !== undefined && !eventData.categoryId?.trim()) {
      throw new Error('Event category is required');
    }

    if (eventData.scoring !== undefined) {
      if (!eventData.scoring || Object.keys(eventData.scoring).length === 0) {
        throw new Error('Event scoring configuration is required');
      }

      const placements = Object.keys(eventData.scoring).map(Number).sort((a, b) => a - b);
      if (placements[0] !== 1) {
        throw new Error('Scoring must start with 1st place');
      }
      
      for (let i = 1; i < placements.length; i++) {
        if (placements[i] !== placements[i - 1] + 1) {
          throw new Error('Scoring placements must be consecutive (1, 2, 3, ...)');
        }
      }
    }

    return this.update(id, eventData);
  }

  /**
   * Delete an event with additional validation
   */
  async deleteEvent(id: string): Promise<void> {
    // Check if event exists before deleting
    const event = await this.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    // Prevent deletion of in-progress or completed events
    if (event.status === 'in-progress') {
      throw new Error('Cannot delete an event that is in progress. Please complete or reset it first.');
    }
    if (event.status === 'completed') {
      throw new Error('Cannot delete a completed event. This would affect scoring history.');
    }

    return this.delete(id);
  }

  /**
   * Start an event (change status to in-progress and set startTime)
   */
  async startEvent(id: string): Promise<void> {
    const event = await this.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'scheduled') {
      throw new Error('Only scheduled events can be started');
    }

    await this.updateEvent(id, {
      status: 'in-progress',
      startTime: new Date()
    });
  }

  /**
   * Complete an event with results
   */
  async completeEvent(id: string, results: EventResult[]): Promise<void> {
    const event = await this.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'in-progress') {
      throw new Error('Only in-progress events can be completed');
    }

    // Validate results
    if (!results || results.length === 0) {
      throw new Error('Event results are required to complete an event');
    }

    // Validate placement numbers
    const placements = results.map(r => r.placement).sort((a, b) => a - b);
    if (placements[0] !== 1) {
      throw new Error('Results must include 1st place');
    }

    // Check for duplicate placements
    const uniquePlacements = new Set(placements);
    if (uniquePlacements.size !== placements.length) {
      throw new Error('Each placement can only be assigned once');
    }

    // Validate that all placements exist in scoring configuration
    const availablePlacements = Object.keys(event.scoring).map(Number);
    for (const placement of placements) {
      if (!availablePlacements.includes(placement)) {
        throw new Error(`Placement ${placement} is not configured in the scoring system`);
      }
    }

    await this.updateEvent(id, {
      status: 'completed',
      endTime: new Date(),
      results
    });
  }

  /**
   * Reset an event (change back to scheduled and clear times/results)
   */
  async resetEvent(id: string): Promise<void> {
    const event = await this.getById(id);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status === 'scheduled') {
      throw new Error('Event is already scheduled');
    }

    const updateData: any = {
      status: 'scheduled',
      startTime: deleteField(),
      endTime: deleteField(),
      results: deleteField()
    };

    await this.update(id, updateData);
  }

  /**
   * Check if an event name already exists (case-insensitive)
   */
  async isEventNameTaken(name: string, excludeId?: string): Promise<boolean> {
    const events = await this.getAll();
    return events.some(event => 
      event.name.toLowerCase() === name.toLowerCase() && 
      event.id !== excludeId
    );
  }

  /**
   * Get events statistics
   */
  async getEventsStatistics() {
    const events = await this.getAllEvents();
    
    const stats = {
      total: events.length,
      scheduled: events.filter(e => e.status === 'scheduled').length,
      inProgress: events.filter(e => e.status === 'in-progress').length,
      completed: events.filter(e => e.status === 'completed').length,
      byType: {
        individual: events.filter(e => e.type === 'individual').length,
        group: events.filter(e => e.type === 'group').length
      }
    };

    return stats;
  }
}

// Create and export a singleton instance
export const eventRepository = new EventRepository();
