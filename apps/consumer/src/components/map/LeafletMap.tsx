import { useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import WebView, { type WebViewMessageEvent } from 'react-native-webview';
import type { Bounds, ListingPin } from '@maithing/shared';
import { formatThb } from '@maithing/shared';

interface Props {
  listings: ListingPin[];
  onRegionChange: (bounds: Bounds) => void;
  onPinPress: (listingId: string) => void;
  initialLat?: number | undefined;
  initialLng?: number | undefined;
}

const LEAFLET_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100vh;background:#f0fdf4}
.pin{background:#16a34a;color:#fff;border:2px solid #fff;border-radius:8px;padding:3px 8px;font-weight:700;font-size:12px;white-space:nowrap;cursor:pointer;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.leaflet-attribution-flag{display:none!important}
.marker-cluster-small{background-color:rgba(22,163,74,.3)}
.marker-cluster-small div{background-color:rgba(22,163,74,.7);color:#fff}
.marker-cluster-medium{background-color:rgba(22,163,74,.4)}
.marker-cluster-medium div{background-color:rgba(22,163,74,.8);color:#fff}
.marker-cluster-large{background-color:rgba(22,163,74,.5)}
.marker-cluster-large div{background-color:rgba(22,163,74,.9);color:#fff}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<script>
var map=L.map('map',{zoomControl:false,attributionControl:true}).setView([13.7563,100.5018],13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  maxZoom:19
}).addTo(map);

var cluster=L.markerClusterGroup({chunkedLoading:true,animate:false});
map.addLayer(cluster);

var postMsg=function(obj){
  try{window.ReactNativeWebView.postMessage(JSON.stringify(obj));}catch(e){}
};

var debounce;
map.on('moveend',function(){
  clearTimeout(debounce);
  debounce=setTimeout(function(){
    var b=map.getBounds();
    postMsg({type:'regionChange',bounds:{
      min_lat:b.getSouth(),min_lng:b.getWest(),
      max_lat:b.getNorth(),max_lng:b.getEast()
    }});
  },400);
});

window.updatePins=function(pins){
  cluster.clearLayers();
  pins.forEach(function(p){
    var icon=L.divIcon({html:'<div class="pin">'+p.label+'</div>',className:'',iconAnchor:[0,0],iconSize:null});
    var m=L.marker([p.lat,p.lng],{icon:icon});
    m.on('click',function(){postMsg({type:'pinPress',listingId:p.id});});
    cluster.addLayer(m);
  });
};

window.flyTo=function(lat,lng,zoom){
  map.setView([lat,lng],zoom||14,{animate:true,duration:0.8});
};

setTimeout(function(){
  var b=map.getBounds();
  postMsg({type:'regionChange',bounds:{
    min_lat:b.getSouth(),min_lng:b.getWest(),
    max_lat:b.getNorth(),max_lng:b.getEast()
  }});
},600);
</script>
</body>
</html>`;

export default function LeafletMap({ listings, onRegionChange, onPinPress, initialLat, initialLng }: Props) {
  const webViewRef = useRef<WebView>(null);
  const flyToSentRef = useRef(false);

  // Fly to user location once we have it
  useEffect(() => {
    if (!initialLat || !initialLng || flyToSentRef.current) return;
    flyToSentRef.current = true;
    webViewRef.current?.injectJavaScript(
      `window.flyTo(${initialLat},${initialLng},14);true;`
    );
  }, [initialLat, initialLng]);

  // Push pin updates into the WebView
  useEffect(() => {
    const pins = listings.map((l) => ({
      id: l.id,
      lat: l.location_lat,
      lng: l.location_lng,
      label: formatThb(l.price_thb),
    }));
    webViewRef.current?.injectJavaScript(
      `window.updatePins(${JSON.stringify(pins)});true;`
    );
  }, [listings]);

  const onMessage = useCallback(
    (e: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(e.nativeEvent.data) as
          | { type: 'regionChange'; bounds: Bounds }
          | { type: 'pinPress'; listingId: string };
        if (msg.type === 'regionChange') onRegionChange(msg.bounds);
        else if (msg.type === 'pinPress') onPinPress(msg.listingId);
      } catch {
        // ignore malformed messages
      }
    },
    [onRegionChange, onPinPress],
  );

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: LEAFLET_HTML }}
        style={styles.webview}
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        allowsInlineMediaPlayback
        // Required for OSM tile requests on iOS
        mixedContentMode="always"
        originWhitelist={['*']}

        // Block external navigation (e.g. attribution links) — tiles load via WebView network, not navigation events
        onShouldStartLoadWithRequest={(req) =>
          req.url.startsWith('about:') || req.url.startsWith('blob:')
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  webview: { flex: 1, backgroundColor: 'transparent' },
});
