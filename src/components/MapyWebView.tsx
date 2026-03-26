import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { MAPY_API_KEY, MAPY_WEBVIEW_USER_AGENT, hasMapyApiKey } from '../config/mapy';

type MarkerItem = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  subtitle?: string;
  previewUri?: string | null;
  emoji?: string;
};

type PickerMessage =
  | { type: 'ready' }
  | { type: 'map-error'; message: string }
  | { type: 'select-location'; latitude: number; longitude: number }
  | { type: 'open-marker'; id: string };

interface Props {
  mode: 'browse' | 'picker';
  height: number;
  centerLatitude: number;
  centerLongitude: number;
  zoom: number;
  markers: MarkerItem[];
  selectedLatitude?: number | null;
  selectedLongitude?: number | null;
  emptyStateTitle: string;
  emptyStateText: string;
  onSelectLocation?: (latitude: number, longitude: number) => void;
  onMarkerPress?: (id: string) => void;
  onMapError?: (message: string) => void;
  onInteractionChange?: (interacting: boolean) => void;
}

export function MapyWebView({
  mode,
  height,
  centerLatitude,
  centerLongitude,
  zoom,
  markers,
  selectedLatitude = null,
  selectedLongitude = null,
  emptyStateTitle,
  emptyStateText,
  onSelectLocation,
  onMarkerPress,
  onMapError,
  onInteractionChange,
}: Props) {
  const canRenderMap = hasMapyApiKey();

  const html = useMemo(() => {
    if (!canRenderMap) {
      return '';
    }

    const markersJson = JSON.stringify(markers);
    const selectedJson = JSON.stringify(
      selectedLatitude !== null && selectedLongitude !== null
        ? { latitude: selectedLatitude, longitude: selectedLongitude }
        : null
    );

    return `<!DOCTYPE html>
<html lang="cs">
  <head>
    <meta charset="UTF-8" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      crossorigin=""
    />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
    <style>
      html, body, #map {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
        font-family: Arial, sans-serif;
        background: #eef1eb;
      }
      .map-shell {
        position: relative;
        width: 100%;
        height: 100%;
      }
      #map {
        z-index: 1;
      }
      .mapy-attribution {
        position: absolute;
        top: 8px;
        left: 8px;
        z-index: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 4px 8px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.88);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
      }
      .mapy-attribution img {
        height: 20px;
        display: block;
      }
      .mapy-attribution a {
        color: #2c3a27;
        text-decoration: none;
        font-size: 10px;
        font-weight: 700;
      }
      .picker-hint {
        position: absolute;
        right: 10px;
        bottom: 10px;
        z-index: 500;
        max-width: 220px;
        padding: 8px 10px;
        border-radius: 12px;
        background: rgba(33, 48, 28, 0.9);
        color: #fff;
        font-size: 12px;
        line-height: 1.35;
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
      }
      .leaflet-popup-content {
        margin: 10px 12px;
      }
      .area-marker {
        width: 54px;
        height: 54px;
        border-radius: 27px;
        border: 3px solid #ffffff;
        background: linear-gradient(180deg, #dce8d5 0%, #c8dbbf 100%);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.22);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .area-marker img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
      }
      .area-marker-fallback {
        font-size: 24px;
        line-height: 1;
      }
      .area-marker-emoji {
        font-size: 22px;
        line-height: 1;
      }
      .picker-marker {
        width: 22px;
        height: 22px;
        border-radius: 11px;
        background: #2d5a27;
        border: 3px solid #ffffff;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.25);
      }
      .popup-title {
        font-size: 14px;
        font-weight: 700;
        color: #24331f;
      }
      .popup-subtitle {
        margin-top: 4px;
        font-size: 12px;
        color: #586754;
      }
      .popup-action {
        margin-top: 8px;
        font-size: 12px;
        font-weight: 700;
        color: #2d5a27;
      }
      .marker-cluster-small,
      .marker-cluster-medium,
      .marker-cluster-large {
        background: rgba(45, 90, 39, 0.16);
      }
      .marker-cluster-small div,
      .marker-cluster-medium div,
      .marker-cluster-large div {
        background: #2d5a27;
        color: #fff;
        font-weight: 800;
      }
    </style>
  </head>
  <body>
    <div class="map-shell">
      <div class="mapy-attribution">
        <a href="https://mapy.com/" target="_blank" rel="noreferrer">
          <img src="https://api.mapy.com/img/api/logo.svg" alt="Mapy.com" />
        </a>
        <a href="https://api.mapy.com/copyright" target="_blank" rel="noreferrer">
          Seznam.cz a.s. a dalsi
        </a>
      </div>
      ${
        mode === 'picker'
          ? '<div class="picker-hint">Klepnutim do mapy nastavite polohu lezecke oblasti.</div>'
          : ''
      }
      <div id="map"></div>
    </div>

    <script
      src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      crossorigin=""
    ></script>
    <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
    <script>
      const apiKey = ${JSON.stringify(MAPY_API_KEY)};
      const initialMarkers = ${markersJson};
      const selectedPoint = ${selectedJson};
      const mode = ${JSON.stringify(mode)};
      const map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
      }).setView([${centerLatitude}, ${centerLongitude}], ${zoom});

      let pickerMarker = null;

      function escapeHtml(value) {
        return String(value)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;');
      }

      function createAreaIcon(marker) {
        const hasPreview = typeof marker.previewUri === 'string' && marker.previewUri.length > 0;
        const emoji = typeof marker.emoji === 'string' && marker.emoji.length > 0 ? marker.emoji : '🪨';
        const html = hasPreview
          ? '<div class="area-marker"><img src="' + escapeHtml(marker.previewUri) + '" alt="' + escapeHtml(marker.title) + '" /></div>'
          : '<div class="area-marker"><div class="area-marker-fallback area-marker-emoji">' + escapeHtml(emoji) + '</div></div>';

        return L.divIcon({
          html,
          className: '',
          iconSize: [54, 54],
          iconAnchor: [27, 27],
          popupAnchor: [0, -24],
        });
      }

      function createPickerIcon() {
        return L.divIcon({
          html: '<div class="picker-marker"></div>',
          className: '',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
      }

      function postMessage(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function setPickerMarker(latitude, longitude) {
        if (pickerMarker) {
          pickerMarker.setLatLng([latitude, longitude]);
          return;
        }

        pickerMarker = L.marker([latitude, longitude], { icon: createPickerIcon() }).addTo(map);
      }

      async function init() {
        try {
          const tileUrl = 'https://api.mapy.com/v1/maptiles/basic/256/{z}/{x}/{y}?apikey='
            + encodeURIComponent(apiKey)
            + '&lang=cs';

          L.tileLayer(tileUrl, {
            tileSize: 256,
            minZoom: 0,
            maxZoom: 19,
          }).addTo(map);

          const markerLayer = mode === 'browse'
            ? L.markerClusterGroup({
                showCoverageOnHover: false,
                spiderfyOnMaxZoom: true,
                maxClusterRadius: 42,
              })
            : L.layerGroup();

          initialMarkers.forEach((marker) => {
            const leafletMarker = L.marker(
              [marker.latitude, marker.longitude],
              { icon: createAreaIcon(marker) }
            );
            const popupHtml = '<div class="popup-title">' + marker.title + '</div>'
              + (marker.subtitle ? '<div class="popup-subtitle">' + marker.subtitle + '</div>' : '')
              + '<div class="popup-action">Otevrit detail oblasti</div>';
            leafletMarker.bindPopup(popupHtml);
            leafletMarker.on('click', () => postMessage({ type: 'open-marker', id: marker.id }));
            markerLayer.addLayer(leafletMarker);
          });

          markerLayer.addTo(map);

          if (mode === 'browse' && initialMarkers.length > 1) {
            const bounds = L.latLngBounds(initialMarkers.map((marker) => [marker.latitude, marker.longitude]));
            map.fitBounds(bounds.pad(0.18));
          }

          if (mode === 'picker') {
            map.on('click', (event) => {
              const { lat, lng } = event.latlng;
              setPickerMarker(lat, lng);
              postMessage({ type: 'select-location', latitude: lat, longitude: lng });
            });

            if (selectedPoint) {
              setPickerMarker(selectedPoint.latitude, selectedPoint.longitude);
            }
          }

          postMessage({ type: 'ready' });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown Mapy.com error';
          postMessage({ type: 'map-error', message });
        }
      }

      init();
    </script>
  </body>
</html>`;
  }, [
    canRenderMap,
    markers,
    mode,
    selectedLatitude,
    selectedLongitude,
    centerLatitude,
    centerLongitude,
    zoom,
  ]);

  if (!canRenderMap) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text style={styles.fallbackTitle}>{emptyStateTitle}</Text>
        <Text style={styles.fallbackText}>{emptyStateText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.webviewWrap, { height }]}>
      <WebView
        source={{ html, baseUrl: 'https://appassets.androidplatform.net/' }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        allowFileAccess
        allowFileAccessFromFileURLs
        allowingReadAccessToURL="file://"
        setSupportMultipleWindows={false}
        userAgent={MAPY_WEBVIEW_USER_AGENT}
        startInLoadingState
        nestedScrollEnabled
        onTouchStart={() => onInteractionChange?.(true)}
        onTouchEnd={() => onInteractionChange?.(false)}
        onTouchCancel={() => onInteractionChange?.(false)}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color="#2d5a27" />
          </View>
        )}
        onMessage={(event) => {
          try {
            const payload = JSON.parse(event.nativeEvent.data) as PickerMessage;
            if (payload.type === 'select-location') {
              onSelectLocation?.(payload.latitude, payload.longitude);
              return;
            }
            if (payload.type === 'open-marker') {
              onMarkerPress?.(payload.id);
              return;
            }
            if (payload.type === 'map-error') {
              onMapError?.(payload.message);
            }
          } catch {
            onMapError?.('Nepodarilo se precist odpoved z Mapy.com mapy.');
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  webviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f4f7f2',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f2',
  },
  fallback: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#f4f7f2',
    justifyContent: 'center',
  },
  fallbackTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#24331f',
    marginBottom: 6,
  },
  fallbackText: {
    fontSize: 13,
    color: '#5f6d5b',
    lineHeight: 18,
  },
});
