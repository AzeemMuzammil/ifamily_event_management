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
  where,
  writeBatch,
  onSnapshot,
  Timestamp,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import {
  House,
  Player,
  BaseEvent,
  EventInstance,
  SpecialAward,
  PlayerCategory,
  EventStatus
} from '../types';

const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

export const houseService = {
  async getAll(): Promise<House[]> {
    const snapshot = await getDocs(collection(db, 'houses'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as House));
  },

  subscribeToAll(callback: (houses: House[]) => void): Unsubscribe {
    const q = query(collection(db, 'houses'), orderBy('totalScore', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const houses = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as House));
      callback(houses);
    });
  },

  async create(house: Omit<House, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'houses'), house);
    return docRef.id;
  },

  async update(id: string, house: Partial<House>): Promise<void> {
    await updateDoc(doc(db, 'houses', id), house);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'houses', id));
  },

  async updateScore(houseId: string, category: PlayerCategory, points: number): Promise<void> {
    const houseRef = doc(db, 'houses', houseId);
    const houseDoc = await getDoc(houseRef);
    
    if (houseDoc.exists()) {
      const houseData = houseDoc.data() as House;
      const newCategoryScores = {
        ...houseData.categoryScores,
        [category]: houseData.categoryScores[category] + points
      };
      const newTotalScore = Object.values(newCategoryScores).reduce((sum, score) => sum + score, 0);
      
      await updateDoc(houseRef, {
        categoryScores: newCategoryScores,
        totalScore: newTotalScore
      });
    }
  }
};

export const playerService = {
  async getAll(): Promise<Player[]> {
    const snapshot = await getDocs(collection(db, 'players'));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Player));
  },

  subscribeToAll(callback: (players: Player[]) => void): Unsubscribe {
    const q = query(collection(db, 'players'), orderBy('individualScore', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const players = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Player));
      callback(players);
    });
  },

  async getByCategory(category: PlayerCategory): Promise<Player[]> {
    const q = query(collection(db, 'players'), where('category', '==', category));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Player));
  },

  async create(player: Omit<Player, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'players'), player);
    return docRef.id;
  },

  async update(id: string, player: Partial<Player>): Promise<void> {
    await updateDoc(doc(db, 'players', id), player);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'players', id));
  },

  async updateScore(playerId: string, points: number): Promise<void> {
    const playerRef = doc(db, 'players', playerId);
    const playerDoc = await getDoc(playerRef);
    
    if (playerDoc.exists()) {
      const playerData = playerDoc.data() as Player;
      await updateDoc(playerRef, {
        individualScore: playerData.individualScore + points,
        categoryScore: playerData.categoryScore + points
      });
    }
  }
};

export const baseEventService = {
  async getAll(): Promise<BaseEvent[]> {
    const snapshot = await getDocs(query(collection(db, 'baseEvents'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    } as BaseEvent));
  },

  subscribeToAll(callback: (baseEvents: BaseEvent[]) => void): Unsubscribe {
    const q = query(collection(db, 'baseEvents'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const baseEvents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: convertTimestamp(doc.data().createdAt)
      } as BaseEvent));
      callback(baseEvents);
    });
  },

  async create(baseEvent: Omit<BaseEvent, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'baseEvents'), {
      ...baseEvent,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async update(id: string, baseEvent: Partial<BaseEvent>): Promise<void> {
    await updateDoc(doc(db, 'baseEvents', id), baseEvent);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'baseEvents', id));
  }
};

