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

  // ---------- Work — 3D ring carousel ----------
  var stage = document.getElementById("work-stage");
  var ring = document.getElementById("work-ring");
  var prevBtn = document.getElementById("work-prev");
  var nextBtn = document.getElementById("work-next");
  var counterEl = document.getElementById("work-counter");
  var titleEl = document.getElementById("work-current-title");

  if (stage && ring) {
    var items = Array.prototype.slice.call(ring.querySelectorAll(".ring-item"));
    var n = items.length;

    if (n > 0) {
      var step = 360 / n;
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var radius = 380;
      var angle = 0; // ring's own rotateY, in degrees
      var mode = "auto"; // "auto" | "tween" — tween owns the angle while active
      var paused = false; // true while hovering (auto-rotate pauses, tween is unaffected)
      var dragging = false;
      var autoSpeed = reduceMotion ? 0 : 5.5; // degrees per second
      var lastTs = null;
      var resumeTimer = null;

      function pad(num) { return num < 10 ? "0" + num : String(num); }

      function layout() {
        var w = stage.clientWidth || 900;
        radius = Math.max(220, Math.min(480, Math.round(w * 0.62)));
        items.forEach(function (item, i) {
          item.style.transform = "rotateY(" + (i * step) + "deg) translateZ(" + radius + "px)";
        });
      }

      function currentIndex() {
        var normalized = ((-angle % 360) + 360) % 360;
        return Math.round(normalized / step) % n;
      }

      function updateCaption() {
        var idx = currentIndex();
        var item = items[idx];
        if (counterEl) counterEl.textContent = pad(idx + 1) + " / " + pad(n);
        if (titleEl && item) {
          var title = item.getAttribute("data-title") || "";
          var tag = item.getAttribute("data-tag") || "";
          titleEl.textContent = tag ? title + " — " + tag : title;
        }
      }

      function render() {
        ring.style.transform = "translateZ(-" + radius + "px) rotateY(" + angle + "deg)";
      }

      function scheduleResume() {
        if (resumeTimer) clearTimeout(resumeTimer);
        resumeTimer = setTimeout(function () {
          mode = "auto";
          paused = false;
          lastTs = null;
        }, 1800);
      }

      function tweenTo(target, duration) {
        mode = "tween";
        var start = angle;
        var delta = target - start;
        var startTs = null;
        function step(ts) {
          if (mode !== "tween") return;
          if (!startTs) startTs = ts;
          var t = Math.min(1, (ts - startTs) / duration);
          var eased = 1 - Math.pow(1 - t, 3);
          angle = start + delta * eased;
          render();
          updateCaption();
          if (t < 1) {
            requestAnimationFrame(step);
          } else {
            scheduleResume();
          }
        }
        requestAnimationFrame(step);
      }

      function tick(ts) {
        if (mode === "auto" && !paused && !dragging) {
          if (lastTs !== null) {
            var dt = (ts - lastTs) / 1000;
            angle -= autoSpeed * dt;
            render();
            updateCaption();
          }
          lastTs = ts;
        } else {
          lastTs = null;
        }
        requestAnimationFrame(tick);
      }

      layout();
      render();
      updateCaption();
      window.addEventListener("resize", layout);
      requestAnimationFrame(tick);

      if (prevBtn) {
        prevBtn.addEventListener("click", function () {
          var target = Math.round(angle / step) * step + step;
          tweenTo(target, 500);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener("click", function () {
          var target = Math.round(angle / step) * step - step;
          tweenTo(target, 500);
        });
      }

      // Drag / swipe to spin
      var dragStartX = 0;
      var dragStartAngle = 0;

      function pointerDown(e) {
        dragging = true;
        mode = "auto";
        if (resumeTimer) clearTimeout(resumeTimer);
        stage.classList.add("dragging");
        dragStartX = e.clientX;
        dragStartAngle = angle;
        if (stage.setPointerCapture && e.pointerId !== undefined) {
          try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        }
      }
      function pointerMove(e) {
        if (!dragging) return;
        var dx = e.clientX - dragStartX;
        angle = dragStartAngle + dx * 0.35;
        render();
        updateCaption();
      }
      function pointerUp() {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove("dragging");
        scheduleResume();
      }

      stage.addEventListener("pointerdown", pointerDown);
      window.addEventListener("pointermove", pointerMove);
      window.addEventListener("pointerup", pointerUp);
      window.addEventListener("pointercancel", pointerUp);

      stage.addEventListener("mouseenter", function () { paused = true; });
      stage.addEventListener("mouseleave", function () {
        if (!dragging) scheduleResume();
      });
    }
  }
})();
