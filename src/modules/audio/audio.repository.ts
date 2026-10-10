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
  private get collection() {
    return getFirestore().collection(Collections.AUDIO);
  }

  async findById(id: string): Promise<AudioRecording | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as AudioRecording;
  }

  async create(audio: AudioRecording): Promise<AudioRecording> {
    await this.collection.doc(audio.id).set(audio);
    logger.debug(`Audio record created in Firestore: ${audio.id}`);
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

    await this.collection.doc(id).set(updated, { merge: true });
    logger.debug(`Audio record updated in Firestore: ${id}`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.collection.doc(id).delete();
    logger.debug(`Audio record deleted from Firestore: ${id}`);
  }

  /**
   * Queries Firestore for candidate audio records within the given geohash query bounds.
   * Runs queries concurrently for all bounds and deduplicates documents by ID.
   */
  async findNearbyCandidates(bounds: [string, string][]): Promise<AudioRecording[]> {
    const candidateMap = new Map<string, AudioRecording>();

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
          }
        }
      });

      await Promise.all(promises);
      return Array.from(candidateMap.values());
    } catch (err) {
      logger.error('Error querying Firestore for geohash bounds', err);
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
