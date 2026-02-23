import { PROD_SITE_URL, SITE_NAME } from "@repo/shared/constants/config";
import type { PropsWithChildren } from "react";
import { Link } from "react-router";
import { Header } from "~/components/Header";
import type { Route } from "./+types/route";

const FEATURES = [
	{
		description:
			"アカウント登録なしですぐに遊べます。プレイヤー名を入力するだけでOK。",
		title: "ログイン不要で即プレイ",
	},
	{
		description:
			"鍵付き部屋を作れば、パスワードを共有した友達とだけ対戦できます。",
		title: "友達とプライベート対戦",
	},
	{
		description:
			"人数が足りなくても、CPUプレイヤーを入れてすぐにゲームを始められます。",
		title: "1人でもCPUと対戦",
	},
	{
		description: "1ゲーム約5〜10分。空き時間にサクッと楽しめます。",
		title: "短時間でサクッと遊べる",
	},
] as const;

const PAGE_TITLE = `遊び方 | ${SITE_NAME}`;
const PAGE_DESCRIPTION =
	"おもじゃんオンラインの遊び方・ルールを解説。テーマに言葉をくっつけて面白い造語を作る4人対戦ワードゲーム。部屋の作り方から投票・勝敗の決め方まで、初めてでもすぐ遊べます。";

export const meta: Route.MetaFunction = ({ matches }) => {
	const parentMeta = matches
		.flatMap((match) => match?.meta ?? [])
		.filter(
			(meta) =>
				!("title" in meta) &&
				!("name" in meta && meta.name === "description") &&
				!("name" in meta && meta.name === "keywords") &&
				!("property" in meta && meta.property === "og:title") &&
				!("property" in meta && meta.property === "og:description") &&
				!("property" in meta && meta.property === "og:url") &&
				!("name" in meta && meta.name === "twitter:title") &&
				!("name" in meta && meta.name === "twitter:description") &&
				!("rel" in meta && meta.rel === "canonical"),
		);

	return [
		...parentMeta,
		{ title: PAGE_TITLE },
		{ content: PAGE_DESCRIPTION, name: "description" },
		{
			content:
				"おもじゃん, 遊び方, ルール, OMOJAN, ワードゲーム, オンラインゲーム, おもじゃん荘, 言葉遊び",
			name: "keywords",
		},
		{
			href: `${PROD_SITE_URL}/guide`,
			rel: "canonical",
			tagName: "link",
		},
		{ content: PAGE_TITLE, property: "og:title" },
		{ content: PAGE_DESCRIPTION, property: "og:description" },
		{ content: `${PROD_SITE_URL}/guide`, property: "og:url" },
		{ content: PAGE_TITLE, name: "twitter:title" },
		{ content: PAGE_DESCRIPTION, name: "twitter:description" },
	];
};

