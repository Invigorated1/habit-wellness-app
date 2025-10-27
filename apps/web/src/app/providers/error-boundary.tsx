'use client';

import React from 'react';

type ClientErrorBoundaryProps = {
	children: React.ReactNode;
	fallback?: React.ReactNode;
};

type ClientErrorBoundaryState = {
	hasError: boolean;
};

export class ClientErrorBoundary extends React.Component<
	ClientErrorBoundaryProps,
	ClientErrorBoundaryState
> {
	constructor(props: ClientErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): ClientErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: unknown, info: unknown) {
		// This only logs in the client console during runtime errors
		console.error('ClientErrorBoundary caught error', error, info);
	}

	render() {
		if (this.state.hasError) {
			return this.props.fallback ?? <>{this.props.children}</>;
		}
		return this.props.children;
	}
}

