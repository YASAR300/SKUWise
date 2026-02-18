"use client";

import React from "react";
import ErrorFallback from "./ErrorFallback";

/**
 * Global Error Boundary
 * Catches rendering errors in the component tree and displays a fallback UI.
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error to our internal logging API
        this.logError(error, errorInfo);
    }

    async logError(error, errorInfo) {
        try {
            await fetch("/api/logs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "CLIENT_ERROR",
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    url: window.location.href,
                    timestamp: new Date().toISOString()
                })
            });
        } catch (logError) {
            console.error("Failed to report error to server:", logError);
        }
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} reset={() => this.setState({ hasError: false })} />;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
