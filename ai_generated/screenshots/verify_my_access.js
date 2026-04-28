/**
 * マイアクセス画面の動作確認スクリプト
 *
 * 一般社員としてログインし、マイアクセス画面のスクリーンショットを取得する。
 * playwright-cliと異なり、localhost:3001でコールバックを受けてからコンテナ名に切り替える方法を使用。
 */
const { chromium } = require('/usr/lib/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // ログイン画面を開く（localhost:3001を使用してコールバックを受ける）
  // AI AgentからはlocalhostがAI Agent container自身を指すため、
  // まずlocalhostでログインしてセッションCookieを取得する
  console.log('Opening login page...');
  await page.goto('http://localhost:3001/login');
  await page.waitForLoadState('networkidle');

  // KeyCloakログインボタンをクリック
  await page.click('button:has-text("KeyCloakでログイン")');
  await page.waitForLoadState('networkidle');

  // 一般社員ユーザーでログイン
  await page.fill('#username', 'sato.hanako');
  await page.fill('#password', 'user1234');
  await page.click('#kc-login');

  // マイアクセス画面へのリダイレクトを待つ
  await page.waitForURL('**/my-access', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  console.log('Logged in, current URL:', page.url());

  // スクリーンショットを撮影
  await page.screenshot({ path: '/workspace/target_repo/ai_generated/screenshots/task-29_my-access.png', fullPage: true });
  console.log('Screenshot saved: task-29_my-access.png');

  await browser.close();
})().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
