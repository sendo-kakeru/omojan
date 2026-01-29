import type { ComponentProps } from "react";

export function RoomCardSkeleton({
	srText,
	...props
}: ComponentProps<"div"> & {
	srText?: string;
}) {
	return (
		<div
			className="grid animate-pulse rounded-lg bg-neutral-100 p-12 shadow-sm"
			{...props}
		>
			{srText && <span className="sr-only">{srText}</span>}
			<div className="grid gap-y-4">
				<div className="flex min-h-34 items-center gap-x-6">
					<div className="h-24 w-160 animate-pulse rounded-full bg-neutral-200" />
				</div>
				<div className="flex gap-x-24">
					<div className="h-20 w-123 animate-pulse rounded-full bg-neutral-200" />
					<div className="h-20 w-101 animate-pulse rounded-full bg-neutral-200" />
				</div>
			</div>
			<div className="mt-12 flex flex-wrap gap-x-8">
				<div className="flex items-center gap-x-4 py-4 pr-12 pl-8">
					<div className="flex items-center gap-x-8">
						<div className="size-24 rounded-full bg-neutral-200" />
						<div className="h-16 w-80 rounded-full bg-neutral-200" />
					</div>
				</div>
			</div>
			<div className="flex justify-end">
				<div className="mt-6 h-16 w-56 rounded-full bg-neutral-200" />
			</div>
		</div>
	);
}