export default function HowToPlayPage() {
	return (
		<>
			<Header />
			<main className="grid gap-y-40 pb-40 sm:mt-24">
				<div className="grid gap-y-8">
					<h1 className="font-bold text-xl">遊び方</h1>
					<p className="text-neutral-500 text-sm">
						初めてでもすぐ遊べる！おもじゃんオンラインのルールを解説します。
					</p>
					<img
						alt="おもじゃんオンライン"
						className="w-full rounded-lg"
						decoding="async"
						fetchPriority="high"
						height={1024}
						src="/ogp.png"
						width={1536}
					/>
				</div>

				<div className="grid gap-y-40">
					{/* おもじゃんとは */}
					<section className="grid gap-y-12">
						<h2 className="font-bold text-lg">おもじゃんとは？</h2>
						<p className="text-sm leading-relaxed">
							おもじゃんオンラインは、4人で遊ぶ言葉の対戦ゲームです。お題（テーマ牌）に手持ちの言葉（手持ち牌）をくっつけて面白い造語を作り、みんなで一番面白かった造語に投票します。全4ラウンドで総合得点が一番高い人が優勝です。
						</p>
					</section>

					{/* ゲームの流れ */}
					<section className="grid gap-y-20">
						<h2 className="font-bold text-lg">ゲームの流れ</h2>

						<div className="grid gap-y-32">
							{/* STEP 1 */}
							<Step number={1} title="部屋をつくる or 参加する">
								<p>
									トップページから「部屋をつくる」ボタンで新しい部屋を作成するか、募集中の部屋一覧から参加します。
								</p>
								<ul className="grid list-disc gap-y-4 pl-20">
									<li>部屋名と制限時間（15秒〜360秒）を設定して作成できます</li>
									<li>
										鍵をかければ、パスワードを知っている人だけが参加できるプライベート部屋になります
									</li>
									<li>ログイン不要で遊べます（匿名参加OK）</li>
								</ul>
								<img
									alt="部屋参加ダイアログ"
									className="w-full rounded-lg"
									decoding="async"
									height={682}
									loading="lazy"
									src="/guide/join.webp"
									width={1116}
								/>
							</Step>

							{/* STEP 2 */}
							<Step number={2} title="4人揃ったらゲームスタート">
								<p>
									待機画面で他のプレイヤーが集まるのを待ちます。4人揃うと自動的にゲームが始まります。
								</p>
								<ul className="grid list-disc gap-y-4 pl-20">
									<li>
										部屋をつくった人（ホスト）は「今すぐ開始」ボタンで、空いている席をCPUプレイヤーで埋めて始めることもできます
									</li>
									<li>
										ゲームが始まると、各プレイヤーに7枚の手持ち牌が配られます
									</li>
								</ul>
								<img
									alt="マッチング待機画面"
									className="w-full rounded-lg"
									decoding="async"
									height={880}
									loading="lazy"
									src="/guide/matching.webp"
									width={1596}
								/>
							</Step>

							{/* STEP 3 */}
							<Step number={3} title="テーマに言葉をくっつけて造語！">
								<p>
									ラウンドが始まると、みんなに共通のテーマ牌（お題）が出されます。手持ち牌から1枚選んで、テーマの「前」か「後ろ」にくっつけて造語を作りましょう。
								</p>
								<div className="rounded-lg bg-yellow-100 p-16">
									<p className="mb-4 font-bold text-xs text-yellow-700">
										造語の例
									</p>
									<p className="text-center text-sm">
										<span className="text-yellow-700">
											手持ち牌「もちもち」
										</span>
										{" ＋ "}
										<span className="font-bold">テーマ「大臣」</span>
										{" → "}
										<span className="font-bold text-lg">もちもち大臣</span>
									</p>
								</div>
								<ul className="grid list-disc gap-y-4 pl-20">
									<li>1ラウンドで全員が順番に1回ずつ提出します</li>
									<li>制限時間を過ぎるとランダムに自動提出されます</li>
									<li>使った手持ち牌は次のラウンド以降使えません</li>
								</ul>
								<img
									alt="提出フェーズの画面"
									className="w-full rounded-lg"
									decoding="async"
									height={1722}
									loading="lazy"
									src="/guide/submission.webp"
									width={1646}
								/>
							</Step>

							{/* STEP 4 */}
							<Step number={4} title="一番面白い造語に投票！">
								<p>
									全員の造語が出揃ったら、投票フェーズです。自分以外のプレイヤーの造語から、一番面白いと思ったものに投票しましょう。
								</p>
								<ul className="grid list-disc gap-y-4 pl-20">
									<li>投票の制限時間は15秒です</li>
									<li>時間内に投票しないとランダムで投票されます</li>
									<li>
										最も多く票を集めたプレイヤーがラウンド勝者です（同票なら全員勝者）
									</li>
								</ul>
								<img
									alt="投票フェーズの画面"
									className="w-full rounded-lg"
									decoding="async"
									height={754}
									loading="lazy"
									src="/guide/vote.webp"
									width={1592}
								/>
							</Step>

							{/* STEP 5 */}
							<Step number={5} title="4ラウンド繰り返して優勝者決定！">
								<p>
									全4ラウンドが終わると最終結果が表示されます。ラウンド勝利数が一番多いプレイヤーが優勝です。
								</p>
								<ul className="grid list-disc gap-y-4 pl-20">
									<li>
										毎ラウンド席順が変わるので、全員が公平に1番手〜4番手を経験します
									</li>
									<li>勝利数が同じ場合は、全員が優勝になります</li>
								</ul>
								<img
									alt="最終結果画面"
									className="w-full rounded-lg"
									decoding="async"
									height={1689}
									loading="lazy"
									src="/guide/result.webp"
									width={1645}
								/>
							</Step>
						</div>
					</section>

					{/* ゲームの特徴 */}
					<section className="grid gap-y-12">
						<h2 className="font-bold text-lg">特徴</h2>
						<div className="grid gap-y-8 sm:grid-cols-2 sm:gap-16">
							{FEATURES.map((feature) => (
								<FeatureCard key={feature.title} {...feature} />
							))}
						</div>
					</section>

					{/* CTA */}
					<section className="grid place-items-center gap-y-12">
						<Link
							className="rounded-lg bg-yellow-400 px-32 py-12 font-bold text-sm shadow transition hover:bg-yellow-500"
							to="/"
						>
							さっそく遊んでみる
						</Link>
					</section>
				</div>
			</main>
		</>
	);
}

function Step({
	number,
	title,
	children,
}: PropsWithChildren<{
	number: number;
	title: string;
}>) {
	return (
		<div className="grid gap-y-12">
			<div className="flex items-center gap-x-8">
				<span className="grid size-28 place-items-center rounded-full bg-yellow-400 font-bold text-sm">
					{number}
				</span>
				<h3 className="font-bold text-base">{title}</h3>
			</div>
			<div className="grid gap-y-12 pl-36 text-sm leading-relaxed">
				{children}
			</div>
		</div>
	);
}

function FeatureCard({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="grid gap-y-4 rounded-lg bg-white p-16">
			<p className="font-bold text-sm">{title}</p>
			<p className="text-neutral-500 text-xs leading-relaxed">{description}</p>
		</div>
	);
}
