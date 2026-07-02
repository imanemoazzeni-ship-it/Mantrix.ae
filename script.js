(function () {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;
  document.documentElement.classList.add("js");

  window.requestAnimationFrame(function () {
    document.body.classList.add("is-ready");
  });

  /* ---------- Scroll progress + sticky-header shadow ---------- */
  const progressBar = document.querySelector(".scroll-progress");
  const header = document.querySelector(".site-header");
  const motionMediaEls = reducedMotion
    ? []
    : document.querySelectorAll(
        ".photo-card img, .page-hero-image img, .feature-image img, .gallery-card img"
      );
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

    if (motionMediaEls.length) {
      motionMediaEls.forEach(function (img) {
        const rect = img.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const distance = (center - window.innerHeight / 2) / window.innerHeight;
        const offset = Math.max(Math.min(distance * -22, 18), -18);
        img.style.setProperty("--media-y", offset.toFixed(2) + "px");
      });
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

  /* ---------- 3D tilt on swatches and bento cells ---------- */
  if (!reducedMotion && window.matchMedia("(hover: hover)").matches) {
    const tiltEls = document.querySelectorAll(".swatch, .bento-cell");
    tiltEls.forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const rotateY = (x - 0.5) * 14;
        const rotateX = (0.5 - y) * 14;
        if (el.classList.contains("swatch")) {
          el.style.transform =
            "perspective(1200px) rotateX(" + rotateX + "deg) rotateY(" +
            rotateY + "deg) translateY(-10px) scale(1.02)";
        } else {
          el.style.transform =
            "perspective(1200px) rotateX(" + (rotateX * 0.5) + "deg) rotateY(" +
            (rotateY * 0.5) + "deg) translateY(-8px)";
        }
      });
      el.addEventListener("mouseleave", function () {
        el.style.transform = "";
      });
    });
  }

  /* ---------- Marquee duplicate for seamless loop ---------- */
  const marqueeTracks = document.querySelectorAll(".marquee-track");
  marqueeTracks.forEach(function (track) {
    const items = track.innerHTML;
    track.innerHTML = items + items;
  });

  /* ---------- Parallax on [data-parallax] ---------- */
  if (!reducedMotion) {
    const parallaxEls = document.querySelectorAll("[data-parallax]");
    if (parallaxEls.length) {
      function updateParallax() {
        parallaxEls.forEach(function (el) {
          const rect = el.getBoundingClientRect();
          const speed = parseFloat(el.dataset.parallax) || 0.2;
          const offset = (rect.top + rect.height / 2 - window.innerHeight / 2) * speed;
          el.style.transform = "translate3d(0, " + offset + "px, 0)";
        });
      }
      window.addEventListener("scroll", function () {
        window.requestAnimationFrame(updateParallax);
      }, { passive: true });
      updateParallax();
    }
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

  /* ---------- Pointer spotlight on cards ---------- */
  if (!reducedMotion && window.matchMedia("(hover: hover)").matches) {
    const spotlightEls = document.querySelectorAll(
      ".info-card, .metric-card, .contact-panel, .detail-card, .cta-panel, .garment-row"
    );
    spotlightEls.forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        const rect = el.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        el.style.setProperty("--spotlight-x", x.toFixed(1) + "%");
        el.style.setProperty("--spotlight-y", y.toFixed(1) + "%");
      });
    });
  }

  /* ---------- Button ripple for tactile clicks ---------- */
  if (!reducedMotion) {
    document.querySelectorAll(".button").forEach(function (btn) {
      btn.addEventListener("click", function (event) {
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.className = "button-ripple";
        ripple.style.width = size + "px";
        ripple.style.height = size + "px";
        ripple.style.left = event.clientX - rect.left - size / 2 + "px";
        ripple.style.top = event.clientY - rect.top - size / 2 + "px";
        btn.appendChild(ripple);
        window.setTimeout(function () {
          ripple.remove();
        }, 720);
      });
    });
  }
})();
