import classNames from "classnames";

/**
 * カード全体をタップ領域にするクラス
 *
 * ::before をカード全面に敷き、タイトルのボタン/リンクだけを手前に出す。
 * フォーカス表示も ::before 側に出す。
 */
export const ROOM_CARD_ACTION_CLASS_NAME = classNames(
	"pointer-events-auto text-left outline-none before:absolute before:inset-0 before:rounded-lg before:content-['']",
	"focus-visible:before:outline-2 focus-visible:before:outline-lime-800 focus-visible:before:-outline-offset-2",
);
