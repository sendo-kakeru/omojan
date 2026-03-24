export function ThemeCard({ theme }: { theme: string }) {
	return (
		<div className="relative grid min-h-56 xs:min-h-64 w-full place-items-center rounded-md border-2 border-yellow-400 border-dashed bg-yellow-50 p-8 px-12 shadow">
			<span className="absolute -top-10 left-1/2 -translate-x-1/2 rounded-full bg-yellow-400 px-10 py-2 font-bold text-xs text-yellow-900">
				お題
			</span>
			<p className="font-bold text-sm sm:text-base">{theme}</p>
		</div>
	);
}
