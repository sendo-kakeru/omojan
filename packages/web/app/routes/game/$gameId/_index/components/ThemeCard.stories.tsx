import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { ThemeCard } from "./ThemeCard";

const meta: Meta<typeof ThemeCard> = {
	component: ThemeCard,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/ThemeCard",
};

export default meta;
type Story = StoryObj<typeof ThemeCard>;

export const Default: Story = {
	args: {
		theme: "カレー",
	},
	name: "お題カード",
};

export const LongTheme: Story = {
	args: {
		theme: "母さんが夜なべをして",
	},
	name: "お題カード（長いテーマ）",
};
