import {
  degToRad,
  rotatePt,
  nodeCenter,
  anchorLocalOffset,
  localToWorld,
  worldToLocal,
  getAnchorWorld,
  getAllAnchorsWorld,
  closestAnchor,
  distToSegment,
  closestPointOnPolyline,
  nodeToLayout,
  type NodeLayout,
  type Pt,
} from './nodeLayoutTransform';

const layout90: NodeLayout = {
  position: { x: 0, y: 0 },
  size: { width: 100, height: 40 },
  rotation: 90,
};

const layout0: NodeLayout = {
  position: { x: 0, y: 0 },
  size: { width: 100, height: 40 },
  rotation: 0,
};

describe('nodeLayoutTransform', () => {
  describe('degToRad', () => {
    it('converts 0 degrees', () => expect(degToRad(0)).toBe(0));
    it('converts 90 degrees', () => expect(degToRad(90)).toBeCloseTo(Math.PI / 2));
    it('converts 180 degrees', () => expect(degToRad(180)).toBeCloseTo(Math.PI));
  });

  describe('rotatePt', () => {
    it('no-op at 0 degrees', () => {
      const result = rotatePt({ x: 10, y: 5 }, { x: 0, y: 0 }, 0);
      expect(result.x).toBeCloseTo(10);
      expect(result.y).toBeCloseTo(5);
    });
    it('rotates 90 degrees around origin', () => {
      const result = rotatePt({ x: 10, y: 0 }, { x: 0, y: 0 }, 90);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(10);
    });
    it('rotates around arbitrary origin', () => {
      // Center of a 100x40 box at origin
      const result = rotatePt({ x: 0, y: 20 }, { x: 50, y: 20 }, 90);
      expect(result.x).toBeCloseTo(50);
      expect(result.y).toBeCloseTo(-30);
    });
  });

  describe('nodeCenter', () => {
    it('returns center of unrotated node', () => {
      const c = nodeCenter(layout0);
      expect(c.x).toBe(50);
      expect(c.y).toBe(20);
    });
  });

  describe('anchorLocalOffset', () => {
    it('top anchor is at (width/2, 0)', () => {
      const a = anchorLocalOffset('top', { width: 100, height: 40 });
      expect(a.x).toBe(50);
      expect(a.y).toBe(0);
    });
    it('center anchor is at (width/2, height/2)', () => {
      const a = anchorLocalOffset('center', { width: 100, height: 40 });
      expect(a.x).toBe(50);
      expect(a.y).toBe(20);
    });
  });

  describe('localToWorld / worldToLocal roundtrip', () => {
    it('roundtrip is identity for unrotated node', () => {
      const world = { x: 70, y: 15 };
      const local = worldToLocal(layout0, world);
      const back = localToWorld(layout0, local);
      expect(back.x).toBeCloseTo(world.x);
      expect(back.y).toBeCloseTo(world.y);
    });
    it('roundtrip is identity for rotated node', () => {
      const world = { x: 20, y: 10 };
      const local = worldToLocal(layout90, world);
      const back = localToWorld(layout90, local);
      expect(back.x).toBeCloseTo(world.x);
      expect(back.y).toBeCloseTo(world.y);
    });
  });

  describe('getAnchorWorld', () => {
    it('unrotated: right anchor at (100, 20)', () => {
      const w = getAnchorWorld(layout0, 'right');
      expect(w.x).toBeCloseTo(100);
      expect(w.y).toBeCloseTo(20);
    });
    it('90-degree rotated: top anchor moves to right side', () => {
      const w = getAnchorWorld(layout90, 'top');
      // top: (50, 0) local → rotated 90° counterclockwise around center (50, 20)
      //  dx=0, dy=-20 → dx'=20, dy'=0
      //  world: (50+20, 20+0) = (70, 20)
      expect(w.x).toBeCloseTo(70);
      expect(w.y).toBeCloseTo(20);
    });
    it('90-degree rotated: center stays at center', () => {
      const w = getAnchorWorld(layout90, 'center');
      expect(w.x).toBeCloseTo(50);
      expect(w.y).toBeCloseTo(20);
    });
  });

  describe('getAllAnchorsWorld', () => {
    it('unrotated node: top at (50, 0), bottom at (50, 40)', () => {
      const anchors = getAllAnchorsWorld(layout0);
      const top = anchors.find((a) => a.anchor === 'top')!;
      const bottom = anchors.find((a) => a.anchor === 'bottom')!;
      expect(top.world.x).toBeCloseTo(50);
      expect(top.world.y).toBeCloseTo(0);
      expect(bottom.world.x).toBeCloseTo(50);
      expect(bottom.world.y).toBeCloseTo(40);
    });
  });

  describe('closestAnchor', () => {
    it('finds nearest cardinal anchor', () => {
      const result = closestAnchor(layout0, { x: 55, y: 5 });
      // (55, 5) is closest to top anchor (50, 0)
      expect(result.anchor).toBe('top');
    });
    it('prefers center when equidistant', () => {
      // Point exactly in center
      const result = closestAnchor(layout0, { x: 50, y: 20 });
      expect(result.anchor).toBe('center');
    });
  });

  describe('distToSegment', () => {
    it('returns 0 at segment endpoint', () => {
      const d = distToSegment({ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expect(d).toBeCloseTo(0);
    });
    it('returns perpendicular distance to horizontal segment', () => {
      const d = distToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expect(d).toBeCloseTo(3);
    });
    it('returns distance to closest endpoint if outside', () => {
      const d = distToSegment({ x: 15, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 });
      expect(d).toBeCloseTo(5);
    });
  });

  describe('closestPointOnPolyline', () => {
    it('finds closest point on straight line', () => {
      const result = closestPointOnPolyline({ x: 5, y: 0 }, [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
      ]);
      expect(result!.point.x).toBeCloseTo(5);
      expect(result!.point.y).toBeCloseTo(0);
      expect(result!.segmentIndex).toBe(0);
    });
    it('finds closest point on elbow', () => {
      const result = closestPointOnPolyline({ x: 5, y: 5 }, [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
      ]);
      // Closest to horizontal segment at (5, 0)
      expect(result!.point.x).toBeCloseTo(5);
      expect(result!.point.y).toBeCloseTo(0);
      expect(result!.segmentIndex).toBe(0);
    });
    it('returns null for empty polyline', () => {
      expect(closestPointOnPolyline({ x: 0, y: 0 }, [])).toBeNull();
    });
  });

  describe('nodeToLayout', () => {
    it('extracts from schemaRef.props._rotation', () => {
      const node = {
        schemaRef: {
          position: { x: 10, y: 20 },
          size: { width: 80, height: 60 },
          props: { _rotation: 45 },
        },
      };
      const layout = nodeToLayout(node as any);
      expect(layout.position.x).toBe(10);
      expect(layout.position.y).toBe(20);
      expect(layout.size.width).toBe(80);
      expect(layout.rotation).toBe(45);
    });
    it('falls back to schemaRef.props.rotation', () => {
      const node = {
        schemaRef: {
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
          props: { rotation: 30 },
        },
      };
      expect(nodeToLayout(node as any).rotation).toBe(30);
    });
    it('defaults to 0 when no rotation', () => {
      const node = { schemaRef: { position: { x: 0, y: 0 }, size: { width: 50, height: 50 } } };
      expect(nodeToLayout(node as any).rotation).toBe(0);
    });
  });
});
