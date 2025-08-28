import { Timestamp } from 'firebase/firestore';

/**
 * Utility function to convert Firestore timestamps to JavaScript Date objects
 */
export const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  return new Date(timestamp);
};

/**
 * Utility function to prepare data for Firestore (convert Date to Timestamp)
 */
export const prepareForFirestore = (data: any) => {
  const prepared = { ...data };
  
  // Convert Date fields to Firestore Timestamps
  if (prepared.startTime instanceof Date) {
    prepared.startTime = Timestamp.fromDate(prepared.startTime);
  }
  if (prepared.endTime instanceof Date) {
    prepared.endTime = Timestamp.fromDate(prepared.endTime);
  }
  if (prepared.createdAt instanceof Date) {
    prepared.createdAt = Timestamp.fromDate(prepared.createdAt);
  }
  if (prepared.updatedAt instanceof Date) {
    prepared.updatedAt = Timestamp.fromDate(prepared.updatedAt);
  }
  
  return prepared;
};

/**
 * Utility function to prepare data from Firestore (convert Timestamp to Date)
 */
export const prepareFromFirestore = (doc: any) => {
  const data = doc.data();
  const prepared = {
    id: doc.id,
    ...data
  };
  
  // Convert Timestamp fields to JavaScript Date objects
  if (data.startTime) {
    prepared.startTime = convertTimestamp(data.startTime);
  }
  if (data.endTime) {
    prepared.endTime = convertTimestamp(data.endTime);
  }
  if (data.createdAt) {
    prepared.createdAt = convertTimestamp(data.createdAt);
  }
  if (data.updatedAt) {
    prepared.updatedAt = convertTimestamp(data.updatedAt);
  }
  
  return prepared;
};
