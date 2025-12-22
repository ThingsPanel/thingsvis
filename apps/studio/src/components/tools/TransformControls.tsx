import React, { useEffect, useRef } from "react";
import Moveable from "moveable";
import Selecto from "selecto";
import type { KernelStore } from "@thingsvis/kernel";

type Props = {
  containerRef: React.RefObject<HTMLElement>;
  kernelStore?: KernelStore;
};

export default function TransformControls({ containerRef }: Props) {
  const moveableRef = useRef<any>(null);
  const selectoRef = useRef<any>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // init Moveable instance
    // NOTE: apps should ensure moveable/selecto are installed; this code is guarded
    try {
      // @ts-ignore
      moveableRef.current = new Moveable(container, { draggable: true, resizable: true, rotatable: true });
      // @ts-ignore
      selectoRef.current = new Selecto({ container });
      // wire basic events
      // @ts-ignore
      moveableRef.current.on("dragEnd", (e: any) => {
        // TODO: create MoveCommand + push into kernel history
      });
      // @ts-ignore
      selectoRef.current.on("select", (e: any) => {
        // TODO: handle selection
      });
    } catch (e) {
      // Moveable/Selecto may not be available in test env; fail gracefully.
      // eslint-disable-next-line no-console
      console.warn("[TransformControls] moveable/selecto not available", e);
    }

    return () => {
      try {
        moveableRef.current?.destroy();
        selectoRef.current?.destroy();
      } catch {}
    };
  }, [containerRef]);

  return null;
}


