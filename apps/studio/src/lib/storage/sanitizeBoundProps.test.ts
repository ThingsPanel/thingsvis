import { describe, expect, it } from 'vitest';
import {
  stripStaticPropsForBoundFields,
  stripStaticPropsForBoundProject,
} from './sanitizeBoundProps';

describe('stripStaticPropsForBoundFields', () => {
  it('removes static props that are overridden by data bindings', () => {
    const nodes = [
      {
        id: 'chart-1',
        props: {
          data: [{ name: '00:00', value: 12 }],
          title: 'Energy',
        },
        data: [{ targetProp: 'data', expression: '{{ ds.sensor.data.points }}' }],
      },
    ];

    expect(stripStaticPropsForBoundFields(nodes)).toEqual([
      {
        id: 'chart-1',
        props: {
          title: 'Energy',
        },
        data: [{ targetProp: 'data', expression: '{{ ds.sensor.data.points }}' }],
      },
    ]);
  });

  it('keeps static props that are not bound', () => {
    const nodes = [
      {
        id: 'chart-1',
        props: {
          data: [{ name: '00:00', value: 12 }],
          title: 'Energy',
        },
        data: [{ targetProp: 'title', expression: '{{ ds.sensor.data.title }}' }],
      },
    ];

    expect(stripStaticPropsForBoundFields(nodes)[0]?.props).toEqual({
      data: [{ name: '00:00', value: 12 }],
    });
  });

  it('does not mutate the editor state object', () => {
    const project = {
      nodes: [
        {
          id: 'chart-1',
          props: { data: [1], title: 'Energy' },
          data: [{ targetProp: 'data', expression: '{{ ds.sensor.data.points }}' }],
        },
      ],
    };

    const saved = stripStaticPropsForBoundProject(project);

    expect(saved.nodes[0]?.props).toEqual({ title: 'Energy' });
    expect(project.nodes[0]?.props).toEqual({ data: [1], title: 'Energy' });
  });
});
