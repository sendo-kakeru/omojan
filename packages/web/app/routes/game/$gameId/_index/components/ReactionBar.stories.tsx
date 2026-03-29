import type { Meta, StoryObj } from "@storybook/react-vite";
import {
	gameScreenDecorator,
	gameScreenParameters,
} from "~/storybook/decorators";
import { ReactionBar } from "./ReactionBar";

const meta: Meta<typeof ReactionBar> = {
	component: ReactionBar,
	decorators: [gameScreenDecorator],
	parameters: gameScreenParameters,
	tags: ["autodocs"],
	title: "Game/ReactionBar",
};

export default meta;
type Story = StoryObj<typeof ReactionBar>;

export const Visible: Story = {
	args: {
		sendReaction: async (emoji) => {
			console.log("sendReaction:", emoji);
		},
		visible: true,
	},
	name: "表示",
};

export const Hidden: Story = {
	args: {
		sendReaction: async (emoji) => {
			console.log("sendReaction:", emoji);
		},
		visible: false,
	},
	name: "非表示",
};
