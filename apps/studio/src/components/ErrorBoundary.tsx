import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Undo2 } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
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
                <ErrorFallback
                    error={this.state.error}
                    onRetry={this.handleRetry}
                    onReload={this.handleReload}
                />
            )
        }

        return this.props.children
    }
}

function ErrorFallback({ error, onRetry, onReload }: { error: Error | null; onRetry: () => void; onReload: () => void }) {
    const { t } = useTranslation('common');

    return (
        <div className="min-h-screen flex items-center justify-center bg-background/50 backdrop-blur-sm p-4">
            <div className="max-w-md w-full p-8 rounded-xl border bg-card text-card-foreground shadow-lg text-center space-y-6">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6">
                    <AlertTriangle className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                        {t('errorBoundary.title')}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t('errorBoundary.description')}
                    </p>
                </div>

                {error && (
                    <div className="relative">
                        <pre className="text-xs p-4 rounded-lg bg-muted text-muted-foreground overflow-auto max-h-32 text-left border font-mono">
                            {error.message}
                        </pre>
                    </div>
                )}

                <div className="flex items-center justify-center gap-4 pt-2">
                    <Button
                        onClick={onRetry}
                        variant="default"
                        className="gap-2"
                    >
                        <Undo2 className="w-4 h-4" />
                        {t('retry')}
                    </Button>
                    <Button
                        onClick={onReload}
                        variant="outline"
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('errorBoundary.reload')}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ErrorBoundary;
