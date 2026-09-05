// Run with playwright-cli run-code --filename scripts/gameplay-smoke.js against Vite.
async (page) => {
  const check = (ok, message) => { if (!ok) throw new Error(message); };
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:3457');
  await page.waitForFunction(() => document.getElementById('loading').classList.contains('hidden'));
  await page.getByRole('button', { name: 'TAKE A SEAT' }).click();
  await page.evaluate(async () => {
    const main = await (await fetch('/src/main.ts')).text();
    const load = async (name) => {
      const url = main.match(new RegExp('"(/src/' + name + '\\.ts[^"\\s]*)"'))[1];
      return import(url);
    };
    window.smoke = { ...(await load('state')), ...(await load('game')), ...(await load('hud')) };
    window.smoke.state.grid.forEach(row => row.fill(0));
  });
  await page.keyboard.down('ArrowDown');
  await page.waitForTimeout(520);
  await page.keyboard.up('ArrowDown');
  await page.waitForTimeout(150);
  const held = await page.evaluate(() => window.smoke.state.duckPos.row);
  check(held >= 3, 'Holding a key must repeat movement');
  await page.waitForTimeout(250);
  check(await page.evaluate(() => window.smoke.state.duckPos.row) === held, 'Key release must stop movement');
  const before = await page.evaluate(() => ({ ...window.smoke.state.duckPos }));
  await page.evaluate(() => { window.smoke.tryMove('right'); window.smoke.tryMove('down'); });
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => ({ ...window.smoke.state.duckPos }));
  check(after.col === before.col + 1 && after.row === before.row + 1, 'Buffered turn must execute exactly once');
  await page.evaluate(() => {
    const s = window.smoke.state;
    s.grid[s.duckPos.row][s.duckPos.col + 1] = 2;
  });
  await page.waitForTimeout(80);
  check(await page.locator('#trap-radar').textContent() === 'Adjacent traps: 1', 'Radar must count adjacent live traps');
  await page.evaluate(() => window.smoke.cashOut());
  const remaining = await page.evaluate(() => window.smoke.state.timeLeft);
  await page.waitForTimeout(1100);
  check(await page.evaluate(() => window.smoke.state.cashingOut), 'Transition must stay locked until new board');
  check(await page.evaluate(() => window.smoke.state.timeLeft) === remaining, 'Transition must freeze clock');
  await page.waitForTimeout(1200);
  check(await page.evaluate(() => !window.smoke.state.cashingOut && window.smoke.state.roundIdx === 1), 'Next hand must unlock');
  await page.evaluate(() => { window.smoke.state.coins = 4321; window.smoke.endTimeout(); });
  await page.waitForTimeout(100);
  check(await page.locator('#overlay-title').textContent() === '⏰ TABLE CLOSED', 'Timeout title must not be overwritten');
  check(await page.evaluate(() => localStorage.getItem('quack-attack:best:standard')) === '4321', 'Personal best must persist');
  await page.reload();
  check(await page.evaluate(() => localStorage.getItem('quack-attack:best:standard')) === '4321', 'Personal best must survive reload');
  await page.evaluate(() => localStorage.removeItem('quack-attack:best:standard'));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: 'TAKE A SEAT' }).click();
  await page.waitForTimeout(500);
  const down = page.getByRole('button', { name: 'Move down' });
  check(await down.isVisible(), 'Phone D-pad must be visible');
  const box = await down.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.up();
  await page.waitForTimeout(180);
  await page.screenshot({ path: 'output/playwright/mobile.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  check(await down.isVisible(), 'Landscape D-pad must remain visible');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.screenshot({ path: 'output/playwright/desktop.png' });
  const pixels = await page.evaluate(async () => {
    const main = await (await fetch('/src/main.ts')).text();
    const { state: s } = await import(main.match(/"(\/src\/state\.ts[^"\s]*)"/)[1]);
    const canvas = document.querySelector('canvas');
    const copy = document.createElement('canvas');
    copy.width = 64; copy.height = 64;
    const ctx = copy.getContext('2d');
    s.renderer.render(s.scene, s.camera);
    ctx.drawImage(canvas, 0, 0, 64, 64);
    return new Set(Array.from(ctx.getImageData(0, 0, 64, 64).data)).size;
  });
  // Screenshots provide visual QA; pixel diversity catches an empty canvas.
  check(pixels > 8, 'Canvas must contain rendered gameplay');
  console.log('PASS: held input, buffered turns, radar, transitions, timeout, persistence, responsive controls, canvas');
}
