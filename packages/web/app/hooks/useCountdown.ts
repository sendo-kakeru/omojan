import { useCallback, useEffect, useRef, useState } from "react";

export function useCountdown() {
	const [count, setCount] = useState(0);
	const totalRef = useRef(0);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const clearTimer = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const start = useCallback(
		(total: number) => {
			clearTimer();

			if (total <= 0) {
				setCount(0);
				totalRef.current = 0;
				return;
			}

			totalRef.current = total;
			setCount(total);
			timerRef.current = setInterval(() => {
				setCount((prev) => {
					const next = Math.max(prev - 1, 0);
					if (next === 0) {
						clearTimer();
					}
					return next;
				});
			}, 1000);
		},
		[clearTimer],
	);

	useEffect(() => {
		return clearTimer;
	}, [clearTimer]);

	return {
		count,
		progress: totalRef.current === 0 ? 0 : (count / totalRef.current) * 100,
		start,
	};
}
