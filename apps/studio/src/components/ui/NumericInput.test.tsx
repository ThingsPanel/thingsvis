import React, { useState } from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { NumericInput } from './NumericInput';

const reactActEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

function Harness({
  initialValue,
  mode = 'float',
}: {
  initialValue: number;
  mode?: 'float' | 'int';
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div>
      <NumericInput
        value={value}
        onValueChange={(nextValue) => setValue(nextValue ?? 0)}
        mode={mode}
      />
      <output data-testid="committed-value">{String(value)}</output>
    </div>
  );
}

describe('NumericInput', () => {
  reactActEnvironment.IS_REACT_ACT_ENVIRONMENT = true;

  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
    container?.remove();
    container = null;
  });

  it('keeps the in-progress draft while external numeric state updates', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(<Harness initialValue={1} mode="int" />);
    });

    const input = container.querySelector('input') as HTMLInputElement;
    const committedValue = container.querySelector('[data-testid="committed-value"]');

    act(() => {
      Simulate.focus(input);
      Simulate.change(input, { target: { value: '0' } } as any);
    });
    expect(input.value).toBe('0');
    expect(committedValue?.textContent).toBe('0');

    act(() => {
      Simulate.change(input, { target: { value: '0111' } } as any);
    });
    expect(input.value).toBe('0111');
    expect(committedValue?.textContent).toBe('111');

    act(() => {
      Simulate.blur(input);
    });
    expect(input.value).toBe('111');
  });

  it('allows transient decimal drafts before blur normalization', () => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    act(() => {
      root?.render(<Harness initialValue={1} />);
    });

    const input = container.querySelector('input') as HTMLInputElement;

    act(() => {
      Simulate.focus(input);
      Simulate.change(input, { target: { value: '1.' } } as any);
    });
    expect(input.value).toBe('1.');

    act(() => {
      Simulate.blur(input);
    });
    expect(input.value).toBe('1');
  });
});
