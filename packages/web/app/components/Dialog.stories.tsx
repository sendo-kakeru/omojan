import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./button/Button";
import { Dialog } from "./Dialog";

const meta = {
	component: Dialog,
	tags: ["autodocs"],
	title: "Components/Dialog",
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
	args: {},
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<div className="grid grid-cols-1 gap-y-24">
				<Dialog
					description="This is a description of the dialog."
					footer={
						<Button
							as="button"
							onClick={() => setOpen(false)}
							type="button"
							variant="outline"
						>
							Close
						</Button>
					}
					onOpenChange={setOpen}
					open={open}
					title="Dialog Title"
					trigger={
						<Button as="button" type="button">
							Open Dialog
						</Button>
					}
				>
					<p>This is the content of the dialog.</p>
				</Dialog>
			</div>
		);
	},
};

export const Long: Story = {
	args: {
		children: (
			<div className="grid grid-cols-1 gap-y-32">
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
				<div className="h-100 w-100 bg-amber-300" />
			</div>
		),
		description: "This dialog has a lot of content to demonstrate scrolling.",
		open: true,
		title: "Long Dialog",
	},
};

export const Control: Story = {
	args: {},
	render: () => {
		const [open, setOpen] = useState(false);
		return (
			<>
				<Button as="button" onClick={() => setOpen(true)} type="button">
					Open Dialog
				</Button>
				<div className="grid grid-cols-1 gap-y-24">
					<Dialog
						description="This is a description of the dialog."
						onOpenChange={setOpen}
						open={open}
						title="Dialog Title"
					>
						<p>This is the content of the dialog.</p>
					</Dialog>
				</div>
			</>
		);
	},
};
