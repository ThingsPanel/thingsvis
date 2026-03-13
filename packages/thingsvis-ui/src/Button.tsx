import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    label?: string;
  }
>;

export function Button({ label, children, ...props }: ButtonProps) {
  return (
    <button type="button" {...props}>
      {label ?? children ?? 'Button'}
    </button>
  );
}

