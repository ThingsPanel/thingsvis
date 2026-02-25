import React from 'react'

interface ErrorBoundaryProps {
    children: React.ReactNode
    fallback?: React.ReactNode
}

interface ErrorBoundaryState {
    hasError: boolean
    error: Error | null
}

/**
 * Global Error Boundary
 * 
 * Catches uncaught React errors and displays a fallback UI
 * instead of a white screen. Includes a retry button.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null })
    }

    handleReload = (): void => {
        window.location.reload()
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback
            }

            return (
                <div
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1a1a2e',
                        color: '#e0e0e0',
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                    }}
                >
                    <div
                        style={{
                            maxWidth: '480px',
                            padding: '48px',
                            textAlign: 'center',
                        }}
                    >
                        <div
                            style={{
                                width: '64px',
                                height: '64px',
                                margin: '0 auto 24px',
                                borderRadius: '16px',
                                background: 'linear-gradient(135deg, #e74c3c, #c0392b)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                            }}
                        >
                            ⚠️
                        </div>
                        <h1
                            style={{
                                fontSize: '24px',
                                fontWeight: 600,
                                marginBottom: '12px',
                                color: '#fff',
                            }}
                        >
                            Something went wrong
                        </h1>
                        <p
                            style={{
                                fontSize: '14px',
                                marginBottom: '24px',
                                color: '#aaa',
                                lineHeight: 1.6,
                            }}
                        >
                            An unexpected error occurred. You can try retrying or reloading the page.
                        </p>
                        {this.state.error && (
                            <pre
                                style={{
                                    fontSize: '12px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: '#e74c3c',
                                    overflow: 'auto',
                                    maxHeight: '120px',
                                    textAlign: 'left',
                                    marginBottom: '24px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                }}
                            >
                                {this.state.error.message}
                            </pre>
                        )}
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button
                                onClick={this.handleRetry}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: '#6965db',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                }}
                            >
                                Retry
                            </button>
                            <button
                                onClick={this.handleReload}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    background: 'transparent',
                                    color: '#e0e0e0',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                }}
                            >
                                Reload Page
                            </button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
