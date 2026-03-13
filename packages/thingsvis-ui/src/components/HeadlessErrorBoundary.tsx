import React from 'react';

type Props = {
  fallback: React.ReactElement;
  children: React.ReactNode;
};

type State = { hasError: boolean };

class Boundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[HeadlessErrorBoundary] Caught error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export const HeadlessErrorBoundary: React.FC<Props> = ({ fallback, children }) => {
  return <Boundary fallback={fallback}>{children}</Boundary>;
};


