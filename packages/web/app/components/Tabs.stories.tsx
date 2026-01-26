import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./Tabs";

const meta: Meta<typeof Tabs> = {
	component: Tabs,
	decorators: [
		(Story) => (
			<div className="bg-black-50 p-32">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Components/Tabs",
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	render: () => (
		<Tabs defaultValue="tab1">
			<TabsList>
				<TabsTrigger value="tab1">タブ1</TabsTrigger>
				<TabsTrigger value="tab2">タブ2</TabsTrigger>
				<TabsTrigger value="tab3">タブ3</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<p className="p-16">タブ1のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab2">
				<p className="p-16">タブ2のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab3">
				<p className="p-16">タブ3のコンテンツ</p>
			</TabsContent>
		</Tabs>
	),
};

export const LineVariant: Story = {
	render: () => (
		<Tabs defaultValue="tab1">
			<TabsList variant="line">
				<TabsTrigger value="tab1">募集中</TabsTrigger>
				<TabsTrigger value="tab2">終了済み</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<p className="p-16">募集中の部屋一覧</p>
			</TabsContent>
			<TabsContent value="tab2">
				<p className="p-16">終了済みの部屋一覧</p>
			</TabsContent>
		</Tabs>
	),
};

export const Vertical: Story = {
	render: () => (
		<Tabs defaultValue="tab1" orientation="vertical">
			<TabsList>
				<TabsTrigger value="tab1">タブ1</TabsTrigger>
				<TabsTrigger value="tab2">タブ2</TabsTrigger>
				<TabsTrigger value="tab3">タブ3</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<p className="p-16">タブ1のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab2">
				<p className="p-16">タブ2のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab3">
				<p className="p-16">タブ3のコンテンツ</p>
			</TabsContent>
		</Tabs>
	),
};

export const VerticalLineVariant: Story = {
	render: () => (
		<Tabs defaultValue="tab1" orientation="vertical">
			<TabsList variant="line">
				<TabsTrigger value="tab1">タブ1</TabsTrigger>
				<TabsTrigger value="tab2">タブ2</TabsTrigger>
				<TabsTrigger value="tab3">タブ3</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<p className="p-16">タブ1のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab2">
				<p className="p-16">タブ2のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab3">
				<p className="p-16">タブ3のコンテンツ</p>
			</TabsContent>
		</Tabs>
	),
};

export const Disabled: Story = {
	render: () => (
		<Tabs defaultValue="tab1">
			<TabsList>
				<TabsTrigger value="tab1">有効</TabsTrigger>
				<TabsTrigger disabled value="tab2">
					無効
				</TabsTrigger>
				<TabsTrigger value="tab3">有効</TabsTrigger>
			</TabsList>
			<TabsContent value="tab1">
				<p className="p-16">タブ1のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab2">
				<p className="p-16">タブ2のコンテンツ</p>
			</TabsContent>
			<TabsContent value="tab3">
				<p className="p-16">タブ3のコンテンツ</p>
			</TabsContent>
		</Tabs>
	),
};
