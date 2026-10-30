"use client";

import { uuid58Encode } from "@nakanoaas/uuid58";
import type { JoinRoomRequestBody, Room } from "@repo/db/models";
import { joinRoomRequestBodySchema, roomPasswordSchema } from "@repo/db/models";
import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { useForm } from "@tanstack/react-form";
import {
	type Dispatch,
	type SetStateAction,
	useId,
	useState,
	useTransition,
} from "react";
import { FaRegClock } from "react-icons/fa6";
import { FiUsers } from "react-icons/fi";
import { useNavigate } from "react-router";
import { safeParse } from "valibot";
import { Button } from "~/components/button/Button";
import { Dialog } from "~/components/Dialog";
import { FieldItem } from "~/components/form/FieldItem";
import { Input } from "~/components/form/Input";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from "~/components/form/InputOTP";
import { Spinner } from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import { UserLabel } from "~/components/user/UserLabel";
import { useMe } from "~/contexts/me/hooks";
import { honoClient } from "~/libs/apiClient.client";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import { LoginPrompt } from "~/routes/_index/components/LoginPrompt";
export function JoinRoomDialog({
	isOpen,
	setIsOpen,
	room,
}: {
	isOpen: boolean;
	setIsOpen: Dispatch<SetStateAction<boolean>>;
	room: Omit<Room, "password">;
}) {
	const { me } = useMe();
	const navigate = useNavigate();
	const formId = useId();
	const { showToast } = useToast();
	const [isPending, startTransition] = useTransition();
	const [passwordError, setPasswordError] = useState<string | undefined>();

	const defaultValues: JoinRoomRequestBody = (() => {
		const gameToken = gameTokenLocalStorage.get({
			onError() {
				showToast({
					title: LOCALSTORAGE_OPERATION_FAILED_MESSAGE,
					type: "error",
				});
			},
		});

		return {
			heldToken: gameToken,
			password: undefined,
			playerName: me?.name ?? "匿名プレイヤー",
		};
	})();

	const form = useForm({
		defaultValues,
		onSubmit: ({ value }) => {
			// 鍵部屋はパスワード検証
			if (room.isPrivate) {
				const result = safeParse(roomPasswordSchema, value.password);
				if (!result.success) {
					setPasswordError(result.issues[0].message);
					return;
				}
			}

			startTransition(async () => {
				try {
					const response = await honoClient.v1.rooms[":gameId"].join.$post({
						json: value,
						param: { gameId: room.gameId },
					});
					const { data, message } = await response.json();

					// 400番台ならレスポンスメッセージを表示
					if (!data) {
						if (response.status >= 400 && response.status < 500) {
							showToast({
								title: message,
								type: "error",
							});
							return;
						}
						throw new Error(message);
					}

					// 保持しているトークンのプレイヤーが存在する場合（過去に参加済み）そのままマッチング画面へ（基本発生し得ない）
					if (data.state === "HELD_TOKEN_PLAYER_JOINED") {
						setIsOpen(false);
						void navigate(`/matching/${uuid58Encode(room.gameId)}`);
						return;
					}

					try {
						gameTokenLocalStorage.set(data.token);
					} catch {
						showToast({
							title: LOCALSTORAGE_OPERATION_FAILED_MESSAGE,
							type: "error",
						});
					}

					setPasswordError(undefined);
					setIsOpen(false);
					void navigate(`/matching/${uuid58Encode(room.gameId)}`);
				} catch (error) {
					console.error("部屋への参加に失敗しました:", error);
					showToast({
						title: "部屋への参加に失敗しました。",
						type: "error",
					});
				}
			});
		},
		validators: {
			onSubmit: joinRoomRequestBodySchema,
		},
	});

	return (
		<Dialog
			onOpenAutoFocus={(e) => e.preventDefault()}
			onOpenChange={setIsOpen}
			open={isOpen}
			title={room.title}
		>
			<div className="grid gap-y-16">
				<div className="grid gap-y-4 rounded-lg border border-cream-200 bg-cream-100/50 p-12">
					<div className="grid gap-y-4">
						<div className="flex items-center gap-x-4 text-neutral-500">
							<FaRegClock />
							<p className="text-sm">制限時間: {room.timeLimit}秒</p>
						</div>
						<div className="flex items-center gap-x-4 text-neutral-500">
							<FiUsers />
							<p className="text-sm">参加者: {room.players.length}/4</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-x-16 gap-y-8">
						{room.players.map((player) => (
							<UserLabel
								avatarProps={{ size: "S" }}
								key={player.id}
								textProps={{ className: "text-xs" }}
								user={{
									image: player.image,
									name: player.playerName,
								}}
							/>
						))}
					</div>
				</div>
				{!me && <LoginPrompt guestLabel="またはゲストで参加" />}
				<form
					className="grid gap-y-16"
					onSubmit={(event) => {
						event.preventDefault();
						event.stopPropagation();
						void form.handleSubmit();
					}}
				>
					<div className="grid gap-y-12">
						{!me && (
							<form.Field name="playerName">
								{(field) => {
									const id = `${formId}_playerName`;
									return (
										<FieldItem
											className="md:grid-cols-[160px_minmax(0,1fr)]"
											errorMessage={
												(!field.state.meta.isValid &&
													field.state.meta.errors[0]?.message) ||
												undefined
											}
											htmlFor={id}
											label="プレイヤー名"
										>
											<Input
												disabled={isPending}
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
						{room.isPrivate && (
							<form.Field name="password">
								{(field) => {
									const id = `${formId}_password`;
									return (
										<FieldItem
											className="md:grid-cols-[160px_minmax(0,1fr)]"
											errorMessage={
												passwordError ??
												(!field.state.meta.isValid &&
													field.state.meta.errors[0]?.message)
											}
											htmlFor={id}
											label="パスワード"
											note="共有された6文字のパスワードを入力してください。"
										>
											<InputOTP
												autoComplete="off"
												disabled={isPending}
												id={id}
												inputMode="text"
												maxLength={6}
												onBlur={field.handleBlur}
												onChange={(value) => {
													if (passwordError) {
														setPasswordError(undefined);
													}
													field.handleChange(value.trim());
												}}
												type="password"
												value={field.state.value}
											>
												<InputOTPGroup>
													<InputOTPSlot index={0} />
													<InputOTPSlot index={1} />
													<InputOTPSlot index={2} />
													<InputOTPSlot index={3} />
													<InputOTPSlot index={4} />
													<InputOTPSlot index={5} />
												</InputOTPGroup>
											</InputOTP>
										</FieldItem>
									);
								}}
							</form.Field>
						)}
					</div>
					<div className="grid grid-cols-2 gap-x-12 pb-12">
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
									color="primary"
									disabled={!state.canSubmit || isPending}
									leftIcon={
										isPending ? <Spinner className="size-16" /> : undefined
									}
									type="submit"
								>
									{isPending ? "参加しています" : "参加する"}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</form>
			</div>
		</Dialog>
	);
}
