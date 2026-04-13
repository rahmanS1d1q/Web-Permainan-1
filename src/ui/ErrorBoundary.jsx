import { Component } from "react";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Game error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fadeup flex flex-col items-center gap-4 py-8 text-center">
          <div className="w-12 h-12 text-red-500 mx-auto">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <path d="M10 2 L18 17 H2 Z" />
              <path d="M10 8 L10 12" />
              <circle
                cx="10"
                cy="14.5"
                r="0.8"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </div>
          <p className="text-sm font-bold text-red-400">
            Something went wrong in this game
          </p>
          <p className="text-xs text-yellow-800">{this.state.error?.message}</p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className="btn-gold px-6 py-2 text-sm"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
