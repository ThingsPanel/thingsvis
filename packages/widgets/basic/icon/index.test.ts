import { afterEach, describe, expect, it } from 'vitest';
import { mountWidget } from '../../test-utils/widgetLifecycle';
import Main from './src/index';

describe('basic/icon widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('normalizes fixed-size local SVGs so they scale with the widget container', () => {
    const harness = mountWidget(Main, {
      size: { width: 160, height: 112 },
      props: {
        iconSource: 'local',
        assetKind: 'svg',
        svgContent:
          '<svg version="1.1" width="25" height="17.5" xmlns="http://www.w3.org/2000/svg"><path transform="scale(0.1)" d="M0 0h250v175H0z"/></svg>',
      },
    });

    const svg = harness.element.querySelector('svg');

    expect(svg?.getAttribute('viewBox')).toBe('0 0 25 17.5');
    expect(svg?.getAttribute('width')).toBe('100%');
    expect(svg?.getAttribute('height')).toBe('100%');
    expect((svg as SVGElement | null)?.style.width).toBe('100%');
    expect((svg as SVGElement | null)?.style.height).toBe('100%');

    harness.destroy();
  });
});
