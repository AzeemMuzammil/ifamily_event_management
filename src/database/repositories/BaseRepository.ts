import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Unsubscribe,
  QueryConstraint,
  DocumentData,
  Query
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { prepareForFirestore, prepareFromFirestore } from '../utils/firestore';

/**
 * Base repository class that provides common CRUD operations
 * This class can be extended by specific entity repositories
 */
export abstract class BaseRepository<T extends { id: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  /**
   * Get all documents from the collection
   */
  async getAll(): Promise<T[]> {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(doc => prepareFromFirestore(doc) as T);
  }

  /**
   * Get a single document by ID
   */
  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(doc(db, this.collectionName, id));
    if (docSnap.exists()) {
      return prepareFromFirestore(docSnap) as T;
    }
    return null;
  }

  /**
   * Create a new document
   */
  async create(data: Omit<T, 'id'>): Promise<string> {
    const preparedData = prepareForFirestore(data);
    const docRef = await addDoc(collection(db, this.collectionName), preparedData);
    return docRef.id;
  }

  /**
   * Update an existing document
   */
  async update(id: string, data: Partial<Omit<T, 'id'>>): Promise<void> {
    const preparedData = prepareForFirestore(data);
    await updateDoc(doc(db, this.collectionName, id), preparedData);
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, this.collectionName, id));
  }

  /**
   * Subscribe to all documents with real-time updates
   */
  subscribeToAll(
    callback: (documents: T[]) => void,
    orderByField?: string,
    orderDirection?: 'asc' | 'desc'
  ): Unsubscribe {
    let q: Query<DocumentData> = collection(db, this.collectionName);

    if (orderByField) {
      q = query(q, orderBy(orderByField, orderDirection || 'asc'));
    }

    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => prepareFromFirestore(doc) as T);
      callback(documents);
    });
  }

  /**
   * Subscribe to documents with custom query constraints
   */
  subscribeWithQuery(
    callback: (documents: T[]) => void,
    ...constraints: QueryConstraint[]
  ): Unsubscribe {
    const q = query(collection(db, this.collectionName), ...constraints);
    return onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => prepareFromFirestore(doc) as T);
      callback(documents);
    });
  }

  /**
   * Get documents with custom query constraints
   */
  async getWithQuery(...constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => prepareFromFirestore(doc) as T);
  }
}
