import { describe, it, expect } from 'vitest';
import { GeospatialService } from '../../modules/geospatial/geospatial.service';

describe('GeospatialService', () => {
  const geoService = new GeospatialService();

  describe('encodeGeohash', () => {
    it('should generate valid geohash for San Francisco coordinates', () => {
      const hash = geoService.encodeGeohash({ latitude: 37.7749, longitude: -122.4194 });
      expect(hash).toBeDefined();
      expect(hash.length).toBe(10);
      expect(hash.startsWith('9q8y')).toBe(true);
    });

    it('should generate valid geohash for London coordinates (prime meridian)', () => {
      const hash = geoService.encodeGeohash({ latitude: 51.5074, longitude: -0.1278 });
      expect(hash).toBeDefined();
      expect(hash.startsWith('gcpv')).toBe(true);
    });

    it('should handle North Pole and South Pole coordinates', () => {
      const northPole = geoService.encodeGeohash({ latitude: 90.0, longitude: 0.0 });
      const southPole = geoService.encodeGeohash({ latitude: -90.0, longitude: 0.0 });
      expect(northPole).toBeDefined();
      expect(southPole).toBeDefined();
    });
  });

  describe('calculateDistanceMeters', () => {
    it('should calculate 0 distance from a point to itself', () => {
      const point = { latitude: 37.7749, longitude: -122.4194 };
      const dist = geoService.calculateDistanceMeters(point, point);
      expect(dist).toBe(0);
    });

    it('should calculate symmetric distance between two points', () => {
      const sf = { latitude: 37.7749, longitude: -122.4194 };
      const oakland = { latitude: 37.8044, longitude: -122.2712 };

      const dist1 = geoService.calculateDistanceMeters(sf, oakland);
      const dist2 = geoService.calculateDistanceMeters(oakland, sf);

      expect(dist1).toBe(dist2);
      // SF to Oakland is approx 13.5 km ~ 13,000 - 14,000 meters
      expect(dist1).toBeGreaterThan(12000);
      expect(dist1).toBeLessThan(15000);
    });

    it('should correctly measure short distances within meters accuracy', () => {
      // Points separated by approx 111 meters of latitude (~0.001 degree)
      const p1 = { latitude: 0.0, longitude: 0.0 };
      const p2 = { latitude: 0.001, longitude: 0.0 };
      const dist = geoService.calculateDistanceMeters(p1, p2);
      expect(dist).toBeGreaterThan(100);
      expect(dist).toBeLessThan(120);
    });
  });

  describe('getQueryBounds', () => {
    it('should return 1 to 9 geohash ranges for a given center and radius', () => {
      const center = { latitude: 37.7749, longitude: -122.4194 };
      const bounds = geoService.getQueryBounds(center, 5000);

      expect(Array.isArray(bounds)).toBe(true);
      expect(bounds.length).toBeGreaterThan(0);
      expect(bounds.length).toBeLessThanOrEqual(9);

      for (const [start, end] of bounds) {
        expect(typeof start).toBe('string');
        expect(typeof end).toBe('string');
        expect(start <= end).toBe(true);
      }
    });

    it('should adapt precision based on small radius', () => {
      const center = { latitude: 37.7749, longitude: -122.4194 };
      const smallBounds = geoService.getQueryBounds(center, 100); // 100 meters
      const largeBounds = geoService.getQueryBounds(center, 50000); // 50 km

      // Smaller radius produces longer prefix hashes (higher precision)
      expect(smallBounds[0][0].length).toBeGreaterThan(largeBounds[0][0].length);
    });
  });
});
