import { orderBy } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { House } from '../../types';

/**
 * Repository for managing House entities
 * Extends BaseRepository to provide house-specific operations
 */
export class HouseRepository extends BaseRepository<House> {
  constructor() {
    super('houses');
  }

  /**
   * Get all houses ordered by name
   */
  async getAllHouses(): Promise<House[]> {
    return this.getWithQuery(orderBy('name', 'asc'));
  }

  /**
   * Subscribe to all houses ordered by name with real-time updates
   */
  subscribeToAllHouses(callback: (houses: House[]) => void) {
    return this.subscribeToAll(callback, 'name', 'asc');
  }

  /**
   * Create a new house with validation
   */
  async createHouse(houseData: Omit<House, 'id'>): Promise<string> {
    // Validate required fields
    if (!houseData.name?.trim()) {
      throw new Error('House name is required');
    }
    if (!houseData.colorHex?.trim()) {
      throw new Error('House color is required');
    }

    // Validate hex color format
    if (!/^#[0-9A-F]{6}$/i.test(houseData.colorHex)) {
      throw new Error('Invalid hex color format. Expected format: #RRGGBB');
    }

    // Trim the name to avoid issues with spacing
    const cleanedData = {
      ...houseData,
      name: houseData.name.trim()
    };

    return this.create(cleanedData);
  }

  /**
   * Update a house with validation
   */
  async updateHouse(id: string, houseData: Partial<Omit<House, 'id'>>): Promise<void> {
    // Validate fields if they are provided
    if (houseData.name !== undefined) {
      if (!houseData.name?.trim()) {
        throw new Error('House name is required');
      }
      houseData.name = houseData.name.trim();
    }

    if (houseData.colorHex !== undefined) {
      if (!houseData.colorHex?.trim()) {
        throw new Error('House color is required');
      }
      if (!/^#[0-9A-F]{6}$/i.test(houseData.colorHex)) {
        throw new Error('Invalid hex color format. Expected format: #RRGGBB');
      }
    }

    return this.update(id, houseData);
  }

  /**
   * Delete a house with additional validation
   * Note: In a real application, you might want to check for related entities
   */
  async deleteHouse(id: string): Promise<void> {
    // Check if house exists before deleting
    const house = await this.getById(id);
    if (!house) {
      throw new Error('House not found');
    }

    return this.delete(id);
  }

  /**
   * Check if a house name already exists (case-insensitive)
   */
  async isNameTaken(name: string, excludeId?: string): Promise<boolean> {
    const houses = await this.getAll();
    return houses.some(house => 
      house.name.toLowerCase() === name.toLowerCase() && 
      house.id !== excludeId
    );
  }

  /**
   * Get houses by color (if you need to find similar colors)
   */
  async getHousesByColor(colorHex: string): Promise<House[]> {
    const houses = await this.getAll();
    return houses.filter(house => house.colorHex.toLowerCase() === colorHex.toLowerCase());
  }
}

// Create and export a singleton instance
export const houseRepository = new HouseRepository();
