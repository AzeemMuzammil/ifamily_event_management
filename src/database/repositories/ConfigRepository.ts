import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { Config, EventType } from "../../types";
import { BaseRepository } from "./BaseRepository";

export class ConfigRepository extends BaseRepository<Config> {
  constructor() {
    super("configs");
  }

  protected mapFromFirestore(data: any, id: string): Config {
    return {
      id,
      type: data.type,
      categoryId: data.categoryId,
      eventType: data.eventType,
      placements: data.placements || {},
    };
  }

  protected mapToFirestore(config: Omit<Config, "id">): any {
    return {
      type: config.type,
      categoryId: config.categoryId,
      eventType: config.eventType,
      placements: config.placements,
    };
  }

  // Get placement points config for a specific category and event type
  async getPlacementConfig(
    categoryId: string,
    eventType: EventType
  ): Promise<Config | null> {
    try {
      const configId = `placement-points-${categoryId}-${eventType}`;
      return await this.getById(configId);
    } catch (error) {
      console.error("Error getting placement config:", error);
      return null;
    }
  }

  // Set placement points config for a specific category and event type
  async setPlacementConfig(
    categoryId: string,
    eventType: EventType,
    placements: { [placement: number]: number }
  ): Promise<void> {
    try {
      const configId = `placement-points-${categoryId}-${eventType}`;
      const config: Omit<Config, "id"> = {
        type: "placement-points",
        categoryId,
        eventType,
        placements,
      };

      const docRef = doc(db, this.collectionName, configId);
      await setDoc(docRef, this.mapToFirestore(config));
    } catch (error) {
      console.error("Error setting placement config:", error);
      throw error;
    }
  }

  // Get all placement configs
  async getAllPlacementConfigs(): Promise<Config[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("type", "==", "placement-points")
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) =>
        this.mapFromFirestore(doc.data(), doc.id)
      );
    } catch (error) {
      console.error("Error getting all placement configs:", error);
      throw error;
    }
  }

  // Subscribe to all placement configs
  subscribeToAllPlacementConfigs(
    callback: (configs: Config[]) => void
  ): () => void {
    const q = query(
      collection(db, this.collectionName),
      where("type", "==", "placement-points")
    );

    return onSnapshot(q, (querySnapshot) => {
      const configs = querySnapshot.docs.map((doc) =>
        this.mapFromFirestore(doc.data(), doc.id)
      );
      callback(configs);
    });
  }

  // Create default placement config for a category (both individual and group)
  async createDefaultConfigsForCategory(categoryId: string): Promise<void> {
    const defaultPlacements = { 1: 5, 2: 3, 3: 1 };

    await Promise.all([
      this.setPlacementConfig(categoryId, "individual", defaultPlacements),
      this.setPlacementConfig(categoryId, "group", defaultPlacements),
    ]);
  }

  // Delete all configs for a category
  async deleteConfigsForCategory(categoryId: string): Promise<void> {
    try {
      const individualConfigId = `placement-points-${categoryId}-individual`;
      const groupConfigId = `placement-points-${categoryId}-group`;

      await Promise.all([
        deleteDoc(doc(db, this.collectionName, individualConfigId)),
        deleteDoc(doc(db, this.collectionName, groupConfigId)),
      ]);
    } catch (error) {
      console.error("Error deleting configs for category:", error);
      throw error;
    }
  }
}

export const configRepository = new ConfigRepository();
