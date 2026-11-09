(function () {
    try {
        var t = localStorage.getItem("roka-theme") || localStorage.getItem("theme") || "dark";
        if (t !== "light") t = "dark";
        var html = document.documentElement;
        html.setAttribute("data-theme", t);
        html.classList.toggle("dark", t === "dark");
        html.classList.toggle("light", t === "light");
        html.style.colorScheme = t;
    } catch (e) {}
})();
