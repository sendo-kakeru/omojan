import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import classNames from "classnames";
import type { PropsWithChildren } from "react";
export function DropdownMenu({
	trigger,
	children,
}: PropsWithChildren<{
	trigger: React.ReactNode;
}>) {
	return (
		<DropdownMenuPrimitive.Root>
			<DropdownMenuPrimitive.Trigger asChild className="pointer-events-auto">
				{trigger}
			</DropdownMenuPrimitive.Trigger>
			<DropdownMenuPrimitive.Portal>
				<DropdownMenuPrimitive.Content
					className={classNames(
						"z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-160 origin-(--radix-dropdown-menu-content-transform-origin) overflow-y-auto overflow-x-hidden rounded-md border border-cream-200 bg-cream-50 p-4 shadow-tile-drop",
						"data-[side=bottom]:slide-in-from-top-8 data-[side=left]:slide-in-from-right-8 data-[side=right]:slide-in-from-left-8 data-[side=top]:slide-in-from-bottom-8 data-[state=closed]:animate-out data-[state=open]:animate-in",
						"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
					)}
					sideOffset={8}
				>
					{children}
				</DropdownMenuPrimitive.Content>
			</DropdownMenuPrimitive.Portal>
		</DropdownMenuPrimitive.Root>
	);
}

export function DropdownMenuItem({
	className,
	inset,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
	inset?: boolean;
}) {
	return (
		<DropdownMenuPrimitive.Item
			className={classNames(
				"relative flex cursor-default select-none items-center gap-8 rounded-sm px-8 py-6 text-sm outline-hidden focus:bg-cream-100/60",
				"data-disabled:pointer-events-none data-inset:pl-32 data-disabled:opacity-50",
				"[&_svg:not([class*='size-'])]:size-16 [&_svg]:pointer-events-none [&_svg]:shrink-0",
				className,
			)}
			data-inset={inset}
			data-slot="dropdown-menu-item"
			{...props}
		/>
	);
}

// export function DropdownMenuLabel({
//   className,
//   inset,
//   ...props
// }: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
//   inset?: boolean;
// }) {
//   return (
//     <DropdownMenuPrimitive.Label
//       className={classNames(
//         "px-8 py-6 font-medium text-sm data-[inset]:pl-32",
//         className,
//       )}
//       data-inset={inset}
//       data-slot="dropdown-menu-label"
//       {...props}
//     />
//   );
// }

export function DropdownMenuSeparator({
	className,
	...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
	return (
		<DropdownMenuPrimitive.Separator
			className={classNames("-mx-4 my-4 h-px bg-cream-200", className)}
			data-slot="dropdown-menu-separator"
			{...props}
		/>
	);
}
