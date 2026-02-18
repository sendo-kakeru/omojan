import { Link } from "react-router";
import { Header } from "~/components/Header";

export default function TermsPage() {
	return (
		<>
			<Header />
			<main className="grid gap-y-32 pb-40 sm:mt-24">
				<h1 className="font-bold text-xl">利用規約</h1>

				<div className="grid gap-y-24 text-sm leading-relaxed">
					<p>
						この利用規約（以下「本規約」）は、おもじゃんオンライン（以下「本サービス」）の利用条件を定めるものです。ユーザーの皆様には、本規約に同意いただいた上で本サービスをご利用いただきます。
					</p>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第1条（適用）</h2>
						<p>
							本規約は、ユーザーと本サービス運営者との間の本サービスの利用に関わる一切の関係に適用されるものとします。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第2条（サービス内容）</h2>
						<p>
							本サービスは、4人対戦のオンラインワードゲームです。ユーザーはお題に対して手札の言葉を組み合わせた造語を投稿し、投票によって勝敗を決定します。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第3条（アカウント）</h2>
						<ol className="grid list-decimal gap-y-4 pl-20">
							<li>
								ユーザーはGoogleアカウントを使用してログインすることで、本サービスのアカウントを作成できます。
							</li>
							<li>
								ユーザーは、自己の責任において本サービスのアカウントを管理するものとします。
							</li>
							<li>アカウントの第三者への譲渡、貸与、共有は禁止します。</li>
						</ol>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第4条（禁止事項）</h2>
						<p>ユーザーは、以下の行為を行ってはなりません。</p>
						<ol className="grid list-decimal gap-y-4 pl-20">
							<li>法令または公序良俗に違反する行為</li>
							<li>犯罪行為に関連する行為</li>
							<li>
								他のユーザーまたは第三者を誹謗中傷し、差別し、または不快にさせる造語・言葉の投稿
							</li>
							<li>
								サーバーまたはネットワークに過度の負荷をかける行為、不正アクセスなどサービスの運営を妨害する行為
							</li>
							<li>botやスクリプト等を用いた自動操作による本サービスの利用</li>
							<li>その他、運営者が不適切と判断する行為</li>
						</ol>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">
							第5条（サービスの変更・中断・終了）
						</h2>
						<p>
							運営者は、ユーザーへの事前の通知なく、本サービスの内容を変更し、または本サービスの提供を中断もしくは終了することができるものとします。これによりユーザーに生じた損害について、運営者は一切の責任を負いません。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第6条（免責事項）</h2>
						<ol className="grid list-decimal gap-y-4 pl-20">
							<li>
								運営者は、本サービスに事実上または法律上の瑕疵がないことを保証するものではありません。
							</li>
							<li>
								運営者は、本サービスの利用によりユーザーに生じたあらゆる損害について、一切の責任を負いません。
							</li>
							<li>
								ユーザー間のトラブルについて、運営者は一切関与せず、責任を負いません。
							</li>
						</ol>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第7条（退会）</h2>
						<p>
							ユーザーは、運営者所定の方法により、アカウントを無効化（退会）することができます。退会後、当該アカウントに関連するデータは運営者の判断により削除される場合があります。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第8条（規約の変更）</h2>
						<p>
							運営者は、必要と判断した場合には、ユーザーに通知することなく本規約を変更できるものとします。変更後の利用規約は、本サービス上に掲載された時点で効力を生じるものとします。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第9条（準拠法・裁判管轄）</h2>
						<p>
							本規約の解釈は日本法に準拠するものとします。本サービスに関して紛争が生じた場合には、運営者の所在地を管轄する裁判所を専属的合意管轄とします。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="font-bold text-base">第10条（お問い合わせ）</h2>
						<p>
							本規約に関するお問い合わせは、以下の連絡先までお願いいたします。
						</p>
						<p>
							メールアドレス:{" "}
							<a
								className="text-blue-600 underline"
								href="mailto:omojan.online@gmail.com"
							>
								omojan.online@gmail.com
							</a>
						</p>
					</section>

					<p className="text-neutral-500 text-xs">2026年2月16日 制定</p>

					<Link className="text-blue-600 text-sm underline" to="/privacy">
						プライバシーポリシーはこちら
					</Link>
				</div>
			</main>
		</>
	);
}
