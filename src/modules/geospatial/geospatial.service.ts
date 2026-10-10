import * as geofire from 'geofire-common';
import { GeoCoordinates } from '../../common/types/common.types';

export class GeospatialService {
  /**
   * Generates a 9-10 character geohash string for given latitude and longitude coordinates.
   */
  encodeGeohash(coordinates: GeoCoordinates, precision = 10): string {
    return geofire.geohashForLocation([coordinates.latitude, coordinates.longitude], precision);
  }

  /**
   * Calculates the exact great-circle distance between two geographical points using the Haversine formula.
   * geofire.distanceBetween returns kilometers, so we multiply by 1000 to return meters.
   */
  calculateDistanceMeters(coord1: GeoCoordinates, coord2: GeoCoordinates): number {
    const km = geofire.distanceBetween(
      [coord1.latitude, coord1.longitude],
      [coord2.latitude, coord2.longitude],
    );
    return Math.round(km * 1000 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculates the bounding geohash ranges required to cover a query radius centered at [latitude, longitude].
   * Returns an array of [startHash, endHash] range tuples suitable for Firestore startAt/endAt queries.
   */
  getQueryBounds(center: GeoCoordinates, radiusInMeters: number): [string, string][] {
    // geofire-common geohashQueryBounds takes meters directly
    return geofire.geohashQueryBounds([center.latitude, center.longitude], radiusInMeters);
  }
}

export const geospatialService = new GeospatialService();
