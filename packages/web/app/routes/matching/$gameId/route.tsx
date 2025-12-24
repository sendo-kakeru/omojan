import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { DetailedError } from "hono/client";
import { useRef } from "react";
import { FaRegCopy } from "react-icons/fa";
import { FaCheck, FaRegClock } from "react-icons/fa6";
import { IoIosLock } from "react-icons/io";
import { useNavigate } from "react-router";
import { Button } from "~/components/button/Button";
import { Separator } from "~/components/Separator";
import { Spinner } from "~/components/Spinner";
import { useToast } from "~/components/Toast";
import { UserLabel } from "~/components/user/UserLabel";
import { useClipboard } from "~/hooks/useClipboard";
import { useIsLoading } from "~/hooks/useIsLoading";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import type { Route } from "./+types/route";
import { useMatchingSubscriptionSWR } from "./hooks/useMatchingSubscriptionSWR";
import { useRoomSWR } from "./hooks/useRoomSWR";

export default function ({ params: { gameId } }: Route.ComponentProps) {
	const navigate = useNavigate();
	const exitTimeoutRef = useRef<number | null>(null);
	const { showToast } = useToast();
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
	const {
		isLoading: isStarting,
		startLoading: startStarting,
		stopLoading: stopStarting,
	} = useIsLoading();
	const {
		data: participants,
		error: matchingError,
		wsRef,
		sendExit,
		sendStart,
		matchingCompletedTimeoutRef,
	} = useMatchingSubscriptionSWR({
		gameId,
		gameToken,
		onClose: (event: CloseEvent) => {
			if (exitTimeoutRef.current) {
				clearTimeout(exitTimeoutRef.current);
				exitTimeoutRef.current = null;
			}

			stopExiting();

			if (event.code === 4204 || event.code === 4410) {
				// NOTE: 退出時、部屋削除時はページ遷移
				void navigate("/");
			}
		},
		onCompleted() {
			void navigate(`/game/${gameId}`);
		},
	});

	const handleStart = () => {
		startStarting();
		try {
			sendStart();
		} catch (error) {
			console.error("WebSocketが接続されていません。", error);
			showToast({
				title: "接続が切断されています。ページを再読み込みしてください。",
				type: "error",
			});
			void navigate("/");
		} finally {
			stopStarting();
		}
	};

	const handleExit = () => {
		startExiting();

		// 5秒後にタイムアウト処理
		exitTimeoutRef.current = window.setTimeout(() => {
			stopExiting();
			showToast({
				title: "退出処理がタイムアウトしました。再度お試しください。",
				type: "error",
			});
			exitTimeoutRef.current = null;
		}, 5000);
		try {
			sendExit();
		} catch (error) {
			console.error("WebSocketが接続されていません。", error);
			if (exitTimeoutRef.current) {
				clearTimeout(exitTimeoutRef.current);
				exitTimeoutRef.current = null;
			}
			stopExiting();
			void navigate("/");
			return;
		}
	};

	if (roomMetaResult.error || matchingError) {
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
			<main className="grid place-items-center gap-y-12">
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
			</main>
		);
	}

	if (
		roomMetaResult.isLoading ||
		!roomMetaResult.data ||
		wsRef.current?.readyState !== WebSocket.OPEN ||
		!participants
	) {
		return (
			<main className="grid place-items-center gap-y-4 py-24 text-gray-500">
				<Spinner className="size-32" />
				<p className="text-center">接続しています...</p>
			</main>
		);
	}

	if (isExiting) {
		return (
			<main className="grid place-items-center gap-y-4 py-24 text-gray-500">
				<Spinner className="size-32" />
				<p className="text-center">退出しています...</p>
			</main>
		);
	}

	return (
		<main className="relative my-24 grid gap-y-16 rounded-lg border border-gray-200 bg-white p-16">
			{!!matchingCompletedTimeoutRef.current && (
				<div className="absolute inset-0 z-10 grid place-items-center bg-gray-200/70 backdrop-blur-sm">
					<div className="grid gap-y-6 text-center text-gray-700">
						<Spinner className="mx-auto size-32" />
						<p className="font-semibold">
							参加者が集まりました。5秒後にゲーム画面へ移動します。
						</p>
					</div>
				</div>
			)}
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
				<Button
					as="button"
					disabled={
						isStarting ||
						participants.length >= 4 ||
						!!matchingCompletedTimeoutRef.current
					}
					leftIcon={isStarting ? <Spinner className="size-16" /> : undefined}
					onClick={handleStart}
				>
					今すぐ開始
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
					{participants.map((participant) => (
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
		</main>
	);
}
