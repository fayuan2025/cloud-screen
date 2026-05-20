// ==UserScript==
// @name         剪贴板同步 v3.0
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  复制时自动同步纯文字+HTML格式到本机，含重试机制
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// ==/UserScript==

const SYNC_URL = 'https://script.google.com/macros/s/AKfycbzi1ySPsxEF_SCS94kEumSlB99oYg1cXkyUX0Gg8ku5vP0MgFW9QRq4JwEKFBpHZtJRHA/exec';

let lastText = '';

function upload(text, html, retries) {
  if (!text && !html) return;
  if (text === lastText) return;
  lastText = text;
  retries = retries || 3;

  GM_xmlhttpRequest({
    method: 'POST',
    url: SYNC_URL,
    headers: { 'Content-Type': 'application/json' },
    data: JSON.stringify({ text: text, html: html || '' }),
    onload: function(r) {
      console.log('✅ 剪贴板已同步:', text.slice(0, 30));
    },
    onerror: function() {
      if (retries > 1) {
        console.log('重试中... 剩余' + (retries-1) + '次');
        setTimeout(function() { upload(text, html, retries - 1); }, 1500);
      } else {
        console.log('❌ 同步失败');
      }
    }
  });
}

// Ctrl+C 复制（带HTML格式）
document.addEventListener('copy', function() {
  setTimeout(function() {
    var selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    var text = selection.toString().trim();
    var html = '';
    try {
      var div = document.createElement('div');
      div.appendChild(selection.getRangeAt(0).cloneContents());
      html = div.innerHTML.trim();
    } catch(e) {}
    if (text) upload(text, html);
  }, 100);
});

// 监听网页复制按钮（每1秒检查系统剪贴板变化）
var lastClip = '';
setInterval(function() {
  navigator.clipboard.readText()
    .then(function(text) {
      text = text.trim();
      if (text && text !== lastClip && text !== lastText) {
        lastClip = text;
        upload(text, '');
      }
    })
    .catch(function() {});
}, 1000);
