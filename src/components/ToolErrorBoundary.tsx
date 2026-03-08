'use client';

import { Component, ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  toolName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ToolErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">משהו השתבש</h2>
            <p className="text-gray-500 mb-6">
              {this.props.toolName 
                ? `הכלי ${this.props.toolName} נתקל בבעיה. נסו שוב בעוד כמה שניות.`
                : 'נתקלנו בבעיה. נסו שוב בעוד כמה שניות.'
              }
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm hover:bg-gray-800 transition-colors"
              >
                נסו שוב
              </button>
              <Link
                href="/"
                className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-full text-sm hover:bg-gray-50 transition-colors"
              >
                חזרה לדף הבית
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
