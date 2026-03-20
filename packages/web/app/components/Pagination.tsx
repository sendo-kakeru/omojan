import type { Pagination as PaginationMeta } from "@repo/db/model";
import classNames from "classnames";
import type * as React from "react";
import { LuChevronLeft, LuChevronRight, LuEllipsis } from "react-icons/lu";
import { type AnchorButtonProps, Button } from "./button/Button";

function PaginationRoot({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			className={classNames("mx-auto flex w-full justify-center", className)}
			data-slot="pagination"
			{...props}
		/>
	);
}

function PaginationContent({
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			className={classNames("flex items-center gap-x-4 md:gap-x-6", className)}
			data-slot="pagination-content"
			{...props}
		/>
	);
}

function PaginationItem({ ...props }: React.ComponentProps<"li">) {
	return <li data-slot="pagination-item" {...props} />;
}

function PaginationLink({
	className,
	isActive,
	size = "M",
	isCircle = false,
	...props
}: {
	isActive?: boolean;
	isCircle?: boolean;
} & Pick<
	AnchorButtonProps,
	"size" | "color" | "to" | "leftIcon" | "rightIcon" | "children" | "className"
>) {
	return (
		<Button
			aria-current={isActive ? "page" : undefined}
			as="link"
			className={classNames(className)}
			data-active={isActive}
			data-slot="pagination-link"
			isIconOnly={isCircle}
			size={size}
			variant={isActive ? "outline" : "fill"}
			{...props}
		/>
	);
}

function PaginationPrevious({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to previous page"
			className={className}
			isCircle
			size="M"
			{...props}
		>
			<LuChevronLeft className="size-24 shrink-0" />
		</PaginationLink>
	);
}

function PaginationNext({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to next page"
			className={className}
			isCircle
			size="M"
			{...props}
		>
			<LuChevronRight className="size-24 shrink-0" />
		</PaginationLink>
	);
}

function PaginationEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden
			className={classNames(
				"flex size-32 items-center justify-center [&_svg:not([class*='size-'])]:size-16",
				className,
			)}
			data-slot="pagination-ellipsis"
			{...props}
		>
			<LuEllipsis />
			<span className="sr-only">More pages</span>
		</span>
	);
}

type PageItem =
	| { page: number; type: "page" }
	| { position: "start" | "end"; type: "ellipsis" };

/**
 * ページ番号リストを生成するヘルパー関数
 * 現在ページを中心にスライディングウィンドウで表示
 */
function generatePageNumbers(
	currentPage: number,
	totalPages: number,
): PageItem[] {
	const items: PageItem[] = [];

	if (totalPages <= 7) {
		// 7ページ以下なら全て表示
		for (let i = 1; i <= totalPages; i++) {
			items.push({ page: i, type: "page" });
		}
		return items;
	}

	// 現在ページを中心に前後1ページを表示するウィンドウ
	// 例: currentPage=6 → [5, 6, 7]
	const windowStart = Math.max(2, currentPage - 1);
	const windowEnd = Math.min(totalPages - 1, currentPage + 1);

	// 最初のページを追加
	items.push({ page: 1, type: "page" });

	// 左側のellipsis（ウィンドウが3以上から始まる場合）
	if (windowStart > 2) {
		items.push({ position: "start", type: "ellipsis" });
	}

	// ウィンドウ内のページを追加
	for (let i = windowStart; i <= windowEnd; i++) {
		items.push({ page: i, type: "page" });
	}

	// 右側のellipsis（ウィンドウがtotalPages-2以下で終わる場合）
	if (windowEnd < totalPages - 1) {
		items.push({ position: "end", type: "ellipsis" });
	}

	// 最後のページを追加
	items.push({ page: totalPages, type: "page" });

	return items;
}

/**
 * ページネーションコンポーネント
 *
 * @example
 * // metaはPagination型（@repo/db/model）
 * <Pagination
 *   {...meta}
 *   getPageUrl={(page) => `?page=${page}`}
 * />
 */
function Pagination({
	page,
	totalPages,
	getPageUrl,
	color = "primary",
	className,
}: Pick<PaginationMeta, "page" | "totalPages"> & {
	/** ページ番号からURLを生成する関数 */
	getPageUrl: (page: number) => string;
	/** ボタンのカラー */
	color?: "primary" | "danger" | "black" | "gray";
	/** 追加のclassName */
	className?: string;
}) {
	if (totalPages <= 1) {
		return null;
	}

	const pageNumbers = generatePageNumbers(page, totalPages);
	const hasPrevious = page > 1;
	const hasNext = page < totalPages;

	return (
		<PaginationRoot className={className}>
			<PaginationContent>
				{hasPrevious && (
					<PaginationItem>
						<PaginationPrevious color={color} to={getPageUrl(page - 1)} />
					</PaginationItem>
				)}

				{pageNumbers.map((item) =>
					item.type === "ellipsis" ? (
						<PaginationItem key={`ellipsis-${item.position}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={item.page}>
							<PaginationLink
								color={color}
								isActive={item.page === page}
								isCircle
								to={getPageUrl(item.page)}
							>
								{item.page}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				{hasNext && (
					<PaginationItem>
						<PaginationNext color={color} to={getPageUrl(page + 1)} />
					</PaginationItem>
				)}
			</PaginationContent>
		</PaginationRoot>
	);
}

export {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationRoot,
};
