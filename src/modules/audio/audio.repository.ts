import { getFirestore } from '../../config/firebase';
import { Collections } from '../../infrastructure/firestore/collections';
import { AudioRecording } from './audio.model';
import { logger } from '../../common/utils/logger';

export interface IAudioRepository {
  findById(id: string): Promise<AudioRecording | null>;
  create(audio: AudioRecording): Promise<AudioRecording>;
  update(id: string, data: Partial<AudioRecording>): Promise<AudioRecording>;
  delete(id: string): Promise<void>;
  findNearbyCandidates(bounds: [string, string][]): Promise<AudioRecording[]>;
}

export class FirestoreAudioRepository implements IAudioRepository {
  private memoryCache = new Map<string, AudioRecording>();

  private get collection() {
    return getFirestore().collection(Collections.AUDIO);
  }

  async findById(id: string): Promise<AudioRecording | null> {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return this.memoryCache.get(id) || null;
      }
      const data = doc.data() as AudioRecording;
      this.memoryCache.set(id, data);
      return data;
    } catch (err: unknown) {
      logger.error(`Error querying audio by ID: ${id}`, err);
      const e = err as { code?: number | string; message?: string };
      if (
        e?.code === 14 ||
        e?.code === 7 ||
        e?.code === 16 ||
        e?.message?.includes('ECONNREFUSED') ||
        e?.message?.includes('UNAVAILABLE') ||
        e?.message?.includes('credentials')
      ) {
        return this.memoryCache.get(id) || null;
      }
      throw err;
    }
  }

  async create(audio: AudioRecording): Promise<AudioRecording> {
    this.memoryCache.set(audio.id, { ...audio });
    try {
      await this.collection.doc(audio.id).set(audio);
      logger.debug(`Audio record created in Firestore: ${audio.id}`);
    } catch (err: unknown) {
      logger.warn(`Could not persist audio to Firestore (using memory fallback): ${audio.id}`);
    }
    return audio;
  }

  async update(id: string, data: Partial<AudioRecording>): Promise<AudioRecording> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Audio recording not found: ${id}`);
    }

    const updated: AudioRecording = {
      ...existing,
      ...data,
      id, // enforce ID immutability
      updatedAt: new Date().toISOString(),
    };

    this.memoryCache.set(id, updated);
    try {
      await this.collection.doc(id).set(updated, { merge: true });
      logger.debug(`Audio record updated in Firestore: ${id}`);
    } catch (err: unknown) {
      logger.warn(`Could not persist audio update to Firestore (using memory fallback): ${id}`);
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.memoryCache.delete(id);
    try {
      await this.collection.doc(id).delete();
      logger.debug(`Audio record deleted from Firestore: ${id}`);
    } catch (err: unknown) {
      logger.warn(`Could not delete audio from Firestore (using memory fallback): ${id}`);
    }
  }

  /**
   * Queries Firestore for candidate audio records within the given geohash query bounds.
   * Runs queries concurrently for all bounds and deduplicates documents by ID.
   */
  async findNearbyCandidates(bounds: [string, string][]): Promise<AudioRecording[]> {
    const candidateMap = new Map<string, AudioRecording>();

    // First check memory cache
    for (const record of this.memoryCache.values()) {
      if (record.status === 'published' && record.visibility === 'public') {
        for (const [start, end] of bounds) {
          if (record.geohash >= start && record.geohash <= end) {
            candidateMap.set(record.id, record);
            break;
          }
        }
      }
    }

    try {
      const promises = bounds.map(async ([start, end]) => {
        const querySnapshot = await this.collection
          .where('status', '==', 'published')
          .where('visibility', '==', 'public')
          .orderBy('geohash')
          .startAt(start)
          .endAt(end)
          .get();

        for (const doc of querySnapshot.docs) {
          const data = doc.data() as AudioRecording;
          if (!candidateMap.has(data.id)) {
            candidateMap.set(data.id, data);
            this.memoryCache.set(data.id, data);
          }
        }
      });

      await Promise.all(promises);
      return Array.from(candidateMap.values());
    } catch (err: unknown) {
      logger.error('Error querying Firestore for geohash bounds', err);
      const e = err as { code?: number | string; message?: string };
      if (
        e?.code === 14 ||
        e?.code === 7 ||
        e?.code === 16 ||
        e?.message?.includes('ECONNREFUSED') ||
        e?.message?.includes('UNAVAILABLE') ||
        e?.message?.includes('credentials')
      ) {
        logger.warn('Firestore is currently unreachable or unauthenticated. Returning cached candidates.', {
          details: e?.message,
        });
        return Array.from(candidateMap.values());
      }
      throw err;
    }
  }
}

/**
 * In-memory audio repository for isolated unit and integration tests.
 */
export class InMemoryAudioRepository implements IAudioRepository {
  private records = new Map<string, AudioRecording>();

  async findById(id: string): Promise<AudioRecording | null> {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  async create(audio: AudioRecording): Promise<AudioRecording> {
    this.records.set(audio.id, { ...audio });
    return { ...audio };
  }

  async update(id: string, data: Partial<AudioRecording>): Promise<AudioRecording> {
    const existing = this.records.get(id);
    if (!existing) {
      throw new Error(`Audio recording not found: ${id}`);
    }
    const updated: AudioRecording = {
      ...existing,
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.records.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.records.delete(id);
  }

  async findNearbyCandidates(bounds: [string, string][]): Promise<AudioRecording[]> {
    const candidateMap = new Map<string, AudioRecording>();

    for (const record of this.records.values()) {
      if (record.status !== 'published' || record.visibility !== 'public') {
        continue;
      }

      for (const [start, end] of bounds) {
        if (record.geohash >= start && record.geohash <= end) {
          candidateMap.set(record.id, { ...record });
          break;
        }
      }
    }

    return Array.from(candidateMap.values());
  }

  clear(): void {
    this.records.clear();
  }
}

export const defaultAudioRepository: IAudioRepository = new FirestoreAudioRepository();
