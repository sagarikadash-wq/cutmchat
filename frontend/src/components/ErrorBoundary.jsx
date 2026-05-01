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
        console.error("UI Error caught by ErrorBoundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
                    <div className="max-w-md w-full bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center">
                        <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">⚠️</span>
                        </div>
                        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                        <p className="text-slate-400 mb-8">
                            The application encountered an unexpected error. Don't worry, your data is safe.
                        </p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-900/40"
                        >
                            Reload Application
                        </button>
                        <p className="mt-6 text-xs text-slate-500 font-mono break-all">
                            {this.state.error?.toString()}
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
