import classNames from "classnames";
import { Tabs as TabsPrimitive } from "radix-ui";
import type * as React from "react";
import { tv, type VariantProps } from "tailwind-variants";

function Tabs({
	className,
	orientation = "horizontal",
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
	return (
		<TabsPrimitive.Root
			className={classNames(
				"group/tabs flex gap-8 data-[orientation=horizontal]:flex-col",
				className,
			)}
			data-orientation={orientation}
			data-slot="tabs"
			{...props}
		/>
	);
}

const tabsListVariants = tv({
	base: classNames(
		"group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-3 text-neutral-500",
		"data-[variant=line]:rounded-none group-data-[orientation=horizontal]/tabs:h-32 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col",
	),
	defaultVariants: {
		variant: "default",
	},
	variants: {
		variant: {
			default: "bg-gray-200",
			line: "gap-4 bg-transparent",
		},
	},
});

function TabsList({
	className,
	variant = "default",
	...props
}: React.ComponentProps<typeof TabsPrimitive.List> &
	VariantProps<typeof tabsListVariants>) {
	return (
		<TabsPrimitive.List
			className={classNames(tabsListVariants({ variant }), className)}
			data-slot="tabs-list"
			data-variant={variant}
			{...props}
		/>
	);
}

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	return (
		<TabsPrimitive.Trigger
			className={classNames(
				"relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-6 whitespace-nowrap rounded-md border border-transparent px-6 py-2 font-medium text-neutral-500 text-sm transition-all hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-lime-800 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
				"group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none",
				"[&_svg:not([class*='size-'])]:size-16 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				"group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent",
				"data-[state=active]:bg-white data-[state=active]:text-neutral-700",
				"after:absolute after:bg-green-400 after:opacity-0 after:transition-opacity",
				"group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-4 group-data-[orientation=horizontal]/tabs:after:-bottom-5 group-data-[orientation=horizontal]/tabs:after:h-2 group-data-[orientation=vertical]/tabs:after:w-2 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100",
				className,
			)}
			data-slot="tabs-trigger"
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			className={classNames("flex-1 text-sm outline-none", className)}
			data-slot="tabs-content"
			{...props}
		/>
	);
}

export { Tabs, TabsContent, TabsList, TabsTrigger, tabsListVariants };
