import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
                    <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                        <div className="text-6xl mb-4">⚠️</div>
                        <h1 className="text-2xl font-bold text-ink mb-2">Bir Hata Oluştu</h1>
                        <p className="text-ink-2 mb-6">
                            Sayfa yüklenirken bir sorun oluştu.
                        </p>
                        <div className="space-y-3">
                            <button
                                onClick={() => window.location.href = '/login'}
                                className="w-full px-6 py-3 bg-brand text-white rounded-lg font-bold hover:bg-brand-hover transition"
                            >
                                Giriş Sayfasına Dön
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full px-6 py-3 bg-surface-3 text-ink-2 rounded-lg font-bold hover:bg-surface-3 transition"
                            >
                                Sayfayı Yenile
                            </button>
                        </div>
                        {this.state.error && (
                            <details className="mt-6 text-left">
                                <summary className="text-sm text-ink-2 cursor-pointer">Teknik Detaylar</summary>
                                <pre className="mt-2 text-xs bg-surface-3 p-3 rounded overflow-auto">
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
