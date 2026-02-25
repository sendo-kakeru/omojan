import classNames from "classnames";
import { Tooltip as TooltipPrimitive } from "radix-ui";

function TooltipProvider({
	delayDuration = 0,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delayDuration={delayDuration}
			{...props}
		/>
	);
}
function Tooltip({
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}
function TooltipTrigger({
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
	return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}
function TooltipContent({
	className,
	sideOffset = 0,
	children,
	...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Content
				className={classNames(
					"z-50 w-fit max-w-xs rounded-md bg-neutral-800 px-12 py-6 text-white text-xs",
					"origin-(--radix-tooltip-content-transform-origin)",
					"data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:animate-in",
					"data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:animate-out",
					"data-[side=bottom]:slide-in-from-top-8 data-[side=left]:slide-in-from-right-8 data-[side=right]:slide-in-from-left-8 data-[side=top]:slide-in-from-bottom-8",
					className,
				)}
				data-slot="tooltip-content"
				sideOffset={sideOffset}
				{...props}
			>
				{children}
				<TooltipPrimitive.Arrow className="z-50 size-10 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs bg-neutral-800 fill-neutral-800" />
			</TooltipPrimitive.Content>
		</TooltipPrimitive.Portal>
	);
}
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
