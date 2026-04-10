import { describe, expect, it } from 'vitest';
import { buildFreePipeResizeProps, shouldUseConnectorMinimalChrome } from './TransformControls';

describe('TransformControls free pipe resize props', () => {
  it('preserves a free vertical pipe when Moveable resize changes the box', () => {
    const props = buildFreePipeResizeProps(
      {
        points: [
          { x: 6, y: 0 },
          { x: 6, y: 240 },
        ],
        waypoints: [],
      },
      { width: 12, height: 240 },
      { width: 24, height: 360 },
    );

    expect(props.points).toEqual([
      { x: 12, y: 0 },
      { x: 12, y: 360 },
    ]);
    expect(props.waypoints).toEqual([]);
  });

  it('preserves a free elbow route instead of flattening it during resize', () => {
    const props = buildFreePipeResizeProps(
      {
        points: [
          { x: 20, y: 30 },
          { x: 140, y: 30 },
          { x: 140, y: 90 },
          { x: 260, y: 90 },
        ],
        waypoints: [],
      },
      { width: 260, height: 120 },
      { width: 390, height: 240 },
    );

    expect(props.points).toEqual([
      { x: 30, y: 60 },
      { x: 210, y: 60 },
      { x: 210, y: 180 },
      { x: 390, y: 180 },
    ]);
    expect(props.waypoints).toEqual([
      { x: 210, y: 60 },
      { x: 210, y: 180 },
    ]);
  });

  it('falls back to a default straight route when the stored free pipe route is invalid', () => {
    const props = buildFreePipeResizeProps({}, { width: 0, height: 0 }, { width: 180, height: 40 });

    expect(props.points).toEqual([
      { x: 0, y: 20 },
      { x: 180, y: 20 },
    ]);
    expect(props.waypoints).toEqual([]);
  });

  it('keeps full moveable chrome for an unrotated free pipe', () => {
    expect(
      shouldUseConnectorMinimalChrome([
        {
          type: 'industrial/pipe',
          props: {
            points: [
              { x: 0, y: 20 },
              { x: 180, y: 20 },
            ],
          },
        },
      ]),
    ).toBe(false);
  });

  it('uses connector minimal chrome for a rotated free pipe', () => {
    expect(
      shouldUseConnectorMinimalChrome([
        {
          type: 'industrial/pipe',
          props: {
            _rotation: 90,
            points: [
              { x: 5, y: 883 },
              { x: 5, y: 24 },
            ],
          },
        },
      ]),
    ).toBe(true);
  });
});
