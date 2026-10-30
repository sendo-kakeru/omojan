import { useNavigation } from "react-router";

export function GlobalNavigationProgress() {
	const navigation = useNavigation();
	const isNavigating = navigation.state !== "idle";

	if (!isNavigating) return null;

	return (
		<div
			aria-hidden="true"
			className="fixed inset-x-0 top-0 z-50 h-3 overflow-hidden bg-lime-200"
		>
			<div className="h-full w-1/3 animate-progress-slide bg-lime-600" />
		</div>
	);
}
