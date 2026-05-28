import * as THREE from 'three';

import type { Props } from './schema';



export type FlowPipeEntry = {

  mesh: THREE.Mesh;

  material: THREE.ShaderMaterial;

};



const PIPE_COLOR_MAP: Record<string, number> = {

  光伏: 0x3399ff,

  储能: 0xffaa00,

  车间: 0x3399ff,

  水泵: 0x22ee55,

};



function resolvePipeColor(name: string): THREE.Color {

  for (const [key, hex] of Object.entries(PIPE_COLOR_MAP)) {

    if (name.includes(key)) {

      return new THREE.Color(hex);

    }

  }

  return new THREE.Color(0xffffff);

}



function createFlowMaterial(color: THREE.Color, speed: number) {

  return new THREE.ShaderMaterial({

    transparent: true,

    depthWrite: true,

    uniforms: {

      uTime: { value: 0 },

      uColor: { value: color.clone() },

      uSpeed: { value: speed },

    },

    vertexShader: `

      varying vec2 vUv;

      varying float vAlong;

      void main() {

        vUv = uv;

        vAlong = position.x + position.y * 0.37 + position.z * 0.19;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

      }

    `,

    fragmentShader: `

      uniform float uTime;

      uniform vec3 uColor;

      uniform float uSpeed;

      varying vec2 vUv;

      varying float vAlong;

      void main() {

        float coord = mix(vAlong * 8.0, vUv.x * 14.0, step(0.001, vUv.x + vUv.y));

        float pulse = step(0.42, fract(coord - uTime * uSpeed));

        vec3 segmentColor = mix(vec3(1.0), uColor, pulse);

        gl_FragColor = vec4(segmentColor, 0.96);

      }

    `,

  });

}



export function clearPipeFlow(entries: FlowPipeEntry[]) {

  entries.forEach(({ mesh, material }) => {

    mesh.material = new THREE.MeshStandardMaterial({ color: 0xffffff });

    material.dispose();

  });

  entries.length = 0;

}



export function mountPipeFlow(root: THREE.Object3D, props: Props, entries: FlowPipeEntry[]) {

  clearPipeFlow(entries);

  if (!props.showPipeFlow) {

    return;

  }



  root.traverse((node) => {

    const mesh = node as THREE.Mesh;

    if (!mesh.isMesh || !mesh.name.startsWith(props.pipeNamePrefix)) {

      return;

    }



    const material = createFlowMaterial(resolvePipeColor(mesh.name), props.pipeFlowSpeed);

    mesh.material = material;

    entries.push({ mesh, material });

  });

}



export function updatePipeFlow(entries: FlowPipeEntry[], delta: number, enabled: boolean, speed: number) {

  if (!enabled) {

    return;

  }



  entries.forEach(({ material }) => {

    const timeUniform = material.uniforms.uTime;

    const speedUniform = material.uniforms.uSpeed;

    if (!timeUniform || !speedUniform) {

      return;

    }



    timeUniform.value += delta * speed;

    speedUniform.value = speed;

  });

}

