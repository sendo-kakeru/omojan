/**
 * X（旧Twitter）ウィジェットを読み込み・管理するためのユーティリティ
 *
 * ## 概要
 * X公式の widgets.js を動的に読み込み、フォローボタンなどの
 * ウィジェットを生成するためのAPIを提供する。
 *
 * ## 使い方
 * ```tsx
 * const twttr = await ensureXWidgets();
 * twttr.widgets.createFollowButton("omojan_online", containerElement);
 * ```
 *
 * ## なぜこのファイルが必要か
 * - widgets.js は非同期で読み込まれるため、読み込み完了を待つ仕組みが必要
 * - 複数箇所から呼ばれても1回だけスクリプトを読み込むようにする
 * - TypeScriptで型安全に使えるようにする
 */

/**
 * X（旧Twitter）フォローボタンのオプション
 *
 * 公式の options は今後増える可能性があるため、必要分だけ型を用意。
 * 追加したいものが出たらここに足していく。
 *
 * @see https://developer.x.com/en/docs/x-for-websites/follow-button/overview
 */
export type XFollowButtonOptions = {
	/**
	 * ボタンのサイズ
	 * @default "normal"
	 */
	size?: "normal" | "large";

	/**
	 * Do Not Track を有効にするか
	 * true にするとユーザーのトラッキングを無効化
	 */
	dnt?: boolean;

	/**
	 * ボタンの表示言語（BCP 47言語コード）
	 * @example "ja", "en"
	 */
	lang?: string;

	/**
	 * フォロワー数を表示するか
	 * @default false
	 */
	showCount?: boolean;

	/**
	 * スクリーンネーム（@username）を表示するか
	 * @default true
	 */
	showScreenName?: boolean;
};

/**
 * widgets.js が完全に読み込まれた後の twttr オブジェクトの型
 *
 * window.twttr として公開され、ウィジェット生成APIを提供する
 */
export type Twttr = {
	/** コールバックを登録し、準備完了時に呼び出す */
	ready: (cb: () => void) => void;

	/** ウィジェット生成用のAPI群 */
	widgets: {
		/**
		 * フォローボタンを生成する
		 * @param username - フォロー対象のユーザー名（@なし）
		 * @param targetEl - ボタンを挿入するDOM要素
		 * @param options - ボタンのオプション
		 * @returns 生成されたボタンのHTML要素
		 */
		createFollowButton: (
			username: string,
			targetEl: HTMLElement,
			options?: XFollowButtonOptions,
		) => Promise<HTMLElement>;
	};
};

/**
 * widgets.js 読み込み中の仮オブジェクト（スタブ）の型
 *
 * スクリプト読み込み完了前に ready() が呼ばれた場合、
 * コールバックを _e 配列にキューイングしておく。
 * 読み込み完了後、widgets.js がキュー内のコールバックを実行する。
 */
type TwttrStub = {
	/** キューイングされたコールバック配列 */
	_e: Array<() => void>;
	/** コールバックをキューに追加する関数 */
	ready: (cb: () => void) => void;
};

/**
 * window オブジェクトに twttr プロパティを追加する型定義
 *
 * - 読み込み前/読み込み中: TwttrStub（スタブ）
 * - 読み込み完了後: Twttr（完全なAPI）
 */
declare global {
	interface Window {
		twttr?: Twttr | TwttrStub;
	}
}

/**
 * 値がオブジェクトかどうかを判定するタイプガード
 */
function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

/**
 * window.twttr が完全に初期化された Twttr オブジェクトかを判定するタイプガード
 *
 * widgets.js 読み込み完了前は TwttrStub なので、
 * widgets.createFollowButton が存在するかで判定する
 */
function isTwttr(value: unknown): value is Twttr {
	if (!isObject(value)) return false;

	const ready = value.ready;
	const widgets = value.widgets;

	if (typeof ready !== "function") return false;
	if (!isObject(widgets)) return false;

	const createFollowButton = widgets.createFollowButton;
	return typeof createFollowButton === "function";
}

/**
 * ensureXWidgets() の結果をキャッシュするための変数
 *
 * 複数回呼び出されても同じ Promise を返すことで、
 * スクリプトの重複読み込みを防ぐ
 */
