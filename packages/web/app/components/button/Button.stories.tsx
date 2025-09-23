import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { IoMdMail } from "react-icons/io";
import { LuMail } from "react-icons/lu";
import { MdKeyboardArrowRight } from "react-icons/md";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
	component: Button,
	decorators: [
		(Story) => (
			<div className="bg-black-50 p-32">
				<Story />
			</div>
		),
	],
	tags: ["autodocs"],
	title: "Components/Buttons/Button",
};

export default meta;
type Story = StoryObj<typeof meta>;

type Args = {
	"aria-pressed"?: boolean;
};

const COLORS = [
	"primary",
	"danger",
	"black",
	"gray",
] as const satisfies ComponentProps<typeof Button>["color"][];
const SIZES = ["S", "M", "L"] as const satisfies ComponentProps<
	typeof Button
>["size"][];
const VARIANTS = ["fill", "outline"] as const satisfies ComponentProps<
	typeof Button
>["variant"][];

function ButtonTemplate({ args }: { args?: { disabled?: boolean } & Args }) {
	return (
		<div className="flex flex-col gap-16">
			<p className="font-bold text-black-0">Default Button</p>
			{SIZES.map((size) => (
				<div className="flex flex-col gap-16" key={size}>
					<p>size: {size}</p>
					{COLORS.map((color) => (
						<div className="flex flex-wrap gap-16" key={color}>
							<Button {...args} as="button" color={color} size={size}>
								ダミーテキスト
							</Button>
							<Button
								{...args}
								as="button"
								color={color}
								rightIcon={<MdKeyboardArrowRight />}
								size={size}
							>
								ダミーテキスト
							</Button>
							<Button
								{...args}
								as="button"
								color={color}
								leftIcon={<IoMdMail />}
								size={size}
							>
								ダミーテキスト
							</Button>
							<Button
								{...args}
								as="button"
								color={color}
								isIconOnly
								size={size}
							>
								<LuMail />
							</Button>
						</div>
					))}
				</div>
			))}
			{VARIANTS.map((variant) => (
				<div className="flex flex-col gap-16" key={variant}>
					<p>variant: {variant}</p>
					{COLORS.map((color) => (
						<div className="flex gap-16" key={`${color}-${variant}`}>
							<Button {...args} as="button" color={color} variant={variant}>
								ダミーテキスト
							</Button>
							<Button
								{...args}
								as="button"
								color={color}
								rightIcon={<MdKeyboardArrowRight />}
								variant={variant}
							>
								ダミーテキスト
							</Button>
							<Button
								{...args}
								as="button"
								color={color}
								leftIcon={<IoMdMail />}
								variant={variant}
							>
								ダミーテキスト
							</Button>
							<Button
								{...args}
								as="button"
								color={color}
								isIconOnly
								variant={variant}
							>
								<LuMail />
							</Button>
						</div>
					))}
				</div>
			))}
		</div>
	);
}

function LinkTemplate({ args }: { args?: Args }) {
	return (
		<div className="flex flex-col gap-16">
			<p className="font-bold text-black-0">Link Button</p>
			{SIZES.map((size) => (
				<div className="flex flex-col gap-16" key={size}>
					<p>size: {size}</p>
					{COLORS.map((color) => (
						<div className="flex gap-16" key={color}>
							<Button
								{...args}
								as="link"
								color={color}
								size={size}
								target="_blank"
								to="https://google.com"
							>
								ダミーテキスト
							</Button>
							{size === "M" && (
								<Button
									{...args}
									as="link"
									color={color}
									rightIcon={<MdKeyboardArrowRight />}
									size={size}
									target="_blank"
									to="https://google.com"
								>
									ダミーテキスト
								</Button>
							)}
						</div>
					))}
				</div>
			))}
		</div>
	);
}

export const BaseButton: Story = {
	args: {} as never,
	render: () => (
		<div className="flex flex-col gap-32">
			<ButtonTemplate />
			<LinkTemplate />
		</div>
	),
};

export const Hover: Story = {
	args: {} as never,
	parameters: {
		pseudo: {
			hover: true,
		},
	},
	render: () => (
		<div className="flex flex-col gap-32">
			<ButtonTemplate />
			<LinkTemplate />
		</div>
	),
};

export const Disabled: Story = {
	args: {} as never,
	render: () => <ButtonTemplate args={{ disabled: true }} />,
};
