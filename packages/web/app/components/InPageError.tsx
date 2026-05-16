import { IoHomeOutline } from "react-icons/io5";
import { Button } from "~/components/button/Button";

type Props = {
	description: string;
	heading: string;
	replaceNavigation?: boolean;
	showHomeButton?: boolean;
	showLogo?: boolean;
};

export function InPageError({
	description,
	heading,
	replaceNavigation = false,
	showHomeButton = true,
	showLogo = false,
}: Props) {
	return (
		<div className="flex min-h-svh items-center justify-center px-16">
			<div className="grid max-w-560 place-items-center gap-y-24 text-center">
				<div className="grid place-items-center gap-y-8">
					{showLogo && (
						<img
							alt="おもじゃんオンライン"
							className="rounded-md"
							height={72}
							src="/icons/omojan.webp"
							width={72}
						/>
					)}
					<h1 className="font-bold text-2xl text-neutral-800">{heading}</h1>
					<p className="text-neutral-500">{description}</p>
				</div>
				{showHomeButton && (
					<Button
						as="link"
						leftIcon={<IoHomeOutline />}
						replace={replaceNavigation}
						to="/"
					>
						ホームに戻る
					</Button>
				)}
			</div>
		</div>
	);
}
