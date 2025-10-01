import * as ToastPrimitive from "@radix-ui/react-toast";
import classNames from "classnames";
import { createContext, use, useCallback, useState } from "react";
import {
	FaCircleCheck,
	FaCircleExclamation,
	FaTriangleExclamation,
} from "react-icons/fa6";
import { IoClose } from "react-icons/io5";
import { Button } from "./button/Button";

type ToastItem = {
	id: string;
	type: "success" | "error" | "warning";
	title: React.ReactNode;
	duration?: number;
	isOpen: boolean;
};

export type OpenToastParams = Pick<ToastItem, "type" | "title" | "duration">;

const OpenToastContext = createContext<{
	showToast: (params: OpenToastParams) => void;
} | null>(null);

export function useToast() {
	const context = use(OpenToastContext);
	if (!context) {
		throw new Error("useToast must be used within a ToastProvider");
	}
	return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const closeToast = useCallback((id: string) => {
		setToasts((prev) =>
			prev.map((value) =>
				value.id === id ? { ...value, isOpen: false } : value,
			),
		);
		const timer = setTimeout(() => {
			setToasts((prev) => prev.filter((value) => value.id !== id));
		}, 200);
		return () => clearTimeout(timer);
	}, []);

	const showToast = useCallback((params: OpenToastParams) => {
		const id = crypto.randomUUID();
		setToasts((prev) => [...prev, { id, isOpen: true, ...params }]);
	}, []);

	return (
		<OpenToastContext value={{ showToast }}>
			<ToastPrimitive.Provider duration={3000}>
				{children}
				{toasts.map((value) => (
					<ToastItem key={value.id} {...value} onClose={closeToast} />
				))}
				<ToastPrimitive.Viewport
					className={classNames(
						"z-900 flex flex-col items-center",
						"list-none outline-none",
						"space-y-2 p-24",
						"fixed inset-x-0 top-0 mx-auto size-fit",
					)}
				/>
			</ToastPrimitive.Provider>
		</OpenToastContext>
	);
}

type Props = ToastItem & { onClose: (id: string) => void };

export function ToastItem({
	id,
	type,
	title,
	isOpen,
	duration,
	onClose,
}: Props) {
	const iconProps = {
		error: {
			borderColor: classNames("border-red-500"),
			icon: (
				<FaCircleExclamation
					className={classNames("size-24 shrink-0 text-red-500")}
				/>
			),
		},
		success: {
			borderColor: classNames("border-green-500"),
			icon: <FaCircleCheck className="size-24 shrink-0 text-green-500" />,
		},
		warning: {
			borderColor: classNames("border-yellow-500"),
			icon: (
				<FaTriangleExclamation
					className={classNames("size-24 shrink-0 text-yellow-500")}
				/>
			),
		},
	}[type];

	return (
		<ToastPrimitive.Root
			className={classNames(
				"flex items-center gap-8 rounded-lg border-2 bg-white px-16 py-8",
				"data-[swipe=cancel]:translate-x-0 data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-toast-hide data-[state=open]:animate-toast-slide-in data-[swipe=end]:animate-toast-swipe-out data-[swipe=cancel]:transition-[transform_200ms_ease-out]",
				iconProps.borderColor,
			)}
			duration={duration}
			onOpenChange={(open) => {
				if (!open) {
					onClose(id);
				}
			}}
			open={isOpen}
		>
			{iconProps.icon}
			<ToastPrimitive.Title className="font-bold text-sm">
				{title}
			</ToastPrimitive.Title>
			<ToastPrimitive.Close asChild>
				<Button
					as="button"
					className="ml-auto shrink-0"
					color="gray"
					isIconOnly
					onClick={() => onClose(id)}
					size="S"
					type="button"
					variant="outline"
				>
					<IoClose className="pointer-events-none size-16 shrink-0" />
					<span className="sr-only">閉じる</span>
				</Button>
			</ToastPrimitive.Close>
		</ToastPrimitive.Root>
	);
}
