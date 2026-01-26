import type { Pagination as PaginationMeta } from "@repo/db/model";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
	PaginationRoot,
} from "./Pagination";

/** サンプルのページネーションメタ情報 */
const createMeta = (
	page: number,
	totalPages: number,
	limit = 20,
): PaginationMeta => ({
	limit,
	page,
	total: totalPages * limit,
	totalPages,
});

const meta: Meta<typeof Pagination> = {
	component: Pagination,
	decorators: [
		(Story) => (
			<div className="bg-black-50 p-32">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Components/Pagination",
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * コンポジットコンポーネント（推奨）
 * ページネーション情報を渡すだけで自動的にレンダリング
 */
export const Default: Story = {
	render: () => (
		<Pagination {...createMeta(2, 10)} getPageUrl={(page) => `?page=${page}`} />
	),
};

export const FirstPage: Story = {
	render: () => (
		<Pagination {...createMeta(1, 10)} getPageUrl={(page) => `?page=${page}`} />
	),
};

export const LastPage: Story = {
	render: () => (
		<Pagination
			{...createMeta(10, 10)}
			getPageUrl={(page) => `?page=${page}`}
		/>
	),
};

export const MiddlePage: Story = {
	render: () => (
		<Pagination {...createMeta(5, 10)} getPageUrl={(page) => `?page=${page}`} />
	),
};

export const FewPages: Story = {
	render: () => (
		<Pagination {...createMeta(2, 3)} getPageUrl={(page) => `?page=${page}`} />
	),
};

export const SinglePage: Story = {
	render: () => (
		<Pagination {...createMeta(1, 1)} getPageUrl={(page) => `?page=${page}`} />
	),
};

const COLORS = ["primary", "danger", "black", "gray"] as const;

export const Colors: Story = {
	render: () => (
		<div className="flex flex-col gap-16">
			{COLORS.map((color) => (
				<div className="flex flex-col gap-8" key={color}>
					<p className="text-neutral-500 text-sm">color: {color}</p>
					<Pagination
						{...createMeta(2, 10)}
						color={color}
						getPageUrl={(page) => `?page=${page}`}
					/>
				</div>
			))}
		</div>
	),
};

const PAGE_PATTERNS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const PagePatterns: Story = {
	render: () => (
		<div className="flex flex-col gap-16">
			{PAGE_PATTERNS.map((currentPage) => (
				<div className="flex flex-col gap-8" key={currentPage}>
					<p className="text-neutral-500 text-sm">page: {currentPage} / 10</p>
					<Pagination
						{...createMeta(currentPage, 10)}
						getPageUrl={(page) => `?page=${page}`}
					/>
				</div>
			))}
		</div>
	),
};

/**
 * プリミティブコンポーネント
 * カスタムレイアウトが必要な場合に使用
 */
export const Primitives: Story = {
	render: () => (
		<PaginationRoot>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious to="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink isCircle to="#">
						1
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink isActive isCircle to="#">
						2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink isCircle to="#">
						3
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink isCircle to="#">
						10
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationNext to="#" />
				</PaginationItem>
			</PaginationContent>
		</PaginationRoot>
	),
};
