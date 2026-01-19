import { LOCALSTORAGE_OPERATION_FAILED_MESSAGE } from "@repo/shared/error";
import { DetailedError } from "hono/client";
import { useRef } from "react";
import { useNavigate } from "react-router";
import { useToast } from "~/components/Toast";
import { useIsLoading } from "~/hooks/useIsLoading";
import { gameTokenLocalStorage } from "~/libs/gameTokenLocalStorage";
import type { Route } from "./+types/route";
import { MatchingError } from "./components/MatchingError";
import { MatchingLoading } from "./components/MatchingLoading";
import { MatchingPresenter } from "./components/MatchingPresenter";
import { useMatchingSubscriptionSWR } from "./hooks/useMatchingSubscriptionSWR";
import { useRoomSWR } from "./hooks/useRoomSWR";

export default function ({ params: { gameId } }: Route.ComponentProps) {
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

			stopExiting();

			if (event.code === 4204 || event.code === 4410) {
				// NOTE: 退出時、部屋削除時はページ遷移
				void navigate("/", { replace: true });
			}
		},
	});

	const handleStart = () => {
		if (!isHost) return;

		startStarting();
		try {
			sendStart();
		} catch (error) {
			console.error("WebSocketが接続されていません。", error);
			showToast({
				title: "接続が切断されています。ページを再読み込みしてください。",
				type: "error",
			});
			void navigate("/", { replace: true });
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
			void navigate("/", { replace: true });
			return;
		}
	};

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
