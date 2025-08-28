import { orderBy, where } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { Player } from '../../types';

/**
 * Repository for managing Player entities
 * Provides full CRUD operations with additional query methods
 */
export class PlayerRepository extends BaseRepository<Player> {
  constructor() {
    super('players');
  }

  /**
   * Get all players ordered by full name
   */
  async getAllPlayers(): Promise<Player[]> {
    return this.getWithQuery(orderBy('fullName', 'asc'));
  }

  /**
   * Subscribe to all players ordered by full name with real-time updates
   */
  subscribeToAllPlayers(callback: (players: Player[]) => void) {
    return this.subscribeToAll(callback, 'fullName', 'asc');
  }

  /**
   * Get players by category ID
   */
  async getPlayersByCategory(categoryId: string): Promise<Player[]> {
    return this.getWithQuery(
      where('categoryId', '==', categoryId),
      orderBy('fullName', 'asc')
    );
  }

  /**
   * Subscribe to players by category ID with real-time updates
   */
  subscribeToPlayersByCategory(categoryId: string, callback: (players: Player[]) => void) {
    return this.subscribeWithQuery(
      callback,
      where('categoryId', '==', categoryId),
      orderBy('fullName', 'asc')
    );
  }

  /**
   * Get players by house ID
   */
  async getPlayersByHouse(houseId: string): Promise<Player[]> {
    return this.getWithQuery(
      where('houseId', '==', houseId),
      orderBy('fullName', 'asc')
    );
  }

  /**
   * Subscribe to players by house ID with real-time updates
   */
  subscribeToPlayersByHouse(houseId: string, callback: (players: Player[]) => void) {
    return this.subscribeWithQuery(
      callback,
      where('houseId', '==', houseId),
      orderBy('fullName', 'asc')
    );
  }

  /**
   * Get players by both category and house
   */
  async getPlayersByCategoryAndHouse(categoryId: string, houseId: string): Promise<Player[]> {
    return this.getWithQuery(
      where('categoryId', '==', categoryId),
      where('houseId', '==', houseId),
      orderBy('fullName', 'asc')
    );
  }

  /**
   * Subscribe to players by both category and house with real-time updates
   */
  subscribeToPlayersByCategoryAndHouse(
    categoryId: string, 
    houseId: string, 
    callback: (players: Player[]) => void
  ) {
    return this.subscribeWithQuery(
      callback,
      where('categoryId', '==', categoryId),
      where('houseId', '==', houseId),
      orderBy('fullName', 'asc')
    );
  }

  /**
   * Create a new player with validation
   */
  async createPlayer(playerData: Omit<Player, 'id'>): Promise<string> {
    // Validate required fields
    if (!playerData.fullName?.trim()) {
      throw new Error('Player full name is required');
    }
    if (!playerData.categoryId?.trim()) {
      throw new Error('Player category is required');
    }
    if (!playerData.houseId?.trim()) {
      throw new Error('Player house is required');
    }

    // Clean the name to avoid issues with spacing
    const cleanedData = {
      ...playerData,
      fullName: playerData.fullName.trim()
    };

    return this.create(cleanedData);
  }

  /**
   * Update a player with validation
   */
  async updatePlayer(id: string, playerData: Partial<Omit<Player, 'id'>>): Promise<void> {
    // Validate fields if they are provided
    if (playerData.fullName !== undefined) {
      if (!playerData.fullName?.trim()) {
        throw new Error('Player full name is required');
      }
      playerData.fullName = playerData.fullName.trim();
    }

    if (playerData.categoryId !== undefined && !playerData.categoryId?.trim()) {
      throw new Error('Player category is required');
    }

    if (playerData.houseId !== undefined && !playerData.houseId?.trim()) {
      throw new Error('Player house is required');
    }

    return this.update(id, playerData);
  }

  /**
   * Delete a player with additional validation
   */
  async deletePlayer(id: string): Promise<void> {
    // Check if player exists before deleting
    const player = await this.getById(id);
    if (!player) {
      throw new Error('Player not found');
    }

    return this.delete(id);
  }

  /**
   * Check if a player name already exists in a specific house and category
   */
  async isPlayerNameTaken(
    fullName: string, 
    categoryId: string, 
    houseId: string, 
    excludeId?: string
  ): Promise<boolean> {
    const players = await this.getPlayersByCategoryAndHouse(categoryId, houseId);
    return players.some(player => 
      player.fullName.toLowerCase() === fullName.toLowerCase() && 
      player.id !== excludeId
    );
  }

  /**
   * Search players by name (case-insensitive partial match)
   */
  async searchPlayersByName(searchTerm: string): Promise<Player[]> {
    const allPlayers = await this.getAllPlayers();
    return allPlayers.filter(player =>
      player.fullName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  /**
   * Get player counts by house
   */
  async getPlayerCountsByHouse(): Promise<{ [houseId: string]: number }> {
    const allPlayers = await this.getAllPlayers();
    const counts: { [houseId: string]: number } = {};
    
    allPlayers.forEach(player => {
      counts[player.houseId] = (counts[player.houseId] || 0) + 1;
    });
    
    return counts;
  }

  /**
   * Get player counts by category
   */
  async getPlayerCountsByCategory(): Promise<{ [categoryId: string]: number }> {
    const allPlayers = await this.getAllPlayers();
    const counts: { [categoryId: string]: number } = {};
    
    allPlayers.forEach(player => {
      counts[player.categoryId] = (counts[player.categoryId] || 0) + 1;
    });
    
    return counts;
  }
}

// Create and export a singleton instance
export const playerRepository = new PlayerRepository();
