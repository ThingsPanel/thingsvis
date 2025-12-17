import React, { useEffect, useRef } from 'react';
import { App, Image } from 'leafer-ui';

/**
 * Visual Spec: media/image
 */
export const Spec: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const app = new App({ view: ref.current, tree: {} });
    const img = new Image({
      x: 10,
      y: 10,
      url: 'https://p3-flow-imagex-sign.byteimg.com/tos-cn-i-a9rns2rl98/rc_gen_image/1f795d27941d4552a51dc6d9c43e1e59preview.jpeg~tplv-a9rns2rl98-downsize_watermark_1_6_b.png?rcl=20251217161907E5350F9BA6BDB7096D74&rk3s=8e244e95&rrcfp=ddbb2dc7&x-expires=2081319563&x-signature=AmrTpiYvQ0EApV32cQzbVyfgKbw%3D',
      width: 240,
      height: 140
    });
    (app.tree as any).add(img);
    return () => {
      app.destroy?.();
    };
  }, []);

  return <div ref={ref} style={{ width: 320, height: 200, border: '1px solid #ddd' }} />;
};


