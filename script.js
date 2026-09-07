(function () {
  "use strict";

  const root = document.documentElement;
  const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const header = document.querySelector(".site-header");
  const progress = document.querySelector(".scroll-progress");
  const hero = document.querySelector(".landing-hero");
  const toggle = document.querySelector(".motion-toggle");
  const revealElements = document.querySelectorAll(".reveal");
  let paused = motionPreference.matches;
  let ticking = false;

  try { paused = paused || sessionStorage.getItem("mantrix-motion") === "paused"; } catch (_) {}
  root.classList.add("js");

  function applyMotionPreference() {
    root.classList.toggle("motion-paused", paused);
    if (toggle) {
      toggle.hidden = motionPreference.matches;
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.querySelector(".motion-label").textContent = paused ? "Resume motion" : "Pause motion";
    }
    if (paused) {
      revealElements.forEach(function (element) { element.classList.add("is-visible"); });
      document.querySelectorAll("[data-count]").forEach(function (element) {
        element.textContent = element.dataset.count;
      });
      if (hero) {
        hero.style.removeProperty("--hero-x");
        hero.style.removeProperty("--hero-y");
      }
      document.querySelectorAll("[data-depth]").forEach(function (element) {
        element.style.removeProperty("--depth-x");
        element.style.removeProperty("--depth-y");
      });
    }
  }
  applyMotionPreference();

  if (toggle) {
    toggle.addEventListener("click", function () {
      paused = !paused;
      applyMotionPreference();
      try { sessionStorage.setItem("mantrix-motion", paused ? "paused" : "playing"); } catch (_) {}
    });
  }
  motionPreference.addEventListener("change", function (event) {
    paused = event.matches;
    try { paused = paused || sessionStorage.getItem("mantrix-motion") === "paused"; } catch (_) {}
    applyMotionPreference();
  });

  const menu = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".nav-shell");
  if (menu && nav) {
    function closeMenu(returnFocus) {
      menu.setAttribute("aria-expanded", "false");
      nav.classList.remove("menu-open");
      if (returnFocus) menu.focus();
    }
    menu.addEventListener("click", function () {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("menu-open", open);
    });
    nav.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () { closeMenu(false); });
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && nav.classList.contains("menu-open")) closeMenu(true);
    });
    document.addEventListener("click", function (event) {
      if (!nav.contains(event.target)) closeMenu(false);
    });
    window.matchMedia("(min-width: 801px)").addEventListener("change", function () {
      closeMenu(false);
    });
  }

  function updateScroll() {
    const distance = root.scrollHeight - window.innerHeight;
    const fraction = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
    if (progress) progress.style.transform = "scaleX(" + fraction + ")";
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 20);
    ticking = false;
  }
  function requestScrollUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(updateScroll);
    }
  }
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateScroll();

  if ("IntersectionObserver" in window && !paused) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach(function (element) { revealObserver.observe(element); });
  } else {
    revealElements.forEach(function (element) { element.classList.add("is-visible"); });
  }

  function countUp(element) {
    const target = Number(element.dataset.count);
    const from = Number(element.dataset.countFrom || 0);
    if (!Number.isFinite(target) || paused) return;
    const start = performance.now();
    function frame(now) {
      if (paused) { element.textContent = String(target); return; }
      const fraction = Math.min((now - start) / 1500, 1);
      element.textContent = String(Math.round(from + (target - from) * (1 - Math.pow(1 - fraction, 3))));
      if (fraction < 1) window.requestAnimationFrame(frame);
    }
    window.requestAnimationFrame(frame);
  }
  if ("IntersectionObserver" in window && !paused) {
    const countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          countUp(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: .6 });
    document.querySelectorAll("[data-count]").forEach(function (element) { countObserver.observe(element); });
  }

  document.querySelectorAll(".marquee-track").forEach(function (track) {
    Array.from(track.children).forEach(function (item) {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  });

  // Suspend ambient loops outside the viewport to reduce background rendering.
  if ("IntersectionObserver" in window) {
    const ambientObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle("is-offscreen", !entry.isIntersecting);
      });
    });
    document.querySelectorAll(".landing-hero, .marquee, .closing-section").forEach(function (element) {
      ambientObserver.observe(element);
    });
  }

  function addDepth(element, prefix, travel) {
    let frameId = 0;
    element.addEventListener("pointermove", function (event) {
      if (paused || !finePointer.matches) return;
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(function () {
        if (paused) return;
        const box = element.getBoundingClientRect();
        element.style.setProperty(prefix + "-x", ((event.clientX - box.left) / box.width - .5) * travel + "px");
        element.style.setProperty(prefix + "-y", ((event.clientY - box.top) / box.height - .5) * travel + "px");
      });
    });
    element.addEventListener("pointerleave", function () {
      cancelAnimationFrame(frameId);
      element.style.removeProperty(prefix + "-x");
      element.style.removeProperty(prefix + "-y");
    });
  }
  if (hero) addDepth(hero, "--hero", 18);
  document.querySelectorAll("[data-depth]").forEach(function (element) { addDepth(element, "--depth", 12); });
})();
