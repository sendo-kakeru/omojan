import { useNavigation } from "react-router";

export function GlobalNavigationProgress() {
	const navigation = useNavigation();
	const isNavigating = navigation.state !== "idle";

	if (!isNavigating) return null;

	return (
		<div
			aria-hidden="true"
			className="fixed top-0 right-0 left-0 z-50 h-3 overflow-hidden bg-green-200"
		>
			<div className="h-full w-1/3 animate-progress-slide bg-green-600" />
		</div>
	);
}
