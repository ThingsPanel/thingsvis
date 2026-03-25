import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';

const setView = vi.fn();
const addControl = vi.fn();
const removeControl = vi.fn();
const removeLayer = vi.fn();
const invalidateSize = vi.fn();
const remove = vi.fn();

const markerSetLatLng = vi.fn();
const markerBindPopup = vi.fn();
const markerSetPopupContent = vi.fn();
const markerOpenPopup = vi.fn();
const markerClosePopup = vi.fn();
const markerUnbindPopup = vi.fn();

const tileAddTo = vi.fn();
const tileRemove = vi.fn();
const tileOn = vi.fn();

let hasPopup = false;

const markerInstance = {
  addTo: vi.fn(() => markerInstance),
  setLatLng: markerSetLatLng,
  bindPopup: vi.fn((title: string) => {
    hasPopup = true;
    markerBindPopup(title);
    return markerInstance;
  }),
  setPopupContent: vi.fn((title: string) => {
    markerSetPopupContent(title);
    return markerInstance;
  }),
  openPopup: vi.fn(() => {
    markerOpenPopup();
    return markerInstance;
  }),
  closePopup: vi.fn(() => {
    markerClosePopup();
    return markerInstance;
  }),
  unbindPopup: vi.fn(() => {
    hasPopup = false;
    markerUnbindPopup();
    return markerInstance;
  }),
  getPopup: vi.fn(() => (hasPopup ? {} : null)),
};

const mapInstance = {
  setView,
  addControl,
  removeControl,
  removeLayer,
  invalidateSize,
  remove,
  zoomControl: {},
  dragging: { enable: vi.fn(), disable: vi.fn() },
  touchZoom: { enable: vi.fn(), disable: vi.fn() },
  doubleClickZoom: { enable: vi.fn(), disable: vi.fn() },
  scrollWheelZoom: { enable: vi.fn(), disable: vi.fn() },
  boxZoom: { enable: vi.fn(), disable: vi.fn() },
  keyboard: { enable: vi.fn(), disable: vi.fn() },
};

const map = vi.fn(() => mapInstance);
const tileLayer = vi.fn(() => ({
  addTo: tileAddTo,
  remove: tileRemove,
  on: tileOn,
}));
const marker = vi.fn(() => markerInstance);
const icon = vi.fn(() => ({}));

vi.mock('leaflet', () => ({
  map,
  tileLayer,
  marker,
  icon,
}));

describe('geo/map widget', () => {
  beforeEach(() => {
    hasPopup = false;
    map.mockClear();
    tileLayer.mockClear();
    marker.mockClear();
    icon.mockClear();
    setView.mockClear();
    addControl.mockClear();
    removeControl.mockClear();
    removeLayer.mockClear();
    invalidateSize.mockClear();
    remove.mockClear();
    markerSetLatLng.mockClear();
    markerBindPopup.mockClear();
    markerSetPopupContent.mockClear();
    markerOpenPopup.mockClear();
    markerClosePopup.mockClear();
    markerUnbindPopup.mockClear();
    tileAddTo.mockClear();
    tileRemove.mockClear();
    tileOn.mockClear();

    Object.defineProperty(HTMLElement.prototype, 'clientWidth', {
      configurable: true,
      get() {
        return 320;
      },
    });
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
      configurable: true,
      get() {
        return 180;
      },
    });

    vi.stubGlobal(
      'ResizeObserver',
      class ResizeObserver {
        observe() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
  });

  it('repositions the map and marker when bound props change', async () => {
    const { default: Main } = await import('./src/index');

    const harness = mountWidget(Main, {
      locale: 'en',
      props: {
        positionSource: 'manual',
        lat: 39.9042,
        lng: 116.4074,
        zoom: 13,
        showMarker: true,
        markerTitle: 'Initial Marker',
        mapStyle: 'standard',
        showZoomControl: true,
        interactive: true,
      },
    });

    await vi.waitFor(() => expect(map).toHaveBeenCalledTimes(1));

    expect(setView).toHaveBeenLastCalledWith([39.9042, 116.4074], 13);
    expect(marker).toHaveBeenLastCalledWith([39.9042, 116.4074], expect.any(Object));
    expect(markerBindPopup).toHaveBeenCalledWith('Initial Marker');

    harness.update({
      props: {
        lat: 22.5431,
        lng: 114.0579,
        markerTitle: 'Updated Marker',
      },
    });

    await vi.waitFor(() => expect(markerSetLatLng).toHaveBeenCalledWith([22.5431, 114.0579]));

    expect(setView).toHaveBeenLastCalledWith([22.5431, 114.0579], 13);
    expect(markerSetPopupContent).toHaveBeenCalledWith('Updated Marker');

    harness.destroy();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});
