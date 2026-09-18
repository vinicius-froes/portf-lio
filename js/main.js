(function () {
  "use strict";

  var root = document.documentElement;
  var THEME_KEY = "vf-theme";

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === "light" || saved === "dark") {
      applyTheme(saved);
      return;
    }
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(prefersDark ? "dark" : "light");
  }
  initTheme();

  var themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var current = root.getAttribute("data-theme");
      var next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    });
  }

  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("nav");
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("nav-lock", isOpen);
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-lock");
      });
    });
  }

  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  var sections = document.querySelectorAll("main section[id]");
  var navLinks = document.querySelectorAll(".nav a");
  if ("IntersectionObserver" in window && sections.length) {
    var navIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          var link = document.querySelector('.nav a[href="#' + id + '"]');
          if (!link) return;
          navLinks.forEach(function (l) { l.classList.remove("active"); });
          link.classList.add("active");
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach(function (s) { navIO.observe(s); });
  }

  var header = document.querySelector(".site-header");
  window.addEventListener(
    "scroll",
    function () {
      if (header) header.classList.toggle("scrolled", window.scrollY > 8);
    },
    { passive: true }
  );

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ---------- Work carousel ----------
  var carousel = document.getElementById("work-carousel");
  var prevBtn = document.getElementById("work-prev");
  var nextBtn = document.getElementById("work-next");
  var counterEl = document.getElementById("work-counter");

  if (carousel) {
    var slides = carousel.querySelectorAll(".work-slide");

    function pad(n) { return n < 10 ? "0" + n : String(n); }

    function slideStep() {
      var first = slides[0];
      if (!first) return carousel.clientWidth;
      var style = window.getComputedStyle(carousel);
      var gap = parseFloat(style.columnGap || style.gap || "0") || 0;
      return first.getBoundingClientRect().width + gap;
    }

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        carousel.scrollBy({ left: -slideStep(), behavior: "smooth" });
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        carousel.scrollBy({ left: slideStep(), behavior: "smooth" });
      });
    }

    if (counterEl && slides.length) {
      var total = slides.length;
      counterEl.textContent = pad(1) + " / " + pad(total);
      if ("IntersectionObserver" in window) {
        var slideIO = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;
              var idx = Array.prototype.indexOf.call(slides, entry.target) + 1;
              counterEl.textContent = pad(idx) + " / " + pad(total);
            });
          },
          { root: carousel, threshold: 0.6 }
        );
        slides.forEach(function (s) { slideIO.observe(s); });
      }
    }
  }
})();
