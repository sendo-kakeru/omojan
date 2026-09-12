import classNames from "classnames";

/**
 * カード全体をタップ領域にするクラス
 *
 * ::before をカード全面に敷き、タイトルのボタン/リンクだけを手前に出す。
 * フォーカスリングも ::before 側に出す。
 */
export const ROOM_CARD_ACTION_CLASS_NAME = classNames(
	"pointer-events-auto text-left outline-none before:absolute before:inset-0 before:rounded-lg before:content-['']",
	"focus-visible:before:ring-2 focus-visible:before:ring-orange-600 focus-visible:before:ring-inset",
);
