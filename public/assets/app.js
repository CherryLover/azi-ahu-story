import { chapters, prologue } from './story.js';

const $ = (sel) => document.querySelector(sel);

const els = {
  app: $('#app'),
  sky: $('#sky'),
  motes: $('#motes'),
  prologue: $('#prologue'),
  proLines: $('#pro-lines'),
  btnEnter: $('#btn-enter'),
  chapter: $('#chapter'),
  chapterImg: $('#chapter-img'),
  frameMeta: $('#frame-meta'),
  chapterNo: $('#chapter-no'),
  chapterTitle: $('#chapter-title'),
  chapterMood: $('#chapter-mood'),
  lines: $('#lines'),
  hint: $('#hint'),
  btnReveal: $('#btn-reveal'),
  btnPrev: $('#btn-prev'),
  btnNext: $('#btn-next'),
  progress: $('#progress'),
  footerRight: $('#footer-right'),
  lightbox: $('#lightbox'),
  lightboxImg: $('#lightbox-img'),
  frame: $('#frame'),
  endNote: $('#end-note'),
  proTitle: $('#pro-title'),
  proSub: $('#pro-sub'),
};

const state = {
  started: false,
  index: 0,
  lineIndex: 0,
  revealing: false,
  fullyRevealed: false,
};

/* ---------- ambient motes ---------- */
function spawnMotes() {
  const n = 18;
  for (let i = 0; i < n; i++) {
    const m = document.createElement('span');
    m.className = 'mote';
    m.style.left = `${Math.random() * 100}%`;
    m.style.animationDuration = `${10 + Math.random() * 16}s`;
    m.style.animationDelay = `${Math.random() * 12}s`;
    m.style.width = m.style.height = `${1.5 + Math.random() * 2.5}px`;
    els.motes.appendChild(m);
  }
}

/* ---------- prologue ---------- */
function setupPrologue() {
  els.proTitle.textContent = prologue.title;
  els.proSub.textContent = prologue.subtitle;
  els.proLines.innerHTML = '';
  prologue.lines.forEach((text) => {
    const li = document.createElement('li');
    li.textContent = text;
    els.proLines.appendChild(li);
  });

  // 序章文字自动逐行浮现
  const items = [...els.proLines.children];
  items.forEach((li, i) => {
    setTimeout(() => li.classList.add('is-shown'), 550 + i * 420);
  });
}

function enterStory() {
  if (state.started) return;
  state.started = true;
  els.prologue.classList.add('is-gone');
  els.app.classList.add('is-reading');
  renderChapter(0, { animate: true });
}

/* ---------- progress dots ---------- */
function buildProgress() {
  els.progress.innerHTML = '';
  chapters.forEach((ch, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.title = `${ch.no} ${ch.title}`;
    b.setAttribute('aria-label', `前往第 ${ch.no} 幕 ${ch.title}`);
    b.addEventListener('click', () => {
      if (!state.started) enterStory();
      goTo(i);
    });
    els.progress.appendChild(b);
  });
}

function updateProgress() {
  [...els.progress.children].forEach((btn, i) => {
    btn.classList.toggle('is-current', i === state.index);
    btn.classList.toggle('is-done', i < state.index);
  });
}

/* ---------- chapter render ---------- */
function renderChapter(index, { animate = true } = {}) {
  const ch = chapters[index];
  state.index = index;
  state.lineIndex = 0;
  state.fullyRevealed = false;
  state.revealing = false;

  els.sky.dataset.tone = ch.tone;

  // 淡出再淡入
  els.chapter.classList.remove('is-active');

  const apply = () => {
    els.chapterImg.src = ch.image;
    els.chapterImg.alt = `${ch.title} — 阿紫与阿虎`;
    els.frameMeta.textContent = `SCENE ${ch.no}`;
    els.chapterNo.textContent = `第 ${ch.no} 幕`;
    els.chapterTitle.textContent = ch.title;
    els.chapterMood.textContent = ch.mood;

    els.lines.innerHTML = '';
    ch.lines.forEach((text) => {
      const li = document.createElement('li');
      li.textContent = text;
      els.lines.appendChild(li);
    });

    els.hint.textContent = '点击「展开」或按空格，文字会一行行浮现';
    els.hint.classList.remove('is-hidden');
    els.btnReveal.disabled = false;
    els.btnReveal.textContent = '展开叙述';
    els.btnPrev.disabled = index === 0;
    els.btnNext.disabled = true; // 必须先展开完（或点完）才可下一幕
    els.footerRight.textContent = `${index + 1} / ${chapters.length}`;
    updateProgress();

    // 预加载相邻图
    preloadAround(index);

    requestAnimationFrame(() => {
      els.chapter.classList.add('is-active');
    });
  };

  if (animate) {
    setTimeout(apply, 180);
  } else {
    apply();
  }
}

