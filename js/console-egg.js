/**
 * Console easter egg — Kevin says hi.
 * Open DevTools → Console to see it.
 */
(function () {
  try {
    var url = new URL('/kevin.png', window.location.origin).href;
    var width = 220;
    var height = Math.round(width * (618 / 500));

    console.log(
      '%c ',
      [
        'font-size: 1px;',
        'line-height: ' + height + 'px;',
        'padding: ' + Math.floor(height / 2) + 'px ' + Math.floor(width / 2) + 'px;',
        'background-image: url(' + JSON.stringify(url) + ');',
        'background-size: ' + width + 'px ' + height + 'px;',
        'background-repeat: no-repeat;',
        'background-position: center;',
        'color: transparent;',
      ].join(' ')
    );

    console.log(
      '%cPrune your logs with Roka :3',
      [
        'color: #34d399;',
        'font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;',
        'font-size: 14px;',
        'font-weight: 600;',
        'padding: 6px 0;',
      ].join(' ')
    );
  } catch (_) {
    /* ignore — console styling isn't critical */
  }
})();
