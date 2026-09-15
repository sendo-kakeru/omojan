import * as DialogPrimitive from "@radix-ui/react-dialog";
import classNames from "classnames";
import { IoClose } from "react-icons/io5";

export function Dialog({
	trigger,
	title,
	description,
	footer,
	onOpenAutoFocus,
	children,
	...props
}: Pick<
	React.ComponentProps<typeof DialogPrimitive.Root>,
	"open" | "onOpenChange" | "children"
> &
	Pick<
		React.ComponentProps<typeof DialogPrimitive.Content>,
		"onOpenAutoFocus"
	> & {
		trigger?: React.ReactNode;
		title?: React.ReactNode;
		description?: React.ReactNode;
		footer?: React.ReactNode;
	}) {
	return (
		<DialogRoot {...props}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
			<DialogContent onOpenAutoFocus={onOpenAutoFocus}>
				{(title || description) && (
					<DialogHeader>
						{title && <DialogTitle>{title}</DialogTitle>}
						{description && (
							<DialogDescription>{description}</DialogDescription>
						)}
					</DialogHeader>
				)}
				<div className="flex flex-1 flex-col gap-y-16 overflow-y-auto">
					{children}
				</div>
				{footer && <DialogFooter>{footer}</DialogFooter>}
			</DialogContent>
		</DialogRoot>
	);
}

function DialogRoot({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
	return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogOverlay({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
	return (
		<DialogPrimitive.Overlay
			className={classNames(
				"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-olive-900/60 data-[state=closed]:animate-out data-[state=open]:animate-in",
				className,
			)}
			data-slot="dialog-overlay"
			{...props}
		/>
	);
}

function DialogContent({
	className,
	children,
	showCloseButton = true,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
	showCloseButton?: boolean;
}) {
	return (
		<DialogPortal data-slot="dialog-portal">
			<DialogOverlay />
			<DialogPrimitive.Content
				className={classNames(
					"fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100%-2rem)] w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] flex-col gap-16 overflow-hidden rounded-lg border border-cream-200 bg-cream-50 p-24 shadow-tile duration-200 sm:max-w-lg",
					"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=open]:animate-in",
					className,
				)}
				data-slot="dialog-content"
				{...props}
			>
				{children}
				{showCloseButton && (
					<DialogClose
						className={classNames(
							"absolute top-16 right-16 rounded-xs opacity-60 transition-opacity",
							"hover:opacity-100 disabled:pointer-events-none",
							"data-[state=open]:bg-accent",
						)}
					>
						<IoClose
							aria-hidden
							className="pointer-events-none size-24 shrink-0"
						/>
						<span className="sr-only">Close</span>
					</DialogClose>
				)}
			</DialogPrimitive.Content>
		</DialogPortal>
	);
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={classNames(
				"flex flex-col gap-8 text-center sm:text-left",
				className,
			)}
			data-slot="dialog-header"
			{...props}
		/>
	);
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={classNames(
				"flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
				className,
			)}
			data-slot="dialog-footer"
			{...props}
		/>
	);
}
function DialogTitle({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
	return (
		<DialogPrimitive.Title
			className={classNames(
				"font-bold text-lg text-lime-800 leading-none",
				className,
			)}
			data-slot="dialog-title"
			{...props}
		/>
	);
}

function DialogDescription({
	className,
	...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
	return (
		<DialogPrimitive.Description
			className={classNames("text-neutral-400 text-sm", className)}
			data-slot="dialog-description"
			{...props}
		/>
	);
}

export function DialogClose({
	...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
	return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}
