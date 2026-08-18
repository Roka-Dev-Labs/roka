/**
 * Back-link helper: clicks on `.roka-back` call history.back(),
 * falling back to the host href (or "/").
 */
(function () {
  var style = document.createElement("style");
  style.textContent =
    '[data-back-hijacker="active"]{position:absolute;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none;z-index:-1;background:transparent}' +
    ".roka-back{position:relative;cursor:pointer}";
  document.head.appendChild(style);

  function goBack(fallback) {
    if (window.history && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = fallback || "/";
  }

  function hostForMarker(marker) {
    return (
      marker.closest("[data-back-host]") ||
      marker.closest("a.roka-back, button.roka-back") ||
      marker.parentElement
    );
  }

  document.addEventListener(
    "click",
    function (event) {
      var markers = document.querySelectorAll('[data-back-hijacker="active"]');
      if (!markers.length) return;

      var clickTarget = event.target;
      for (var i = 0; i < markers.length; i++) {
        var host = hostForMarker(markers[i]);
        if (!host) continue;
        if (host === clickTarget || host.contains(clickTarget)) {
          event.preventDefault();
          event.stopPropagation();
          if (typeof event.stopImmediatePropagation === "function") {
            event.stopImmediatePropagation();
          }
          var fallback =
            host.getAttribute("data-back-fallback") ||
            host.getAttribute("href") ||
            "/";
          setTimeout(function () {
            goBack(fallback);
          }, 10);
          return;
        }
      }
    },
    true
  );
})();
