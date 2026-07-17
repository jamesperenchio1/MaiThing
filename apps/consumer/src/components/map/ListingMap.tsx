import { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import Supercluster from 'supercluster';
import type { ListingPin, Bounds } from '@maithing/shared';
import { formatThb } from '@maithing/shared';

interface Props {
  listings: ListingPin[];
  onRegionChange: (bounds: Bounds) => void;
}

const INITIAL_REGION: Region = {
  // Thailand center
  latitude: 13.7563,
  longitude: 100.5018,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
};

const MAX_ZOOM = 16;
const MIN_ZOOM = 6;

export default function ListingMap({ listings, onRegionChange }: Props) {
  const mapRef = useRef<MapView | null>(null);
  const clusterRef = useRef(new Supercluster({ radius: 60, maxZoom: MAX_ZOOM, minZoom: MIN_ZOOM }));
  const [region, setRegion] = useState<Region>(INITIAL_REGION);
  const [clusters, setClusters] = useState<Supercluster.ClusterFeature<Supercluster.AnyProps>[]>([]);

  // Center on user location once
  useEffect(() => {
    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) return;
      const loc = await Location.getCurrentPositionAsync({});
      const userRegion: Region = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04,
      };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 300);
    })();
  }, []);

  // Re-cluster when listings change
  useEffect(() => {
    const points: Supercluster.PointFeature<{ listingId: string }>[] = listings.map((l) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [l.location_lng, l.location_lat] },
      properties: { listingId: l.id },
    }));
    clusterRef.current.load(points);

    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    const zoom = Math.round(Math.log2(360 / longitudeDelta));
    const newClusters = clusterRef.current.getClusters(
      [
        longitude - longitudeDelta,
        latitude - latitudeDelta,
        longitude + longitudeDelta,
        latitude + latitudeDelta,
      ],
      zoom,
    ) as Supercluster.ClusterFeature<Supercluster.AnyProps>[];
    setClusters(newClusters);
  }, [listings]); // region intentionally excluded from deps to avoid re-render loop

  const handleRegionChange = useCallback(
    (r: Region) => {
      setRegion(r);
      const bounds: Bounds = {
        min_lat: r.latitude - r.latitudeDelta,
        min_lng: r.longitude - r.longitudeDelta,
        max_lat: r.latitude + r.latitudeDelta,
        max_lng: r.longitude + r.longitudeDelta,
      };
      onRegionChange(bounds);

      // Recluster
      const zoom = Math.round(Math.log2(360 / r.longitudeDelta));
      const newClusters = clusterRef.current.getClusters(
        [
          r.longitude - r.longitudeDelta,
          r.latitude - r.latitudeDelta,
          r.longitude + r.longitudeDelta,
          r.latitude + r.latitudeDelta,
        ],
        zoom,
      ) as Supercluster.ClusterFeature<Supercluster.AnyProps>[];
      setClusters(newClusters);
    },
    [onRegionChange],
  );

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      initialRegion={region}
      showsUserLocation
      onRegionChangeComplete={handleRegionChange}
    >
      {clusters.map((cluster, i) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const isCluster = cluster.properties['cluster'] === true;
        const count = (cluster.properties['point_count'] as number | undefined) ?? 1;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${i}`}
              coordinate={{ latitude: lat ?? 0, longitude: lng ?? 0 }}
            >
              <View style={styles.cluster}>
                <Text style={styles.clusterText}>{count}</Text>
              </View>
            </Marker>
          );
        }

        const listing = listings.find((l) => l.id === (cluster.properties['listingId'] as string));
        if (!listing) return null;

        return (
          <Marker
            key={listing.id}
            coordinate={{ latitude: listing.location_lat, longitude: listing.location_lng }}
            title={listing.title}
            description={formatThb(listing.price_thb)}
          >
            <View style={styles.pin}>
              <Text style={styles.pinText}>{formatThb(listing.price_thb)}</Text>
            </View>
          </Marker>
        );
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  cluster: {
    backgroundColor: '#16a34a',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  clusterText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pin: {
    backgroundColor: '#16a34a',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