function preloadAround(index) {
  [index - 1, index + 1, index + 2].forEach((i) => {
    if (i >= 0 && i < chapters.length) {
      const img = new Image();
      img.src = chapters[i].image;
    }
  });
}

/* ---------- line reveal ---------- */
function revealNextLine() {
  const items = [...els.lines.children];
  if (state.lineIndex >= items.length) {
    finishReveal();
    return false;
  }
  items[state.lineIndex].classList.add('is-shown');
  state.lineIndex += 1;
  if (state.lineIndex >= items.length) finishReveal();
  return true;
}

function finishReveal() {
  state.fullyRevealed = true;
  state.revealing = false;
  els.btnReveal.textContent = state.index === chapters.length - 1 ? '故事读完了' : '再点可重读';
  els.btnNext.disabled = false;
  els.hint.classList.add('is-hidden');

  if (state.index === chapters.length - 1) {
    els.endNote.classList.add('is-show');
    setTimeout(() => els.endNote.classList.remove('is-show'), 3200);
  }
}

async function revealAllSequential() {
  if (state.revealing) return;
  if (state.fullyRevealed) {
    // 重读：收起再展开
    [...els.lines.children].forEach((li) => li.classList.remove('is-shown'));
    state.lineIndex = 0;
    state.fullyRevealed = false;
    els.btnNext.disabled = true;
    els.hint.classList.remove('is-hidden');
    els.hint.textContent = '重新展开中…';
  }

  state.revealing = true;
  els.btnReveal.disabled = true;
  els.btnReveal.textContent = '展开中…';
  els.hint.textContent = '…';

  while (state.lineIndex < chapters[state.index].lines.length) {
    revealNextLine();
    await wait(480);
  }
  els.btnReveal.disabled = false;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ---------- navigation ---------- */
function goTo(index) {
  if (index < 0 || index >= chapters.length) return;
  if (index === state.index && state.started) return;
  els.endNote.classList.remove('is-show');
  renderChapter(index);
}

function next() {
  if (!state.fullyRevealed) {
    // 未展开完：先继续展开一行 / 全部
    if (!state.revealing) revealAllSequential();
    return;
  }
  if (state.index < chapters.length - 1) goTo(state.index + 1);
}

function prev() {
  if (state.index > 0) goTo(state.index - 1);
}

/* ---------- lightbox ---------- */
function openLightbox() {
  const src = els.chapterImg.currentSrc || els.chapterImg.src;
  if (!src) return;
  els.lightboxImg.src = src;
  els.lightboxImg.alt = els.chapterImg.alt;
  els.lightbox.classList.add('is-open');
}
function closeLightbox() {
  els.lightbox.classList.remove('is-open');
}

/* ---------- events ---------- */
function bindEvents() {
  els.btnEnter.addEventListener('click', enterStory);
  els.btnReveal.addEventListener('click', () => revealAllSequential());
  els.btnNext.addEventListener('click', next);
  els.btnPrev.addEventListener('click', prev);
  els.frame.addEventListener('click', openLightbox);
  els.lightbox.addEventListener('click', closeLightbox);

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (!state.started) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        enterStory();
      }
      return;
    }
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!state.fullyRevealed) revealAllSequential();
      else next();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  });

  // 触摸：在面板空白处双击跳过（可选）
  let lastTap = 0;
  els.chapter.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTap < 280) {
      if (!state.fullyRevealed) revealAllSequential();
    }
    lastTap = now;
  });
}

/* ---------- boot ---------- */
function init() {
  spawnMotes();
  setupPrologue();
  buildProgress();
  bindEvents();

  // 预加载第一张
  const first = new Image();
  first.src = chapters[0].image;
}

init();
