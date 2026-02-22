import { type Me, meProfileSchema } from "@repo/db/model";
import { useForm } from "@tanstack/react-form";
import { useId } from "react";
import { FaUser } from "react-icons/fa";
import { FiChevronLeft } from "react-icons/fi";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/Button";
import { Footer } from "~/components/Footer";
import { FieldItem } from "~/components/form/FieldItem";
import { Input } from "~/components/form/Input";
import { Header } from "~/components/Header";
import { Spinner } from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import { useMe } from "~/context/me/hooks";
import { useIsLoading } from "~/hooks/useIsLoading";
import { honoClient } from "~/libs/apiClient.client";
import { buildImageUrl, PROFILE_IMAGE_DIMENSIONS } from "~/libs/image";
import type { Route } from "./+types/route";

export default function UserEditPage({
	params: { userId },
}: Route.ComponentProps) {
	const { me, isLoading } = useMe();

	if (isLoading) {
		return (
			<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
				<Header />
				<main className="grid place-items-center py-80">
					<Spinner className="size-24" />
				</main>
				<Footer />
			</div>
		);
	}

	if (!me || me.userId !== userId) {
		return (
			<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
				<Header />
				<main className="grid place-items-center py-80">
					<p className="text-neutral-500">
						このページにアクセスする権限がありません
					</p>
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="grid min-h-full grid-rows-[auto_1fr_auto]">
			<Header />
			<main className="grid content-start gap-y-24 pb-40">
				<EditForm me={me} />
			</main>
			<Footer />
		</div>
	);
}

function EditForm({ me }: { me: Me }) {
	const { mutate } = useMe();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { isLoading, startLoading, stopLoading } = useIsLoading();
	const formId = useId();

	const form = useForm({
		defaultValues: {
			image: me.image,
			name: me.name,
		},
		onSubmit: async ({ value }) => {
			startLoading();
			try {
				const response = await honoClient.v1.me.$patch({
					json: value,
				});
				const { data, message } = await response.json();

				if (!data) {
					throw new Error(message);
				}

				await mutate({ data, message }, false);
				showToast({ title: "プロフィールを更新しました", type: "success" });
				void navigate(`/users/${me.userId}`, {
					replace: true,
				});
			} catch (error) {
				console.error("プロフィールの更新に失敗しました:", error);
				showToast({
					title: "プロフィールの更新に失敗しました",
					type: "error",
				});
			} finally {
				stopLoading();
			}
		},
		validators: {
			onSubmit: meProfileSchema,
		},
	});

	return (
		<div className="grid place-items-center">
			<div className="flex w-full items-center gap-x-8">
				<button
					aria-label="戻る"
					onClick={() => void navigate(-1)}
					type="button"
				>
					<FiChevronLeft className="size-20" />
				</button>
				<h1 className="font-bold text-lg">プロフィール編集</h1>
			</div>

			<div className="grid place-items-center py-24">
				{me.image ? (
					<img
						alt={me.name}
						className="size-96 rounded-full object-cover"
						src={buildImageUrl({
							image: me.image,
							size: PROFILE_IMAGE_DIMENSIONS,
						})}
					/>
				) : (
					<FaUser className="size-96 rounded-full bg-gray-300 p-16 text-gray-500" />
				)}
				<p className="mt-8 text-neutral-400 text-xs">
					画像の変更は現在準備中です
				</p>
			</div>

			<form
				className="grid w-full max-w-400 gap-y-24"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<form.Field name="name">
					{(field) => {
						const id = `${formId}_name`;
						return (
							<FieldItem
								className="md:grid-cols-[auto_1fr]"
								errorMessage={
									!field.state.meta.isValid &&
									field.state.meta.errors[0]?.message
								}
								htmlFor={id}
								label="名前"
							>
								<Input
									disabled={isLoading}
									id={id}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									type="text"
									value={field.state.value}
								/>
							</FieldItem>
						);
					}}
				</form.Field>
				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{(state) => (
						<Button
							as="button"
							className="mx-auto w-240"
							disabled={!state.canSubmit || isLoading}
							leftIcon={isLoading ? <Spinner className="size-16" /> : undefined}
							type="submit"
						>
							{isLoading ? "更新中…" : "更新"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</div>
	);
}
