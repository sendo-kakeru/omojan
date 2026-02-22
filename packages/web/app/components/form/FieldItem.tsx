import classNames from "classnames";
import type { PropsWithChildren } from "react";
import { FaCircleExclamation } from "react-icons/fa6";
import { Label } from "./Label";
import { RequiredBadge } from "./RequiredBadge";
export function FieldItem({
	htmlFor = "",
	label,
	required = false,
	showRequiredLabel = true,
	children,
	errorMessage,
	note,
	supportText,
	className,
}: PropsWithChildren<{
	/** ラベル用htmlFor */
	htmlFor?: string;

	/** ラベル */
	label: React.ReactNode;

	/** 必須項目かどうか */
	required?: boolean;

	/** 必須ラベルを非表示にするかどうか */
	showRequiredLabel?: boolean;

	/** エラー */
	errorMessage?: React.ReactNode;

	/** 注釈 */
	note?: string;

	/** サポートテキスト */
	supportText?: React.ReactNode;
	className?: string;
}>) {
	return (
		<div
			className={classNames(
				"grid grid-cols-1 items-center gap-x-8 gap-y-4",
				className,
			)}
		>
			<div className="grid gap-y-8">
				<div className="inline-flex cursor-pointer items-center gap-x-4">
					<Label className="font-bold text-sm md:text-base" htmlFor={htmlFor}>
						{label}
					</Label>
					{required && showRequiredLabel && <RequiredBadge />}
				</div>
				{supportText && (
					<p className="whitespace-pre-line text-xs">{supportText}</p>
				)}
			</div>
			<div className="grid grid-cols-1 gap-y-4 p-4">
				{children}
				{note && (
					<p className="whitespace-pre-line text-neutral-500 text-xs">{note}</p>
				)}
				{errorMessage && (
					<p className="flex items-center gap-x-8">
						<FaCircleExclamation aria-hidden className="text-red-700" />
						<span className="text-red-600 text-sm">{errorMessage}</span>
					</p>
				)}
			</div>
		</div>
	);
}
