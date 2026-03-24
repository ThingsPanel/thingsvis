import {
  defineWidget,
  resolveWidgetColors,
  type WidgetOverlayContext,
} from '@thingsvis/widget-sdk';
import { metadata } from './metadata';
import { PropsSchema, type Props } from './schema';
import { controls } from './controls';
import zh from './locales/zh.json';
import en from './locales/en.json';

// Leaflet CSS will be injected dynamically
const LEAFLET_CSS = `
  .leaflet-pane,
  .leaflet-tile,
  .leaflet-marker-icon,
  .leaflet-marker-shadow,
  .leaflet-tile-container,
  .leaflet-pane > svg,
  .leaflet-pane > canvas,
  .leaflet-zoom-box,
  .leaflet-image-layer,
  .leaflet-layer {
    position: absolute;
    left: 0;
    top: 0;
  }
  .leaflet-container { overflow: hidden; }
  .leaflet-tile,
  .leaflet-marker-icon,
  .leaflet-marker-shadow {
    user-select: none;
    -webkit-user-drag: none;
  }
  .leaflet-tile::selection { background: transparent; }
  .leaflet-safari .leaflet-tile { image-rendering: -webkit-optimize-contrast; }
  .leaflet-container a { -webkit-tap-highlight-color: transparent; color: #0078A8; }
  .leaflet-container a.leaflet-active { outline: 2px solid orange; }
  .leaflet-zoom-box { border: 2px dotted #38f; background: rgba(255,255,255,0.5); }
  .leaflet-bar { box-shadow: 0 1px 5px rgba(0,0,0,0.65); border-radius: 4px; }
  .leaflet-bar a { background-color: #fff; border-bottom: 1px solid #ccc; width: 26px; height: 26px; line-height: 26px; display: block; text-align: center; text-decoration: none; color: black; }
  .leaflet-bar a:hover { background-color: #f4f4f4; }
  .leaflet-bar a:first-child { border-top-left-radius: 4px; border-top-right-radius: 4px; }
  .leaflet-bar a:last-child { border-bottom-left-radius: 4px; border-bottom-right-radius: 4px; border-bottom: none; }
  .leaflet-bar a.leaflet-disabled { cursor: default; background-color: #f4f4f4; color: #bbb; }
  .leaflet-control-zoom-in, .leaflet-control-zoom-out { font: bold 18px 'Lucida Console', Monaco, monospace; text-indent: 1px; }
  .leaflet-touch .leaflet-bar a { width: 30px; height: 30px; line-height: 30px; }
  .leaflet-control-attribution { padding: 0 5px; color: #333; }
  .leaflet-control-attribution a { text-decoration: none; }
  .leaflet-container .leaflet-control-attribution { font-size: 11px; background: rgba(255, 255, 255, 0.8); margin: 0; }
  .leaflet-pane { z-index: 400; }
  .leaflet-tile-pane { z-index: 200; }
  .leaflet-overlay-pane { z-index: 400; }
  .leaflet-shadow-pane { z-index: 500; }
  .leaflet-marker-pane { z-index: 600; }
  .leaflet-tooltip-pane { z-index: 650; }
  .leaflet-popup-pane { z-index: 700; }
  .leaflet-map-pane canvas { z-index: 100; }
  .leaflet-map-pane svg { z-index: 200; }
  .leaflet-vml-shape { width: 1px; height: 1px; }
  .lvml { behavior: url(#default#VML); display: inline-block; position: absolute; }
  .leaflet-control { position: relative; z-index: 800; pointer-events: auto; }
  .leaflet-top, .leaflet-bottom { position: absolute; z-index: 1000; pointer-events: none; }
  .leaflet-top { top: 0; }
  .leaflet-right { right: 0; }
  .leaflet-bottom { bottom: 0; }
  .leaflet-left { left: 0; }
  .leaflet-control { float: left; clear: both; }
  .leaflet-right .leaflet-control { float: right; }
  .leaflet-top .leaflet-control { margin-top: 10px; }
  .leaflet-bottom .leaflet-control { margin-bottom: 10px; }
  .leaflet-left .leaflet-control { margin-left: 10px; }
  .leaflet-right .leaflet-control { margin-right: 10px; }
`;

