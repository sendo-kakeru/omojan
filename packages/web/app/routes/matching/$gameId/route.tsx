import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { DetailedError } from "hono/client";
import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useToast } from "~/components/Toast";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import { buildNoindexMeta } from "~/libs/meta";
import type { Route } from "./+types/route";
import { MatchingError } from "./components/MatchingError";
import { MatchingLoading } from "./components/MatchingLoading";
import { MatchingPresenter } from "./components/MatchingPresenter";
import { useMatchingSubscriptionSWR } from "./hooks/useMatchingSubscriptionSWR";
import { useRoomSWR } from "./hooks/useRoomSWR";

export const meta: Route.MetaFunction = ({ matches }) =>
	buildNoindexMeta(matches.flatMap((m) => m?.meta ?? []));

export default function Page({ params: { gameId } }: Route.ComponentProps) {
	const navigate = useNavigate();
	const exitTimeoutRef = useRef<number | null>(null);
	const { showToast } = useToast();
	const gameToken = gameTokenLocalStorage.get({
		onError() {
			alert(LOCALSTORAGE_OPERATION_FAILED_MESSAGE);
			void navigate("/", { replace: true });
		},
	});
	const roomMetaResult = useRoomSWR({
		header: { "x-game-token": gameToken ?? "" },
		param: { gameId },
	});
	const [isExiting, setIsExiting] = useState(false);
	const [isStarting, setIsStarting] = useState(false);

	const {
		data: participants,
		error: matchingError,
		wsRef,
		sendExit,
		sendStart,
		transitionCount,
		isHost,
	} = useMatchingSubscriptionSWR({
		gameId,
		gameToken,
		onClose: (event: CloseEvent) => {
			if (exitTimeoutRef.current) {
				clearTimeout(exitTimeoutRef.current);
				exitTimeoutRef.current = null;
			}

			setIsExiting(false);

			if (event.code === 1000) {
				// NOTE: ゲーム開始時（正常終了）はゲームページへ遷移
				void navigate(`/game/${gameId}`, { replace: true });
				return;
			}

			if (event.code === 4204 || event.code === 4410) {
				// NOTE: 退出時、部屋削除時はページ遷移
				void navigate("/", { replace: true });
			}
		},
	});

	const handleStart = () => {
		if (!isHost) return;

		setIsStarting(true);
		try {
			sendStart();
		} catch (error) {
			setIsStarting(false);
			console.error("WebSocketが接続されていません。", error);
			showToast({
				title: "接続が切断されています。ページを再読み込みしてください。",
				type: "error",
			});
			void navigate("/", { replace: true });
		}
	};

	const handleExit = () => {
		setIsExiting(true);

		// 5秒後にタイムアウト処理
		exitTimeoutRef.current = window.setTimeout(() => {
			setIsExiting(false);
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
			setIsExiting(false);
			void navigate("/", { replace: true });
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

		const errorType = isNotFound
			? "notFound"
			: isForbidden
				? "forbidden"
				: isUnauthorized
					? "unauthorized"
					: "connectionError";

		return <MatchingError errorType={errorType} />;
	}

	if (
		roomMetaResult.isLoading ||
		!roomMetaResult.data ||
		!WebSocket ||
		wsRef.current?.readyState !== WebSocket.OPEN ||
		!participants
	) {
		return <MatchingLoading message="接続しています..." />;
	}

	if (isExiting) {
		return <MatchingLoading message="退出しています..." />;
	}

	return (
		<MatchingPresenter
			isHost={isHost}
			isStarting={isStarting}
			onExit={handleExit}
			onStart={handleStart}
			participants={participants}
			roomMeta={roomMetaResult.data}
			transitionCount={transitionCount}
		/>
	);
}
