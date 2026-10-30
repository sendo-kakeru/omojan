import { Link } from "react-router";
import { Header } from "~/components/Header";

export default function PrivacyPage() {
	return (
		<>
			<Header />
			<main className="grid gap-y-32 pb-40 sm:mt-24">
				<h1 className="text-xl font-bold">プライバシーポリシー</h1>

				<div className="grid gap-y-24 text-sm leading-relaxed">
					<p>
						おもじゃんオンライン（以下「本サービス」）は、ユーザーの個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
					</p>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第1条（収集する情報）</h2>
						<p>
							本サービスは、Googleアカウントを利用したログイン時に、以下の情報を取得します。
						</p>
						<ol className="grid list-decimal gap-y-4 pl-20">
							<li>メールアドレス</li>
							<li>ユーザー名（表示名）</li>
							<li>プロフィール画像</li>
						</ol>
						<p>
							また、サービスの運営上、アクセスログ（IPアドレス、ブラウザ情報、アクセス日時等）を自動的に取得する場合があります。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第2条（利用目的）</h2>
						<p>収集した情報は、以下の目的で利用します。</p>
						<ol className="grid list-decimal gap-y-4 pl-20">
							<li>本サービスの提供・運営</li>
							<li>ユーザー認証およびアカウント管理</li>
							<li>ゲーム内でのユーザー名・プロフィール画像の表示</li>
							<li>サービスの改善・新機能の開発</li>
							<li>不正利用の防止</li>
							<li>お問い合わせへの対応</li>
						</ol>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第3条（第三者提供）</h2>
						<p>
							運営者は、以下の場合を除き、ユーザーの個人情報を第三者に提供することはありません。
						</p>
						<ol className="grid list-decimal gap-y-4 pl-20">
							<li>ユーザーの同意がある場合</li>
							<li>法令に基づき開示が求められた場合</li>
							<li>
								人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき
							</li>
						</ol>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第4条（外部サービスの利用）</h2>
						<p>
							本サービスは、以下の外部サービスを利用してデータの処理・保管を行っています。各サービスのプライバシーポリシーについては、それぞれのサービス提供元をご確認ください。
						</p>
						<ul className="grid list-disc gap-y-4 pl-20">
							<li>AWS Cognito（認証基盤）- Amazon Web Services, Inc.</li>
							<li>
								Cloudflare Workers / R2（アプリケーション・ストレージ基盤）-
								Cloudflare, Inc.
							</li>
							<li>Turso（データベース）- Turso, Inc.</li>
							<li>
								Google Analytics / Google Tag Manager（アクセス解析）- Google
								LLC
							</li>
						</ul>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">
							第5条（Cookieおよびローカルストレージ）
						</h2>
						<p>
							本サービスは、認証トークンの保管にブラウザのローカルストレージを使用します。また、アクセス解析のためにCookieを使用する場合があります。ブラウザの設定によりCookieを無効にすることができますが、本サービスの一部機能が利用できなくなる場合があります。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第6条（データの保管）</h2>
						<p>
							ユーザーの個人情報は、Cloudflare
							Workers上で動作するアプリケーションおよびTursoデータベースに保管されます。運営者は、適切なセキュリティ対策を講じてデータの保護に努めます。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第7条（データの削除・退会）</h2>
						<p>
							ユーザーは、アカウントの無効化（退会）を行うことで、本サービスにおけるアカウント情報の利用を停止できます。退会後、個人情報は運営者の判断により合理的な期間内に削除されます。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第8条（ポリシーの変更）</h2>
						<p>
							運営者は、必要に応じて本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上に掲載された時点で効力を生じるものとします。
						</p>
					</section>

					<section className="grid gap-y-8">
						<h2 className="text-base font-bold">第9条（お問い合わせ）</h2>
						<p>
							本ポリシーに関するお問い合わせは、以下の連絡先までお願いいたします。
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

					<p className="text-xs text-neutral-500">2026年2月16日 制定</p>

					<Link className="text-sm text-blue-600 underline" to="/terms">
						利用規約はこちら
					</Link>
				</div>
			</main>
		</>
	);
}
