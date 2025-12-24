import { Spinner } from "~/components/Spinner";

export function MatchingLoading({ message }: { message: string }) {
	return (
		<main className="grid place-items-center gap-y-4 py-24 text-gray-500">
			<Spinner className="size-32" />
			<p className="text-center">{message}</p>
		</main>
	);
}
