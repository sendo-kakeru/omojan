import type { Meta, StoryObj } from "@storybook/react-vite";
import { UserLabel } from "./UserLabel";

const meta = {
	component: UserLabel,
	tags: ["autodocs"],
	title: "User/UserLabel",
} satisfies Meta<typeof UserLabel>;

export default meta;
type Story = StoryObj<typeof UserLabel>;

export const Default: Story = {
	args: {} as never,
	render: () => (
		<div className="grid max-w-400 grid-cols-1 gap-y-16">
			<UserLabel
				user={{
					image: "/favicon.ico",
					name: "John Doe",
				}}
			/>
			<UserLabel
				user={{
					image: null,
					name: "long_name_long_name_long_name_long_name_long_name_long_name",
				}}
			/>
		</div>
	),
};
