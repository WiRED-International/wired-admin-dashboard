const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { importLayoutFixture } = require('./helpers/importLayoutFixture.cjs');

const chrome = [process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome',
].find(candidate => candidate && fs.existsSync(candidate));

test('importer computed typography and layout at 900, 768, 390 and 360px', {
  skip: chrome ? false : 'Headless Chrome is unavailable; computed-style verification requires CHROME_PATH.', timeout: 30000,
}, async context => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'wired-import-layout-'));
  try {
    const fixture = importLayoutFixture();
    // Iframes use exact CSS viewport sizes, avoiding Chrome's minimum desktop window width.
    const script = `
      Promise.all([900,768,390,360].map(width => new Promise(resolve => {
        const frame=document.createElement('iframe');
        frame.style.cssText='border:0;display:block;width:'+width+'px;height:2800px';
        frame.onload=async()=>{
          const doc=frame.contentDocument, win=frame.contentWindow;
          await doc.fonts.ready;
          const viewport=doc.documentElement.clientWidth;
          const nodes=[...doc.querySelectorAll('.exam-import, .exam-import *')];
          const shown=nodes.filter(el=>!el.classList.contains('exam-import-sr-only') && el.getClientRects().length);
          const overflow=shown.filter(el=>el.getBoundingClientRect().right>viewport+1).map(el=>({tag:el.tagName,class:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width,minWidth:win.getComputedStyle(el).minWidth}));
          const serif=shown.filter(el=>!win.getComputedStyle(el).fontFamily.includes('sans-serif')).map(el=>({tag:el.tagName,class:el.className,font:win.getComputedStyle(el).fontFamily}));
          const metrics={width,windowWidth:win.innerWidth,viewport,scrollWidth:doc.documentElement.scrollWidth,overflow,serif,
            font:win.getComputedStyle(doc.querySelector('.exam-import')).fontFamily,
            uploadFont:win.getComputedStyle(doc.querySelector('input[type=file]'),'::file-selector-button').fontFamily,
            hiddenExplanation:!doc.body.textContent.includes('EXPLANATION_IGNORED'),
            controls:[...doc.querySelectorAll('.exam-import-option-editor input, .exam-import-savebar button, input[type=file], textarea')].map(el=>({type:el.type,width:el.getBoundingClientRect().width,left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,disabled:el.disabled})),
            selected:[...doc.querySelectorAll('input:checked')].length,
            choices:doc.querySelectorAll('.exam-import-choice-text input').length,
          };
          const actions=[...doc.querySelectorAll('.exam-template-actions button')];
          metrics.actionsMatched=actions.length===2 && actions[0].getBoundingClientRect().height===actions[1].getBoundingClientRect().height;
          const picker=doc.querySelector('input[type=file]');picker.focus();
          metrics.pickerAccessible=doc.activeElement===picker && !!doc.querySelector('label[for=exam-document]') && win.getComputedStyle(picker).outlineStyle!=='none';
          const choice=doc.querySelector('.exam-import-choice-text input');
          choice.focus();choice.value='Edited choice';choice.dispatchEvent(new Event('input',{bubbles:true}));
          metrics.editable=doc.activeElement===choice && choice.value==='Edited choice' && !choice.disabled && !choice.readOnly;
          const answer=doc.querySelector('input[type=checkbox]');answer.focus();answer.click();
          metrics.answerUsable=doc.activeElement===answer && !answer.checked;
          const save=doc.querySelector('.exam-import-savebar button');
          save.scrollIntoView({block:'center'});save.focus();
          const saveRect=save.getBoundingClientRect();
          metrics.saveUsable=doc.activeElement===save && !save.disabled && saveRect.top>=0 && saveRect.bottom<=win.innerHeight;
          resolve(metrics);
        };
        frame.srcdoc=${JSON.stringify(fixture)};
        document.body.append(frame);
      }))).then(results=>{const node=document.createElement('pre');node.id='layout-results';node.dataset.results=btoa(JSON.stringify(results));document.body.append(node);});
    `;
    const file = path.join(temp, 'layout.html');
    fs.writeFileSync(file, `<!doctype html><html><body><script>${script}</script></body></html>`);
    const output = await new Promise((resolve, reject) => {
      const child = spawn(chrome, ['--headless', '--no-first-run', '--disable-extensions',
        `--user-data-dir=${path.join(temp, 'profile')}`, '--dump-dom', '--virtual-time-budget=5000', pathToFileURL(file).href,
      ], { windowsHide: true, signal: context.signal });
      let stdout = '', stderr = '';
      child.stdout.on('data', chunk => { stdout += chunk; });
      child.stderr.on('data', chunk => { stderr += chunk; });
      child.on('error', reject);
      child.on('close', code => code === 0 ? resolve(stdout) : reject(new Error(`Headless Chrome failed (${code}): ${stderr.slice(-1000)}`)));
    });
    const match = output.match(/id="layout-results" data-results="([^"]+)"/);
    assert.ok(match, 'Chrome must return completed layout measurements');
    const results = JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
    console.log(JSON.stringify(results.map(({width,viewport,scrollWidth,font,serif,overflow,editable,answerUsable,saveUsable}) => ({width,viewport,scrollWidth,font,serif:serif.slice(0,5),overflow:overflow.slice(0,5),editable,answerUsable,saveUsable}))));
    for (const result of results) {
      assert.equal(result.windowWidth, result.width);
      assert.equal(result.scrollWidth, result.viewport, `Overflow at ${result.width}px: ${JSON.stringify(result.overflow.slice(0, 5))}`);
      assert.equal(result.overflow.length, 0, `Elements exceed ${result.width}px`);
      assert.equal(result.serif.length, 0, `Serif text at ${result.width}px: ${JSON.stringify(result.serif.slice(0, 8))}`);
      assert.match(result.font, /Inter.*sans-serif/);
      assert.match(result.uploadFont, /sans-serif/);
      assert.ok(result.controls.every(control => control.width > 0 && control.left >= 0 && control.right <= result.viewport + 1));
      assert.equal(result.selected, 3);
      assert.equal(result.choices, 6);
      assert.ok(result.pickerAccessible && result.actionsMatched);
      assert.ok(result.hiddenExplanation && result.editable && result.answerUsable && result.saveUsable);
    }
  } finally {
    // Delete only the dedicated temporary fixture/profile created by this test.
    assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir()) + path.sep));
    fs.rmSync(temp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
