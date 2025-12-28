import classNames from "classnames";
import { FaUser } from "react-icons/fa";
import { tv } from "tailwind-variants";

const avatarVariants = tv(
	{
		base: "aspect-square shrink-0 overflow-hidden rounded-full object-contain object-center",
		variants: {
			size: {
				L: "size-40",
				M: "size-32",
				S: "size-24",
				"S-M": "size-24 md:size-32",
			},
		},
	},
	{ twMerge: false },
);

const fallbackVariants = tv(
	{
		base: "bg-gray-300",
		variants: {
			size: {
				L: "pt-8",
				M: "pt-6",
				S: "pt-4",
				"S-M": "pt-4 md:pt-6",
			},
		},
	},
	{ twMerge: false },
);

export function Avatar({
	className,
	size = "M",
	src,
	name,
	...props
}: Omit<React.ComponentProps<"img">, "alt"> & {
	size?: "S" | "S-M" | "M" | "L";
	name?: string;
}) {
	const avatarClassName = avatarVariants({
		className,
		size,
	});

	if (src) {
		return (
			<img alt={name ?? ""} className={avatarClassName} src={src} {...props} />
		);
	}

	return (
		<>
			{name && <div className="sr-only">{name}</div>}
			<FaUser
				className={classNames(
					avatarClassName,
					fallbackVariants({
						size,
					}),
				)}
			/>
		</>
	);
}
