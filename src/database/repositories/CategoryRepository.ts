import { orderBy } from 'firebase/firestore';
import { BaseRepository } from './BaseRepository';
import { Category } from '../../types';

/**
 * Repository for managing Category entities
 * Categories are read-only as they are pre-populated in the database
 */
export class CategoryRepository extends BaseRepository<Category> {
  constructor() {
    super('categories');
  }

  /**
   * Get all categories ordered by name
   */
  async getAllCategories(): Promise<Category[]> {
    return this.getWithQuery(orderBy('name', 'asc'));
  }

  /**
   * Subscribe to all categories ordered by name with real-time updates
   */
  subscribeToAllCategories(callback: (categories: Category[]) => void) {
    return this.subscribeToAll(callback, 'name', 'asc');
  }

  /**
   * Get category by machine name (e.g., 'adult-men')
   */
  async getCategoryByName(name: string): Promise<Category | null> {
    const categories = await this.getAll();
    return categories.find(cat => cat.name === name) || null;
  }

  /**
   * Get categories by label search (case-insensitive)
   */
  async getCategoriesByLabel(searchLabel: string): Promise<Category[]> {
    const categories = await this.getAll();
    return categories.filter(cat => 
      cat.label.toLowerCase().includes(searchLabel.toLowerCase())
    );
  }
}

// Create and export a singleton instance
export const categoryRepository = new CategoryRepository();
