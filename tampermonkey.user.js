// ==UserScript==
// @name         剪贴板同步 v2.0
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  复制时自动同步纯文字+HTML格式到本机
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// ==/UserScript==

const SYNC_URL = 'https://script.google.com/macros/s/AKfycbwan7_DdNAQnCexuG-CiZjB2EWG39g9clCfS8dju6I0lXTc48Hs95uhJLhf44xSXVWaww/exec';

let lastText = '';

function upload(text, html) {
  if (!text && !html) return;
  if (text === lastText) return;
  lastText = text;

  GM_xmlhttpRequest({
    method: 'POST',
    url: SYNC_URL,
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ text: text, html: html }),
    onload: r => console.log('✅ 已同步:', text.slice(0, 30)),
    onerror: () => {
      // 失败重试一次
      setTimeout(() => {
        GM_xmlhttpRequest({
          method: 'POST',
          url: SYNC_URL,
          headers: { 'Content-Type': 'application/json' },
          data: JSON.stringify({ text: text, html: html }),
          onload: r => console.log('✅ 重试成功:', text.slice(0, 30))
        });
      }, 1500);
    }
  });
}

document.addEventListener('copy', () => {
  setTimeout(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    // 纯文字
    const text = selection.toString().trim();

    // HTML 格式
    let html = '';
    try {
      const range = selection.getRangeAt(0);
      const div = document.createElement('div');
      div.appendChild(range.cloneContents());
      html = div.innerHTML.trim();
    } catch(e) {}

    if (text) upload(text, html);
  }, 100);
});
