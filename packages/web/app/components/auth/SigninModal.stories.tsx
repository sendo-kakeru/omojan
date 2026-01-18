import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "../button/Button";
import { SigninModal } from "./SigninModal";

const meta = {
	component: SigninModal,
	tags: ["autodocs"],
	title: "Components/Auth/SigninModal",
} satisfies Meta<typeof SigninModal>;

export default meta;
type Story = StoryObj<typeof SigninModal>;

export const Default: Story = {
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return (
			<>
				<Button as="button" onClick={() => setIsOpen(true)} type="button">
					モーダルを開く
				</Button>
				<SigninModal isOpen={isOpen} setIsOpen={setIsOpen} />
			</>
		);
	},
};

export const InAppBrowser: Story = {
	render: () => {
		const [isOpen, setIsOpen] = useState(true);
		return (
			<>
				<Button as="button" onClick={() => setIsOpen(true)} type="button">
					モーダルを開く
				</Button>
				<SigninModal isAppBrowser isOpen={isOpen} setIsOpen={setIsOpen} />
			</>
		);
	},
};
