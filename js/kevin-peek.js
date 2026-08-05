/**
 * Kevin peek-a-boo — peeks from the bottom-right corner.
 * Hover to let him rise a bit higher.
 */
(function () {
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 640px)').matches) return;

    var style = document.createElement('style');
    style.textContent = [
      '.kevin-peek{',
      '  position:fixed;',
      '  right:max(12px, env(safe-area-inset-right));',
      '  bottom:0;',
      '  z-index:40;',
      '  width:118px;',
      '  height:78px;',
      '  overflow:hidden;',
      '  line-height:0;',
      '  cursor:pointer;',
      '  border:0;',
      '  padding:0;',
      '  background:transparent;',
      '  transform-origin:bottom center;',
      '  transition:height .4s cubic-bezier(.34,1.4,.64,1), filter .3s ease;',
      '  filter:drop-shadow(0 2px 10px rgba(0,0,0,.28));',
      '  -webkit-tap-highlight-color:transparent;',
      '}',
      '.kevin-peek:hover,.kevin-peek:focus-visible{',
      '  height:188px;',
      '  outline:none;',
      '  filter:drop-shadow(0 4px 16px rgba(0,0,0,.35));',
      '}',
      '.kevin-peek img{',
      '  width:118px;',
      '  height:auto;',
      '  display:block;',
      '  pointer-events:none;',
      '  user-select:none;',
      '  /* Keep head/shoulders in the peek window */',
      '  transform:translateY(-2px);',
      '}',
      '@media (max-width:900px){',
      '  .kevin-peek{ width:96px; height:64px; right:8px; }',
      '  .kevin-peek:hover,.kevin-peek:focus-visible{ height:152px; }',
      '  .kevin-peek img{ width:96px; }',
      '}',
      '@media print{ .kevin-peek{ display:none !important; } }',
    ].join('');
    document.head.appendChild(style);

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'kevin-peek';
    btn.setAttribute('aria-label', 'Prune your logs with Roka');
    btn.title = 'Prune your logs with Roka :3';

    var img = document.createElement('img');
    img.src = '/kevin-peek.png';
    img.alt = '';
    img.width = 118;
    img.height = 146;
    img.decoding = 'async';
    img.loading = 'lazy';
    btn.appendChild(img);

    btn.addEventListener('click', function () {
      console.log('%cPrune your logs with Roka :3', 'color:#34d399;font-family:monospace;font-size:14px;font-weight:600');
    });

    function mount() {
      document.body.appendChild(btn);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount);
    } else {
      mount();
    }
  } catch (_) {
    /* non-critical easter egg */
  }
})();