export const Main = defineWidget({
  ...metadata,
  schema: PropsSchema,
  locales: { zh, en },
  controls,
  render: (element: HTMLElement, props: Props, _ctx: WidgetOverlayContext) => {
    let currentProps = props;
    let map: any = null;
    let marker: any = null;
    let resizeObserver: ResizeObserver | null = null;
    
    // Inject Leaflet CSS once (include full CSS for tiles)
    if (!document.getElementById('leaflet-widget-css')) {
      const style = document.createElement('style');
      style.id = 'leaflet-widget-css';
      style.textContent = LEAFLET_CSS + `
        .leaflet-tile { visibility: visible; }
        .leaflet-container { background: #ddd; }
        .leaflet-container .leaflet-tile-pane { opacity: 1; }
      `;
      document.head.appendChild(style);
    }

    element.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: hidden;
      border-radius: inherit;
      position: relative;
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 100%; height: 100%; position: absolute; inset: 0;';
    element.appendChild(container);

    const initMap = async () => {
      // Wait for container to have size
      if (container.clientWidth === 0 || container.clientHeight === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          // Still no size, will retry on resize
          return false;
        }
      }

      const L = await import('leaflet');
      
      // Create map
      map = L.map(container, {
        zoomControl: currentProps.showZoomControl,
        attributionControl: true,
        dragging: currentProps.interactive,
        touchZoom: currentProps.interactive,
        doubleClickZoom: currentProps.interactive,
        scrollWheelZoom: currentProps.interactive,
        boxZoom: currentProps.interactive,
        keyboard: currentProps.interactive,
      });

      // Set view
      map.setView([currentProps.lat, currentProps.lng], currentProps.zoom);

      // Add tile layer based on style
      const tileUrls: Record<string, string> = {
        standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      };

      // Use a reliable tile source - using CartoDB which has better CDN
      const tileUrl = tileUrls[currentProps.mapStyle] ?? tileUrls.standard;
      
      const tileLayer = L.tileLayer(tileUrl as string, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      });
      
      tileLayer.on('tileerror', () => {
        // Tiles may fail to load in local dev due to network/CORS
        console.warn('Map tiles failed to load. This is normal in local development.');
      });
      
      tileLayer.addTo(map);

      // Add marker
      if (currentProps.showMarker) {
        const colors = resolveWidgetColors(element);
        const primaryColor = colors.primary || '#0078A8';
        
        // Custom marker icon using SVG
        const svgIcon = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
            <path fill="${primaryColor}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="2.5" fill="white"/>
          </svg>
        `;
        const iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgIcon)));
        
        const customIcon = L.icon({
          iconUrl,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
        });

        marker = L.marker([currentProps.lat, currentProps.lng], { icon: customIcon })
          .addTo(map);
        
        if (currentProps.markerTitle) {
          marker.bindPopup(currentProps.markerTitle).openPopup();
        }
      }

      return true;
    };

    // Initialize with retry logic
    let initAttempts = 0;
    const tryInit = async () => {
      const success = await initMap();
      if (!success && initAttempts < 10) {
        initAttempts++;
        setTimeout(tryInit, 100);
      }
    };
    tryInit();

    // Handle resize
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        if (map) {
          map.invalidateSize();
        } else if (initAttempts < 10) {
          // Retry init if not yet successful
          tryInit();
        }
      });
      resizeObserver.observe(element);
    }

    return {
      update: async (nextProps: Props) => {
        const L = await import('leaflet');
        const oldProps = currentProps;
        currentProps = nextProps;

        if (!map) return;

        // Update view if lat/lng/zoom changed
        if (oldProps.lat !== nextProps.lat || 
            oldProps.lng !== nextProps.lng || 
            oldProps.zoom !== nextProps.zoom) {
          map.setView([nextProps.lat, nextProps.lng], nextProps.zoom);
        }

        // Update marker
        if (nextProps.showMarker) {
          if (marker) {
            marker.setLatLng([nextProps.lat, nextProps.lng]);
            if (nextProps.markerTitle) {
              marker.setPopupContent(nextProps.markerTitle);
              marker.openPopup();
            }
          } else {
            // Recreate marker
            const colors = resolveWidgetColors(element);
            const primaryColor = colors.primary || '#0078A8';
            
            const svgIcon = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
                <path fill="${primaryColor}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                <circle cx="12" cy="9" r="2.5" fill="white"/>
              </svg>
            `;
            const iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgIcon)));
            
            const customIcon = L.icon({
              iconUrl,
              iconSize: [32, 32],
              iconAnchor: [16, 32],
              popupAnchor: [0, -32],
            });

            marker = L.marker([nextProps.lat, nextProps.lng], { icon: customIcon })
              .addTo(map);
            
            if (nextProps.markerTitle) {
              marker.bindPopup(nextProps.markerTitle).openPopup();
            }
          }
        } else if (marker) {
          map.removeLayer(marker);
          marker = null;
        }

        // Update zoom control visibility
        if (oldProps.showZoomControl !== nextProps.showZoomControl) {
          if (nextProps.showZoomControl) {
            map.addControl(map.zoomControl || L.control.zoom());
          } else {
            map.removeControl(map.zoomControl);
          }
        }

        // Update interactivity
        if (oldProps.interactive !== nextProps.interactive) {
          if (nextProps.interactive) {
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
          } else {
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.scrollWheelZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
          }
        }
      },
      destroy: () => {
        resizeObserver?.disconnect();
        if (map) {
          map.remove();
          map = null;
        }
        marker = null;
        element.innerHTML = '';
      },
    };
  },
});

export default Main;
