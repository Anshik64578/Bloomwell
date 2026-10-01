import { useEffect } from 'react';

const BITS = ['🍃', '🌿', '🍀', '💗', '✨', '🌸', '🍓'];
const WORDS = ['Nice!', 'Breathe', 'Lovely', 'Well done', 'Take it easy', 'You got this'];
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function layer() {
  let el = document.querySelector('.fx-layer');
  if (!el) {
    el = document.createElement('div');
    el.className = 'fx-layer';
    el.setAttribute('aria-hidden', 'true');
    document.body.appendChild(el);
  }
  return el;
}

function spawn(x, y) {
  const root = layer();
  if (root.childElementCount > 60) return; // keep fast clicking cheap

  for (let i = 0; i < 7; i++) {
    const b = document.createElement('span');
    b.className = 'fx';
    b.textContent = pick(BITS);
    b.style.left = `${x}px`;
    b.style.top = `${y}px`;
    b.style.setProperty('--dx', `${rand(-70, 70)}px`);
    b.style.setProperty('--dy', `${rand(50, 120)}px`);
    b.style.setProperty('--dr', `${rand(-40, 40)}deg`);
    b.style.animationDelay = `${rand(0, 0.12)}s`;
    b.addEventListener('animationend', () => b.remove());
    root.appendChild(b);
  }

  const w = document.createElement('span');
  w.className = 'fx-word';
  w.textContent = pick(WORDS);
  w.style.left = `${x}px`;
  w.style.top = `${y}px`;
  w.addEventListener('animationend', () => w.remove());
  root.appendChild(w);
}

export default function ClickEffect() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onClick = (e) => {
      if (reduce.matches) return;
      if (e.target.closest('input, textarea, select')) return; // no effect while typing
      spawn(e.clientX, e.clientY);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
