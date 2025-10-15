import { useEffect, useRef, useState } from "react";

export const SUBMIT_BUTTON_DELAY_MS = 1000;

export function useIsLoading() {
	const [isLoading, setIsLoading] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const startLoading = () => {
		setIsLoading(true);
	};

	const stopLoading = () => {
		timeoutRef.current = setTimeout(() => {
			setIsLoading(false);
		}, SUBMIT_BUTTON_DELAY_MS);
	};

	return {
		isLoading,
		startLoading,
		stopLoading,
	};
}
