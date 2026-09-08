// 이슈 족보 화면 시안을 실제 서비스처럼 오가게 하는 런타임. 아트보드 HTML은 건드리지 않고, 글자·스타일로 요소를 찾아 링크를 붙인다.
(function () {
  const PAGE = document.body.dataset.page;
  const all = () => Array.from(document.querySelectorAll('div, span, p, h1, h2, svg'));
  const text = el => (el.textContent || '').replace(/\s+/g, ' ').trim();
  // 글자가 정확히 일치하는 가장 안쪽 요소들
  const byText = (t, pred) => all().filter(el => text(el) === t && !Array.from(el.children).some(c => text(c) === t) && (!pred || pred(el)));
  const startsWith = (t, pred) => all().filter(el => text(el).startsWith(t) && !Array.from(el.children).some(c => text(c).startsWith(t)) && (!pred || pred(el)));
  // 배경색 비교는 계산된 스타일로 한다. style을 한 번 건드리면 속성 문자열이 rgb() 표기로 바뀌기 때문이다.
  const bg = (el, hex) => { const n = parseInt(hex.slice(1), 16); return getComputedStyle(el).backgroundColor.replace(/\s/g, '') === `rgb(${n >> 16},${(n >> 8) & 255},${n & 255})`; };

  function link(el, href, opts) {
    if (!el || el.dataset.link) return;
    el.dataset.link = href;
    el.style.cursor = 'pointer';
    el.setAttribute('role', 'link'); el.tabIndex = 0;
    const go = e => { e.stopPropagation(); if (typeof href === 'function') return href(); if (opts && opts.blank) window.open(href, '_blank', 'noopener'); else location.href = href; };
    el.addEventListener('click', go);
    el.addEventListener('keydown', e => { if (e.key === 'Enter') go(e); });
  }

  // 검색창(돋보기 아이콘 + 안내 글자)을 실제 입력창으로 바꾼다.
  function makeSearchInput(root) {
    const icons = Array.from((root || document).querySelectorAll('svg')).filter(s => s.innerHTML.includes('M10.5 10.5L14 14'));
    for (const icon of icons) {
      const box = icon.parentElement, label = icon.nextElementSibling;
      if (!label || label.tagName !== 'SPAN') continue;
      const cur = text(label), isPlaceholder = /^예:|만들기$|^검색/.test(cur);
      const input = document.createElement('input');
      input.type = 'search'; input.setAttribute('aria-label', '키워드');
      input.placeholder = isPlaceholder ? cur : '예: 대장동, 의대 정원 AND 파업';
      if (!isPlaceholder) input.value = cur;
      input.style.cssText = 'flex:1;min-width:0;height:100%;border:0;outline:0;background:transparent;font:inherit;font-size:14px;color:#1E2620;padding:0;';
      label.replaceWith(input);
      box.style.cursor = 'text';
      box.addEventListener('click', () => input.focus());
      input.addEventListener('keydown', e => { if (e.key === 'Enter') submitKeyword(input.value); });
      box.dataset.search = '1';
    }
  }
  function submitKeyword(v) {
    const q = (v || '').trim() || '대장동';
    location.href = (q.includes('용산') ? 'disambig.html' : 'loading.html') + '?q=' + encodeURIComponent(q);
  }

  // 모든 화면 공통: 로고, 탭, 붙여넣기 버튼, 검색창
  byText('이슈 족보', el => el.tagName === 'SPAN' && el.classList.contains('serif')).forEach(el => link(el, 'index.html'));
  const TABS = { '타임라인': 'main.html', '선수지식': 'prereq.html', '관계도': 'relations.html', '대화 카드': 'cards.html' };
  for (const [t, href] of Object.entries(TABS)) {
    byText(t, el => el.tagName === 'SPAN' && !bg(el, '#CFD4CB') && !(el.getAttribute('style') || '').includes('#CFD4CB'))
      .forEach(el => { if ((el.getAttribute('style') || '').includes('border-bottom')) { el.style.cursor = 'default'; return; } link(el, href); });
  }
  byText('기사 붙여넣기', el => el.tagName === 'DIV').forEach(el => link(el, 'paste.html'));
  byText('다른 기사 붙여넣기', el => el.tagName === 'DIV').forEach(el => link(el, 'paste.html'));
  byText('최근 족보').forEach(el => link(el, 'main.html'));
  byText('어떻게 만드나', el => el.tagName === 'SPAN' && !el.classList.contains('mono')).forEach(el => link(el, () => { const t = byText('어떻게 만드나', x => x.classList.contains('mono'))[0]; if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
  makeSearchInput();

  if (PAGE === 'index' || PAGE === 'paste') {
    byText('족보 만들기', el => el.tagName === 'DIV').forEach(el => link(el, () => submitKeyword((document.querySelector('input[type=search]') || {}).value)));
    // 본문 붙여넣기 상자를 실제 textarea로
    startsWith('기사 본문을 여기에 붙여넣으세요', el => el.tagName === 'DIV').forEach(div => {
      const ta = document.createElement('textarea');
      ta.placeholder = text(div);
      ta.style.cssText = div.getAttribute('style') + ';width:100%;box-sizing:border-box;resize:none;font:inherit;font-size:14px;line-height:1.6;color:#1E2620;outline:0;';
      div.replaceWith(ta);
      const counter = startsWith('0자 ·')[0];
      ta.addEventListener('input', () => { if (counter) counter.textContent = ta.value.length.toLocaleString() + '자 · 300자 이상 권장'; });
    });
    byText('선수지식 찾기', el => el.tagName === 'DIV' && !bg(el, '#B04545')).forEach(el => link(el, 'prereq.html'));
    ['대장동', '의대 정원', '부동산 PF'].forEach(k => startsWith(k, el => el.tagName === 'SPAN' && bg(el, '#E3EDDA')).forEach(el => link(el, 'main.html')));
  }
  if (PAGE === 'paste') {
    byText('취소', el => el.tagName === 'DIV').forEach(el => link(el, 'index.html'));
    byText('선수지식 찾기', el => el.tagName === 'DIV' && bg(el, '#B04545')).forEach(el => link(el, 'prereq.html'));
    Array.from(document.querySelectorAll('svg')).filter(s => s.innerHTML.includes('M5 5l10 10')).forEach(s => link(s, 'index.html'));
    all().filter(el => (el.getAttribute('style') || '').includes('rgba(30, 38, 32, 0.32)')).forEach(el => link(el, 'index.html'));
  }
  if (PAGE === 'disambig') {
    const cards = ['용산 정비창 개발', '대통령실 용산 이전'].map(t => { const h = byText(t, el => el.tagName === 'H2')[0]; return h && h.parentElement; }).filter(Boolean);
    const CHECK = '<circle cx="9" cy="9" r="8" fill="#3F6B2A"/><path d="M5.5 9.5l2.5 2.5 4.5-5.5" stroke="#FFFFFF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>';
    const EMPTY = '<circle cx="9" cy="9" r="7.5" stroke="#CFD4CB" stroke-width="1.5"/>';
    const select = idx => cards.forEach((c, i) => {
      const on = i === idx, label = c.querySelector('span.mono'), h2 = c.querySelector('h2'), icon = c.querySelector('svg');
      c.style.background = on ? '#E3EDDA' : '#FFFFFF'; c.style.border = on ? '2px solid #689D4B' : '1px solid #CFD4CB'; c.style.padding = on ? '18px' : '19px';
      label.textContent = '이슈 ' + 'AB'[i] + (on ? ' · 선택됨' : ''); label.style.color = on ? '#2C4D1D' : '#5F675F';
      h2.style.color = on ? '#2C4D1D' : '#3F6B2A'; icon.innerHTML = on ? CHECK : EMPTY;
      c.querySelectorAll(':scope > div:nth-of-type(2) > span').forEach(s => { s.style.background = on ? '#FFFFFF' : '#E9EBE7'; s.style.color = on ? '#2C4D1D' : '#5F675F'; });
      if (on) startsWith('이슈 ', el => el.tagName === 'DIV' && bg(el, '#B04545')).forEach(b => { b.textContent = '이슈 ' + 'AB'[i] + '로 족보 만들기'; });
    });
    cards.forEach((c, i) => { c.style.cursor = 'pointer'; c.addEventListener('click', () => select(i)); });
    all().filter(el => el.tagName === 'DIV' && bg(el, '#B04545') && !el.dataset.link).forEach(el => link(el, 'loading.html'));
  }
  if (PAGE === 'loading') {
    const q = new URLSearchParams(location.search).get('q');
    if (q) { const inp = document.querySelector('input[type=search]'); if (inp) inp.value = q; }
    setTimeout(() => { location.href = 'main.html'; }, 5000);
  }
  if (['main', 'source', 'prereq', 'relations', 'cards'].includes(PAGE)) {
    // 요약 문장 카드 → 출처 패널
    startsWith('출처 ·', el => el.tagName === 'SPAN').forEach(seal => { const card = seal.parentElement; if (card && card.querySelector('p')) link(card, 'source.html'); });
    // 챕터 제목에 앵커, 목차 행은 그 자리로 스크롤
    const h2s = Array.from(document.querySelectorAll('h2.serif'));
    h2s.forEach((h, i) => { if (!h.id) h.id = 'ch-' + i; });
    const ch0 = h2s.find(h => text(h).startsWith('이름이 붙기 전')); if (ch0) ch0.id = 'ch0';
    startsWith('챕 ', el => el.tagName === 'SPAN' && el.classList.contains('mono')).forEach(num => {
      const row = num.parentElement, title = row && row.children[1] ? text(row.children[1]) : '';
      const target = h2s.find(h => text(h) === title) || startsWith('챕터 3 · 4 · 5는')[0];
      if (target) link(row, () => target.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    });
    byText('1990년까지 더 과거 보기', el => el.tagName === 'DIV').forEach(el => link(el, 'states.html'));
    byText('타임라인 열기 →').forEach(el => link(el, 'main.html'));
    byText('챕터 0 열기 →').forEach(el => link(el, 'main.html#ch0'));
    startsWith('200자 발췌 · 원문', el => el.tagName === 'SPAN').forEach(el => link(el, 'https://www.bigkinds.or.kr/', { blank: true }));
  }
  if (PAGE === 'source') {
    const panel = all().find(el => (el.getAttribute('style') || '').includes('width: 440px') && (el.getAttribute('style') || '').includes('position: absolute'));
    if (panel) {
      Array.from(panel.querySelectorAll('svg')).filter(s => s.innerHTML.includes('M5 5l10 10')).forEach(s => link(s, 'main.html'));
      Array.from(panel.querySelectorAll('div')).filter(el => bg(el, '#B04545')).forEach(el => link(el, 'https://www.bigkinds.or.kr/', { blank: true }));
    }
    all().filter(el => (el.getAttribute('style') || '').includes('rgba(30, 38, 32, 0.32)')).forEach(el => link(el, 'main.html'));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') location.href = 'main.html'; });
  }
  if (PAGE === 'states') {
    all().filter(el => el.tagName === 'DIV' && bg(el, '#B04545')).forEach(el => link(el, 'main.html'));
  }
  if (location.hash) { const t = document.getElementById(location.hash.slice(1)); if (t) setTimeout(() => t.scrollIntoView({ block: 'center' }), 50); }
})();