let twttrPromise: Promise<Twttr> | null = null;

/**
 * X widgets.js を読み込み、完全に初期化された twttr オブジェクトを返す
 *
 * ## 動作の流れ
 * 1. 既に初期化済みならそのまま返す
 * 2. 読み込み中なら同じ Promise を返す（重複読み込み防止）
 * 3. 初回呼び出し時:
 *    - スタブ（仮オブジェクト）を window.twttr に設定
 *    - widgets.js の script タグを挿入
 *    - 50ms ごとにポーリングして初期化完了を待つ
 *    - 15秒でタイムアウト
 *
 * ## なぜポーリングが必要か
 * widgets.js は読み込み後に window.twttr を上書きするが、
 * そのタイミングを正確に知る方法がない。
 * そのため定期的にチェックして初期化完了を検知する。
 *
 * @returns 初期化完了した twttr オブジェクト
 * @throws サーバーサイドで呼び出した場合、タイムアウト、読み込み失敗時
 */
export async function ensureXWidgets(): Promise<Twttr> {
	// サーバーサイドレンダリング時はエラー（window が存在しない）
	if (typeof window === "undefined") {
		throw new Error("Xウィジェットはブラウザでのみ読み込めます");
	}

	// 既に初期化済みならそのまま返す
	if (isTwttr(window.twttr)) return window.twttr;

	// 読み込み中の Promise があればそれを返す（重複読み込み防止）
	if (twttrPromise !== null) return twttrPromise;

	twttrPromise = new Promise<Twttr>((resolve, reject) => {
		const doc = document;
		const id = "twitter-wjs"; // script タグの識別用ID

		// ========================================
		// Step 1: スタブ（仮オブジェクト）の設定
		// ========================================
		// widgets.js 読み込み完了前に twttr.ready() が呼ばれた場合に備え、
		// コールバックをキューイングするスタブを用意する

		if (!window.twttr || !("ready" in window.twttr)) {
			// window.twttr が未定義または不完全な場合、スタブを作成
			const stub: TwttrStub = {
				_e: [],
				ready: (cb) => {
					stub._e.push(cb);
				},
			};
			window.twttr = stub;
		} else if (!("_e" in window.twttr)) {
			// window.twttr は存在するがキューがない（レアケース）
			// 既存の ready 関数を保持しつつスタブを作成
			const current = window.twttr;
			const stub: TwttrStub = {
				_e: [],
				ready: (cb) => {
					stub._e.push(cb);
				},
			};
			if (typeof current.ready === "function") stub.ready = current.ready;
			window.twttr = stub;
		}

		// ========================================
		// Step 2: script タグの挿入
		// ========================================
		// 同じIDのscriptが既にある場合はスキップ（重複防止）

		if (!doc.getElementById(id)) {
			const script = doc.createElement("script");
			script.id = id;
			script.src = "https://platform.twitter.com/widgets.js";
			script.async = true;
			script.onerror = () =>
				reject(new Error("Xウィジェットの読み込みに失敗しました"));

			// 既存の script タグの前に挿入（推奨パターン）
			// なければ head に追加
			const firstScript = doc.getElementsByTagName("script")[0];
			if (firstScript?.parentNode) {
				firstScript.parentNode.insertBefore(script, firstScript);
			} else {
				doc.head.appendChild(script);
			}
		}

		// ========================================
		// Step 3: 初期化完了をポーリングで待つ
		// ========================================
		// widgets.js が window.twttr を完全な Twttr オブジェクトに
		// 上書きするまで 50ms 間隔でチェック

		const start = Date.now();
		const timeoutMs = 15_000; // 15秒でタイムアウト

		const tick = () => {
			// 初期化完了したら resolve
			if (isTwttr(window.twttr)) {
				resolve(window.twttr);
				return;
			}

			// タイムアウト
			if (Date.now() - start > timeoutMs) {
				reject(new Error("Xウィジェットの読み込みがタイムアウトしました"));
				return;
			}

			// 50ms 後に再チェック
			window.setTimeout(tick, 50);
		};

		tick();
	});

	return twttrPromise;
}
