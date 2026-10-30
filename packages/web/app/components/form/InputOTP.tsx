"use client";

import classNames from "classnames";
import { OTPInput, OTPInputContext } from "input-otp";
import { useContext } from "react";
import { FaMinus } from "react-icons/fa6";

function InputOTP({
	className,
	containerClassName,
	...props
}: React.ComponentProps<typeof OTPInput> & {
	containerClassName?: string;
}) {
	return (
		<OTPInput
			className={classNames("disabled:cursor-not-allowed", className)}
			containerClassName={classNames(
				// NOTE: -m-3/p-3 は overflow-hidden の切り取り線を外側にずらすため。
				// マスの高さ＝コンテナの高さなので、入力中の outline が上下左右すべてで途切れる
				"-m-3 flex items-center gap-8 overflow-hidden p-3 has-disabled:opacity-50",
				containerClassName,
			)}
			data-slot="input-otp"
			{...props}
		/>
	);
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
	return (
		<div
			className={classNames("flex items-center", className)}
			data-slot="input-otp-group"
			{...props}
		/>
	);
}

function InputOTPSlot({
	index,
	className,
	...props
}: React.ComponentProps<"div"> & {
	index: number;
}) {
	const inputOTPContext = useContext(OTPInputContext);
	const slot = inputOTPContext?.slots?.[index];
	const { char, hasFakeCaret, isActive } = slot ?? {};

	return (
		<div
			className={classNames(
				"relative flex size-36 items-center justify-center border-y border-r border-cream-200 bg-cream-50 text-sm shadow-xs transition-all",
				"first:rounded-l-md first:border-l last:rounded-r-md aria-invalid:border-red-600",
				"data-[active=true]:z-10 data-[active=true]:border-lime-800 data-[active=true]:outline-3 data-[active=true]:outline-lime-800/50 data-[active=true]:aria-invalid:border-red-600 data-[active=true]:aria-invalid:outline-red-600/20",
				className,
			)}
			data-active={isActive}
			data-slot="input-otp-slot"
			{...props}
		>
			{char}
			{hasFakeCaret && (
				<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
					<div className="h-16 w-px animate-caret-blink bg-gray-900 duration-1000" />
				</div>
			)}
		</div>
	);
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
	return (
		<div data-slot="input-otp-separator" {...props}>
			<FaMinus />
		</div>
	);
}

export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot };
