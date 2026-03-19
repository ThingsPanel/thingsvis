import type { NodeSchemaType } from '@thingsvis/schema';
import type { KernelState, KernelStore, NodeState } from './KernelStore';

export type RuntimePatch = {
  nodeId: string;
  patch: Partial<NodeSchemaType> | NodeSchemaType;
};

export type SubscribeToPatches = (callback: (patches: RuntimePatch[]) => void) => () => void;

class TinyEmitter {
  private handlers = new Set<(patches: RuntimePatch[]) => void>();

  on(handler: (patches: RuntimePatch[]) => void): void {
    this.handlers.add(handler);
  }

  off(handler: (patches: RuntimePatch[]) => void): void {
    this.handlers.delete(handler);
  }

  emit(patches: RuntimePatch[]): void {
    this.handlers.forEach((handler) => {
      try {
        handler(patches);
      } catch {
        // Keep patch fan-out resilient to listener failures.
      }
    });
  }
}

function toPatch(previousNode?: NodeState, nextNode?: NodeState): RuntimePatch | null {
  if (!previousNode && nextNode) {
    return {
      nodeId: nextNode.id,
      patch: nextNode.schemaRef,
    };
  }

  if (previousNode && !nextNode) {
    return {
      nodeId: previousNode.id,
      patch: { id: previousNode.id } as Partial<NodeSchemaType>,
    };
  }

  if (!previousNode || !nextNode || previousNode.schemaRef === nextNode.schemaRef) {
    return null;
  }

  return {
    nodeId: nextNode.id,
    patch: nextNode.schemaRef,
  };
}

function diffNodePatches(
  previousNodes: KernelState['nodesById'],
  nextNodes: KernelState['nodesById'],
): RuntimePatch[] {
  const patches: RuntimePatch[] = [];
  const nodeIds = new Set([...Object.keys(previousNodes), ...Object.keys(nextNodes)]);

  nodeIds.forEach((nodeId) => {
    const patch = toPatch(previousNodes[nodeId], nextNodes[nodeId]);
    if (patch) {
      patches.push(patch);
    }
  });

  return patches;
}

export function createStorePatchBridge(store: KernelStore): {
  subscribeToPatches: SubscribeToPatches;
  dispose: () => void;
} {
  const emitter = new TinyEmitter();
  const unsubscribeStore = store.subscribe((state, previousState) => {
    const patches = diffNodePatches(previousState.nodesById, state.nodesById);
    if (patches.length > 0) {
      emitter.emit(patches);
    }
  });

  return {
    subscribeToPatches(callback) {
      emitter.on(callback);
      return () => {
        emitter.off(callback);
      };
    },
    dispose() {
      unsubscribeStore();
    },
  };
}
