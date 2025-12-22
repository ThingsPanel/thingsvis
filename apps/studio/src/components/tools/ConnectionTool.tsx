import React, { useEffect, useState, useCallback } from "react";
import { useSyncExternalStore } from "react";
import type { KernelStore, KernelState } from "@thingsvis/kernel";

type Props = {
  kernelStore: KernelStore;
  activeTool: string;
};

export default function ConnectionTool({ kernelStore, activeTool }: Props) {
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null);

  const state = useSyncExternalStore(
    useCallback(subscribe => kernelStore.subscribe(subscribe), [kernelStore]),
    () => kernelStore.getState() as KernelState
  );

  useEffect(() => {
    if (activeTool !== "arrow") {
      setSourceNodeId(null);
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const nodeId = target.closest("[data-node-id]")?.getAttribute("data-node-id");

      if (!nodeId) return;

      if (!sourceNodeId) {
        setSourceNodeId(nodeId);
        // Visual feedback: select the source node
        kernelStore.getState().selectNode(nodeId);
      } else {
        if (sourceNodeId !== nodeId) {
          // Create connection
          kernelStore.getState().addConnection({
            sourceNodeId: sourceNodeId,
            targetNodeId: nodeId
          });
        }
        setSourceNodeId(null);
        kernelStore.getState().selectNode(null);
      }
    };

    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, [activeTool, sourceNodeId, kernelStore]);

  if (activeTool !== "arrow" || !sourceNodeId) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-[#6965db] text-white px-4 py-2 rounded-full shadow-lg z-[100] text-sm animate-pulse">
      {state.language === "zh" ? "请选择目标节点完成连线" : "Select target node to connect"}
    </div>
  );
}

