import {
  BAR_SERIES,
  GAUGE_SERIES,
  LINE_SERIES,
  TABLE_COLUMNS,
} from './widget-data-fixtures';

const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 900;
const NODE_X = 96;
const NODE_Y = 72;
const NODE_WIDTH = 560;
const NODE_HEIGHT = 320;

function createBaseNode(componentId: string) {
  return {
    id: `${componentId.replace(/[\/]/g, '-')}-node`,
    type: componentId,
    position: { x: NODE_X, y: NODE_Y },
    size: { width: NODE_WIDTH, height: NODE_HEIGHT },
  };
}

export function createSmokeInitPayload(componentId: string) {
  const baseNode = createBaseNode(componentId);

  const node =
    componentId === 'chart/echarts-bar'
      ? {
          ...baseNode,
          props: {
            title: 'Bar Smoke',
            data: BAR_SERIES,
            showLegend: true,
            showXAxis: true,
            showYAxis: true,
          },
        }
      : componentId === 'chart/echarts-line'
        ? {
            ...baseNode,
            props: {
              title: 'Line Smoke',
              data: LINE_SERIES,
              smooth: true,
              showArea: true,
            },
          }
        : componentId === 'chart/echarts-gauge'
          ? {
              ...baseNode,
              props: {
                title: 'Gauge Smoke',
                data: GAUGE_SERIES,
                max: 100,
              },
            }
          : {
              ...baseNode,
              props: {
                columns: TABLE_COLUMNS,
                data: [
                  { name: 'Alpha', value: '18%' },
                  { name: 'Beta', value: '25%' },
                ],
                showHeader: true,
              },
            };

  return {
    data: {
      meta: {
        id: `embed-${componentId.replace(/[\/]/g, '-')}`,
        name: `${componentId} smoke`,
      },
      canvas: {
        mode: 'fixed',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: '#0f172a',
      },
      nodes: [node],
      dataSources: [],
    },
    config: {
      saveTarget: 'host',
    },
  };
}

export function createBoundTableInitPayload() {
  const node = {
    ...createBaseNode('basic/table'),
    props: {
      columns: TABLE_COLUMNS,
      data: [],
      showHeader: true,
    },
    data: [
      {
        targetProp: 'data',
        expression: '{{ ds.__platform__.data.rows }}',
        dataSourcePath: 'ds.__platform__.data',
      },
    ],
  };

  return {
    data: {
      meta: {
        id: 'embed-basic-table-refresh',
        name: 'basic/table refresh',
      },
      canvas: {
        mode: 'fixed',
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        background: '#111827',
      },
      nodes: [node],
      dataSources: [
        {
          id: '__platform__',
          name: 'System Platform',
          type: 'PLATFORM_FIELD',
          config: {
            source: 'platform',
            fieldMappings: {},
            bufferSize: 0,
          },
        },
      ],
    },
    config: {
      saveTarget: 'host',
    },
  };
}
