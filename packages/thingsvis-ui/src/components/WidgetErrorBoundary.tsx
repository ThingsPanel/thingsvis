import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Widget type name (for error message) */
    widgetType?: string;
    /** Custom fallback UI */
    fallback?: ReactNode;
    /** Callback when error occurs */
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

/**
 * WidgetErrorBoundary — wraps widget rendering to prevent a single
 * widget crash from taking down the entire editor.
 *
 * Shows a friendly error UI with a retry button.
 */
export class WidgetErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[WidgetErrorBoundary] ${this.props.widgetType ?? 'Widget'} crashed:`, error, errorInfo);
        this.props.onError?.(error, errorInfo);
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    background: '#fff5f5',
                    border: '1px solid #feb2b2',
                    borderRadius: '4px',
                    padding: '12px',
                    color: '#c53030',
                    fontSize: '12px',
                }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>
                        ⚠️ 组件加载失败
                    </div>
                    <div style={{ color: '#718096', textAlign: 'center' }}>
                        {this.props.widgetType && <span>{this.props.widgetType}: </span>}
                        {this.state.error?.message || '未知错误'}
                    </div>
                    <button
                        onClick={this.handleRetry}
                        style={{
                            marginTop: '4px',
                            padding: '4px 12px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '4px',
                            background: '#fff',
                            cursor: 'pointer',
                            fontSize: '12px',
                            color: '#4a5568',
                        }}
                    >
                        重试
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default WidgetErrorBoundary;
