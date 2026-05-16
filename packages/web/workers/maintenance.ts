import { OFFICIAL_X_ID } from "@repo/shared/constants/config";

export const maintenanceHtml = () => `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>メンテナンス中 | omojan</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <meta name="theme-color" content="#fef9c3">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', sans-serif;
      background-color: oklch(98.7% 0.026 102.212);
      color: #262626;
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    p {
      font-size: 1rem;
      color: oklch(37.1% 0 0);
      line-height: 1.6;
    }
    .container {
      text-align: center;
      max-width: 400px;
    }
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 32px;
      border-radius: 6px;
    }
    .message {
      margin-bottom: 24px;
      display: grid;
      gap: 4px;
    }
    .x {
      display: grid;
      gap: 8px;
      place-items: center;

      > p {
        font-size: 0.875rem;
        color: oklch(55.6% 0 0);
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <img src="/icons/omojan.webp" alt="omojan" class="logo">
    <h1>メンテナンス中</h1>
    <div class="message">
      <p>現在メンテナンスを行っています。</p>
      <p>復旧まで今しばらくお待ちください。</p>
      </div>
    <div class="x">
      <p>進捗は公式Xでお知らせします。</p>
      <a class="twitter-follow-button"
      href="https://twitter.com/${OFFICIAL_X_ID}"
      data-size="large">
      Follow @${OFFICIAL_X_ID}</a>
    </div>
  </div>
<script>window.twttr = (function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0],
    t = window.twttr || {};
  if (d.getElementById(id)) return t;
  js = d.createElement(s);
  js.id = id;
  js.src = "https://platform.twitter.com/widgets.js";
  fjs.parentNode.insertBefore(js, fjs);

  t._e = [];
  t.ready = function(f) {
    t._e.push(f);
  };

  return t;
}(document, "script", "twitter-wjs"));</script>
</body>
</html>`;
