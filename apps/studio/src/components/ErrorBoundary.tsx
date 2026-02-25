import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
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
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return { hasError: true, error }
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        // eslint-disable-next-line no-console
        console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
        this.setState({ errorInfo })
    }

    handleRetry = (): void => {
        this.setState({ hasError: false, error: null, errorInfo: null })
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
                    errorInfo={this.state.errorInfo}
                    onRetry={this.handleRetry}
                    onReload={this.handleReload}
                />
            )
        }

        return this.props.children
    }
}

function ErrorFallback({ error, errorInfo, onRetry, onReload }: { error: Error | null; errorInfo: React.ErrorInfo | null; onRetry: () => void; onReload: () => void }) {
    const { t } = useTranslation('common');

    return (
        <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Top accent line */}
            <div className="h-1 bg-red-600 dark:bg-red-500 w-full" />

            <div className="flex-1 w-full max-w-5xl mx-auto p-6 md:p-12 lg:p-16 flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-3 text-red-600 dark:text-red-500 mb-2">
                        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                <path d="M12 9v4" />
                                <path d="M12 17h.01" />
                            </svg>
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            {t('errorBoundary.title')}
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground max-w-2xl mt-1">
                        {t('errorBoundary.description')}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3">
                    <Button
                        onClick={onRetry}
                        variant="default"
                        size="lg"
                    >
                        {t('retry')}
                    </Button>
                    <Button
                        onClick={onReload}
                        variant="outline"
                        size="lg"
                        className="text-foreground border-foreground/30 hover:bg-foreground/5 hover:text-foreground font-medium shadow-sm transition-colors"
                    >
                        {t('errorBoundary.reload')}
                    </Button>
                </div>

                {/* Details Section */}
                {error && (
                    <div className="flex-1 min-h-0 flex flex-col mt-4 border-t pt-8">
                        <h2 className="text-xl font-semibold mb-4 text-foreground/90">Error Details</h2>
                        <div className="flex-1 overflow-auto rounded-lg bg-zinc-950 p-6 font-mono text-sm leading-relaxed text-zinc-300 shadow-inner">
                            <div className="text-red-400 font-bold mb-6 text-base inline-block border-b border-red-400/30 pb-1">
                                {error.name}: {error.message}
                            </div>

                            <div className="space-y-6">
                                {error.stack && (
                                    <div>
                                        <div className="text-zinc-500 font-semibold mb-2 select-none uppercase tracking-wider text-xs">Stack Trace</div>
                                        <pre className="whitespace-pre-wrap break-all">
                                            {error.stack}
                                        </pre>
                                    </div>
                                )}
                                {errorInfo?.componentStack && (
                                    <div className="pt-6 border-t border-zinc-800">
                                        <div className="text-zinc-500 font-semibold mb-2 select-none uppercase tracking-wider text-xs">Component Stack</div>
                                        <pre className="whitespace-pre-wrap break-all opacity-80">
                                            {errorInfo.componentStack}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ErrorBoundary;
