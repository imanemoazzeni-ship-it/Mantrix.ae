(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  /* ---------- Scroll progress + sticky-header shadow ---------- */
  const progressBar = document.querySelector(".scroll-progress");
  const header = document.querySelector(".site-header");
  let ticking = false;

  function updateScrollState() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight =
      (document.documentElement.scrollHeight || document.body.scrollHeight) -
      window.innerHeight;
    const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0;

    if (progressBar) {
      progressBar.style.transform = "scaleX(" + progress + ")";
    }

    if (header) {
      if (scrollTop > 24) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    }

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(updateScrollState);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  updateScrollState();

  /* ---------- Reveal-on-scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if (!hasIO || reducedMotion) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    const revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- Counter animation ---------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const from = parseFloat(el.dataset.countFrom || "0");
    if (isNaN(target)) return;

    const duration = 1600;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = Math.round(from + (target - from) * eased);
      el.textContent = value.toLocaleString("en-US").replace(/,/g, "");
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target.toLocaleString("en-US").replace(/,/g, "");
      }
    }

    window.requestAnimationFrame(step);
  }

  const counterEls = document.querySelectorAll("[data-count]");

  if (!hasIO || reducedMotion) {
    counterEls.forEach(function (el) {
      el.textContent = el.dataset.count;
    });
  } else {
    const counterObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateCount(entry.target);
            counterObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    counterEls.forEach(function (el) {
      counterObserver.observe(el);
    });
  }

  /* ---------- Magnetic subtle hover on primary buttons ---------- */
  if (!reducedMotion && window.matchMedia("(hover: hover)").matches) {
    const magneticEls = document.querySelectorAll(".button");
    magneticEls.forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform =
          "translate(" + x * 0.08 + "px, " + (y * 0.08 - 3) + "px)";
      });
      btn.addEventListener("mouseleave", function () {
        btn.style.transform = "";
      });
    });
  }
})();