export const eventInstanceService = {
  async getAll(): Promise<EventInstance[]> {
    const snapshot = await getDocs(query(collection(db, 'eventInstances'), orderBy('startTime', 'desc')));
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime ? convertTimestamp(data.startTime) : undefined,
        endTime: data.endTime ? convertTimestamp(data.endTime) : undefined
      } as EventInstance;
    });
  },

  subscribeToAll(callback: (events: EventInstance[]) => void): Unsubscribe {
    const q = query(collection(db, 'eventInstances'));
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: data.startTime ? convertTimestamp(data.startTime) : undefined,
          endTime: data.endTime ? convertTimestamp(data.endTime) : undefined
        } as EventInstance;
      });
      // Sort in memory to handle undefined startTime values
      events.sort((a, b) => {
        // Put scheduled events first, then in-progress, then completed
        const statusOrder = { 'scheduled': 0, 'in-progress': 1, 'completed': 2 };
        if (statusOrder[a.status] !== statusOrder[b.status]) {
          return statusOrder[a.status] - statusOrder[b.status];
        }
        // Within same status, sort by eventName
        return a.eventName.localeCompare(b.eventName);
      });
      callback(events);
    });
  },

  subscribeToCompleted(callback: (events: EventInstance[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'eventInstances'), 
      where('status', '==', 'completed'),
      orderBy('endTime', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: data.startTime ? convertTimestamp(data.startTime) : undefined,
          endTime: data.endTime ? convertTimestamp(data.endTime) : undefined
        } as EventInstance;
      });
      callback(events);
    });
  },

  subscribeToUpcoming(callback: (events: EventInstance[]) => void): Unsubscribe {
    const q = query(
      collection(db, 'eventInstances'), 
      where('status', 'in', ['scheduled', 'in-progress']),
      orderBy('startTime', 'asc')
    );
    return onSnapshot(q, (snapshot) => {
      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: data.startTime ? convertTimestamp(data.startTime) : undefined,
          endTime: data.endTime ? convertTimestamp(data.endTime) : undefined
        } as EventInstance;
      });
      callback(events);
    });
  },

  async getByStatus(status: EventStatus): Promise<EventInstance[]> {
    const q = query(collection(db, 'eventInstances'), where('status', '==', status));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        startTime: data.startTime ? convertTimestamp(data.startTime) : undefined,
        endTime: data.endTime ? convertTimestamp(data.endTime) : undefined
      } as EventInstance;
    });
  },

  async create(eventInstance: Omit<EventInstance, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'eventInstances'), {
      ...eventInstance,
      startTime: eventInstance.startTime ? Timestamp.fromDate(eventInstance.startTime) : null,
      endTime: eventInstance.endTime ? Timestamp.fromDate(eventInstance.endTime) : null
    });
    return docRef.id;
  },

  async update(id: string, eventInstance: Partial<EventInstance>): Promise<void> {
    const updateData: any = { ...eventInstance };
    if (updateData.startTime) {
      updateData.startTime = Timestamp.fromDate(updateData.startTime);
    }
    if (updateData.endTime) {
      updateData.endTime = Timestamp.fromDate(updateData.endTime);
    }
    await updateDoc(doc(db, 'eventInstances', id), updateData);
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'eventInstances', id));
  }
};

export const specialAwardService = {
  async getByEventInstance(eventInstanceId: string): Promise<SpecialAward[]> {
    const q = query(collection(db, 'awards'), where('eventInstanceId', '==', eventInstanceId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt)
    } as SpecialAward));
  },

  async create(award: Omit<SpecialAward, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'awards'), {
      ...award,
      createdAt: Timestamp.now()
    });
    return docRef.id;
  },

  async delete(id: string): Promise<void> {
    await deleteDoc(doc(db, 'awards', id));
  }
};


export const createEventInstances = async (baseEventId: string, baseEvent: BaseEvent): Promise<void> => {
  const batch = writeBatch(db);
  
  for (const category of baseEvent.categories) {
    const eventInstance: Omit<EventInstance, 'id'> = {
      baseEventId,
      baseEventName: baseEvent.name,
      eventName: baseEvent.name,
      type: baseEvent.type,
      category,
      status: 'scheduled',
      scoring: baseEvent.scoring,
      results: []
    };
    
    const docRef = doc(collection(db, 'eventInstances'));
    batch.set(docRef, eventInstance);
  }
  
  await batch.commit();
};