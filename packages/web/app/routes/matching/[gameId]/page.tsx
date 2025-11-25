import {
	type HeartbeatPongMessage,
	type MatchingParticipant,
	matchingServerMessageSchema,
} from "@repo/db/model";
import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { DetailedError } from "hono/client";
import { useEffect, useRef, useState } from "react";
import { FaRegCopy } from "react-icons/fa";
import { FaCheck, FaRegClock } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { useNavigate } from "react-router";
import { parse } from "valibot";
import { Button } from "~/components/button/Button";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import { UserLabel } from "~/components/user/UserLabel";
import { useClipboard } from "~/hooks/useClipboard";
import { useIsLoading } from "~/hooks/useIsLoading";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import { useRoomSWR } from "./_hooks/useRoomSWR";
import type { Route } from "./+types/page";

type ParticipantsState =
	| {
			status: "loading";
	  }
	| {
			status: "connected";
			participants: MatchingParticipant[];
	  }
	| {
			status: "error";
			error: unknown;
	  };

export default function ({ params: { gameId } }: Route.ComponentProps) {
	const navigate = useNavigate();
	const wsRef = useRef<WebSocket | null>(null);
	const exitTimeoutRef = useRef<number | null>(null);
	const { showToast } = useToast();
	const [participantsState, setParticipantsState] = useState<ParticipantsState>(
		{ status: "loading" },
	);
	const gameToken = gameTokenLocalStorage.get({
		onError() {
			alert(LOCALSTORAGE_OPERATION_FAILED_MESSAGE);
			void navigate("/");
		},
	});
	const roomMetaResult = useRoomSWR({
		header: { "x-game-token": gameToken ?? "" },
		param: { gameId },
	});
	const { isCopied, copy } = useClipboard(roomMetaResult.data?.password ?? "");
	const {
		isLoading: isExiting,
		startLoading: startExiting,
		stopLoading: stopExiting,
	} = useIsLoading();

	useEffect(() => {
		try {
			const url = new URL(
				`/v1/matchings/${gameId}`,
				import.meta.env.VITE_API_URL,
			);
			// なくても問題なく動いているのでコメントアウト
			// url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
			if (gameToken) {
				url.searchParams.set("token", gameToken);
			}
			if (participantsState.status === "loading") {
				wsRef.current = new WebSocket(url.toString());
			}
		} catch (error) {
			console.error("WebSocketの初期化に失敗しました:", error);
			setParticipantsState({ error, status: "error" });
			return;
		}

		const handleMessage = (event: MessageEvent) => {
			try {
				const payload = JSON.parse(event.data);
				const result = parse(matchingServerMessageSchema, payload);

				switch (result.type) {
					case "PARTICIPANTS":
						setParticipantsState({
							participants: result.participants,
							status: "connected",
						});
						break;
					case "PING":
						// PINGを受け取ったらPONGで応答
						wsRef.current?.send(
							JSON.stringify({ type: "PONG" } satisfies HeartbeatPongMessage),
						);
						break;
				}
			} catch (error) {
				console.error("メッセージの形式が正しくありません:", error, event);
				setParticipantsState({ error, status: "error" });
			}
		};

		const handleError = (event: Event) => {
			console.error("接続に失敗しました。", event);
			setParticipantsState({
				error: new Error("接続に失敗しました。"),
				status: "error",
			});
			wsRef.current?.close(4500, "接続を終了します。");
		};

		const handleClose = (event: CloseEvent) => {
			if (exitTimeoutRef.current) clearTimeout(exitTimeoutRef.current);
			stopExiting();
			// 正常な退出の場合はトップページへ
			if (event.code !== 1000) {
				console.error("接続が閉じられました。", event);
				setParticipantsState({
					error: "エラーが発生しました。時間をおいて再度接続してください。",
					status: "error",
				});
				return;
			}

			void navigate("/");
		};

		wsRef.current?.addEventListener("message", handleMessage);
		wsRef.current?.addEventListener("error", handleError);
		wsRef.current?.addEventListener("close", handleClose);

		return () => {
			wsRef.current?.removeEventListener("message", handleMessage);
			wsRef.current?.removeEventListener("error", handleError);
			wsRef.current?.removeEventListener("close", handleClose);
			wsRef.current?.close(1000, "接続を終了します。");
			wsRef.current = null;
		};
	}, [gameId, navigate, gameToken, stopExiting, participantsState.status]);

	const handleExit = () => {
		if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
			console.error("WebSocketが接続されていません。");
			void navigate("/");
			return;
		}

		startExiting();
		try {
			wsRef.current.send(JSON.stringify({ type: "EXIT" }));

			// 5秒後にタイムアウト処理
			exitTimeoutRef.current = window.setTimeout(() => {
				stopExiting();
				showToast({
					title: "退出処理がタイムアウトしました。再度お試しください。",
					type: "error",
				});
				exitTimeoutRef.current = null;
			}, 5000);
		} catch (error) {
			console.error("退出メッセージの送信に失敗しました:", error);
			void navigate("/");
			stopExiting();
		}
	};

	if (roomMetaResult.error || participantsState.status === "error") {
		wsRef.current?.close(4500, "接続を終了します。");

		const isNotFound =
			roomMetaResult.error instanceof DetailedError &&
			roomMetaResult.error.statusCode === 404;
		const isForbidden =
			roomMetaResult.error instanceof DetailedError &&
			roomMetaResult.error.statusCode === 403;
		const isUnauthorized =
			roomMetaResult.error instanceof DetailedError &&
			roomMetaResult.error.statusCode === 401;

		return (
			<div className="grid place-items-center gap-y-12">
				<h2 className="font-bold text-xl">
					{isNotFound
						? "この部屋は削除されています。"
						: isForbidden || isUnauthorized
							? "入室権限がありません。"
							: "部屋の接続に失敗しました。"}
				</h2>
				<Button as="link" className="w-fit" to="/">
					トップに戻る
				</Button>
			</div>
		);
	}

	if (
		roomMetaResult.isLoading ||
		participantsState.status === "loading" ||
		!roomMetaResult.data
	) {
		return (
			<div className="grid place-items-center gap-y-4 py-16 text-gray-500">
				<Spinner className="size-32" />
				<p className="text-center">接続しています...</p>
			</div>
		);
	}

	if (isExiting) {
		return (
			<div className="grid place-items-center gap-y-4 py-16 text-gray-500">
				<Spinner className="size-32" />
				<p className="text-center">退出しています...</p>
			</div>
		);
	}

	return (
		<div className="grid gap-y-16 rounded-lg border border-gray-200 bg-white p-16">
			{/* メタセクション */}
			<section className="grid gap-y-16 py-16">
				<div className="grid gap-y-8">
					<div className="flex justify-between">
						<h1 className="font-bold text-xl">{roomMetaResult.data.title}</h1>
						{roomMetaResult.data.isPrivate && (
							<div className="rounded-full border border-gray-300 bg-gray-100 p-4">
								<IoIosLock
									aria-label="プライベート部屋"
									className="size-24 text-green-400"
									role="img"
								/>
							</div>
						)}
					</div>
					<div className="flex items-center gap-x-8 text-gray-500">
						<FaRegClock className="size-20" />
						<p className="text-md">
							制限時間: {roomMetaResult.data.timeLimit}秒
						</p>
					</div>
				</div>
				{roomMetaResult.data.isPrivate && (
					<div className="mx-auto grid w-full max-w-400 gap-y-12 rounded-lg border border-green-300 bg-green-50 p-8 md:p-16">
						<div className="flex items-center justify-between gap-x-8 px-8">
							<div className="flex items-center gap-x-16">
								<p className="break-keep font-semibold text-sm md:text-md">
									パスワード
								</p>
								<p className="w-fit rounded-lg border border-green-300 bg-white p-8 px-24 font-mono text-xl">
									{roomMetaResult.data.password}
								</p>
							</div>
							<Button
								as="button"
								color="gray"
								isIconOnly
								onClick={copy}
								variant="outline"
							>
								{isCopied ? (
									<FaCheck className="text-green-400" />
								) : (
									<FaRegCopy />
								)}
							</Button>
						</div>
						<p className="w-fit text-gray-500 text-sm">
							参加者にパスワードを共有してください。
						</p>
					</div>
				)}
				<Button
					as="button"
					className="mx-auto w-full md:w-240"
					color="danger"
					onClick={handleExit}
				>
					退出する
				</Button>
			</section>

			<Separator />

			<section className="grid gap-y-16">
				<div className="grid items-center gap-y-4 md:grid-cols-[auto_1fr] md:gap-x-16">
					<h2 className="font-bold">参加者</h2>
					<p className="text-gray-500 text-sm">
						4人揃ったらゲームが開始されます。
					</p>
				</div>
				<ul className="grid gap-y-12">
					{participantsState.participants.map((participant) => (
						<li key={participant.id}>
							<UserLabel
								className="text-base"
								user={{
									image: participant.image ?? undefined,
									name: participant.playerName,
								}}
							/>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
