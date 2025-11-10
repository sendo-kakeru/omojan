"use client";
import { createRoomRequestBodySchema } from "@repo/shared/model/room";
import { useForm } from "@tanstack/react-form";
import { type Dispatch, type SetStateAction, useId } from "react";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/Button";
import { Dialog } from "~/components/Dialog";
import { Checkbox } from "~/components/form/Checkbox";
import { FieldItem } from "~/components/form/FieldItem";
import { Input } from "~/components/form/Input";
import { Select } from "~/components/form/Select";
import { Spinner } from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import { useMe } from "~/context/me/hooks";
import { useIsLoading } from "~/hooks/useIsLoading";
import { honoClient } from "~/libs/apiClient.client";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";

export function CreateRoomDialog({
	isOpen,
	setIsOpen,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
}) {
	const { me } = useMe();
	const formId = useId();
	const navigate = useNavigate();
	const { showToast } = useToast();
	const { isLoading, startLoading, stopLoading } = useIsLoading();

	const form = useForm({
		defaultValues: {
			isPrivate: false,
			playerName: me?.name ?? "匿名プレイヤー",
			timeLimit: 30,
			title: "誰でも歓迎",
		},
		onSubmit: async ({ value }) => {
			// NOTE: 必要ならSWRフック化し、mutateで送信。作成後は自動でページ遷移するため今の所不要
			startLoading();
			try {
				const response = await honoClient.v1.rooms.$post({
					json: value,
				});
				const { data, message } = await response.json();

				if (!data) {
					throw new Error(message);
				}

				gameTokenLocalStorage.set(data.token);
				void navigate(`/matching/${data.gameId}`);

				setIsOpen(false);
			} catch (error) {
				console.error("部屋の作成に失敗しました:", error);
				showToast({
					title: "部屋の作成に失敗しました。",
					type: "error",
				});
			} finally {
				stopLoading();
			}
		},
		validators: {
			onSubmit: createRoomRequestBodySchema,
		},
	});
	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen} title="部屋を作成">
			<form
				className="grid gap-y-24"
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<div className="grid gap-y-12">
					<form.Field name="title">
						{(field) => {
							const id = `${formId}_title`;
							return (
								<FieldItem
									errorMessage={
										!field.state.meta.isValid &&
										field.state.meta.errors[0]?.message
									}
									htmlFor={id}
									label="部屋名"
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
					{!me && (
						<form.Field name="playerName">
							{(field) => {
								const id = `${formId}_playerName`;
								return (
									<FieldItem
										errorMessage={
											!field.state.meta.isValid &&
											field.state.meta.errors[0]?.message
										}
										htmlFor={id}
										label="プレイヤー名"
										note="ログインすると入力が不要になります。"
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
					)}
					<form.Field name="timeLimit">
						{(field) => {
							const id = `${formId}_timeLimit`;
							return (
								<FieldItem
									errorMessage={
										!field.state.meta.isValid &&
										field.state.meta.errors[0]?.message
									}
									htmlFor={id}
									label="制限時間"
								>
									<Select
										disabled={isLoading}
										id={id}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(Number(e.target.value))}
										value={field.state.value}
										withPlaceholder={false}
									>
										{[
											{ label: "15秒", value: 15 },
											{ label: "30秒", value: 30 },
											{ label: "60秒", value: 60 },
											{ label: "90秒", value: 90 },
											{ label: "120秒", value: 120 },
											{ label: "150秒", value: 150 },
											{ label: "180秒", value: 180 },
											{ label: "210秒", value: 210 },
											{ label: "240秒", value: 240 },
											{ label: "270秒", value: 270 },
											{ label: "300秒", value: 300 },
											{ label: "330秒", value: 330 },
											{ label: "360秒", value: 360 },
										].map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</Select>
								</FieldItem>
							);
						}}
					</form.Field>
					<form.Field name="isPrivate">
						{(field) => {
							const id = `${formId}_isPrivate`;
							return (
								<FieldItem
									errorMessage={
										!field.state.meta.isValid &&
										field.state.meta.errors[0]?.message
									}
									htmlFor={id}
									label="鍵をかける"
									note={
										"パスワードによる制限を追加します。\n身内のみ参加を許可する場合にご利用ください。"
									}
								>
									<Checkbox
										checked={field.state.value}
										onChange={(e) => field.handleChange(e.target.checked)}
									/>
								</FieldItem>
							);
						}}
					</form.Field>
				</div>
				<div className="grid grid-cols-2 gap-x-12">
					<Button as="button" color="gray" onClick={() => setIsOpen(false)}>
						キャンセル
					</Button>
					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{(state) => (
							<Button
								as="button"
								disabled={!state.canSubmit || isLoading}
								leftIcon={
									isLoading ? <Spinner className="size-16" /> : undefined
								}
								type="submit"
							>
								{isLoading ? "作成しています" : "作成する"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</form>
		</Dialog>
	);
}
