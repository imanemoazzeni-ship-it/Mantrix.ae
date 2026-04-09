document.documentElement.classList.add("reveal-ready");

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (!prefersReducedMotion) {
  const revealElements = document.querySelectorAll("[data-reveal]");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px",
    }
  );

  revealElements.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 6, 5) * 70}ms`;
    observer.observe(element);
  });
} else {
  document.querySelectorAll("[data-reveal]").forEach((element) => {
    element.classList.add("is-visible");
  });
}

document.querySelectorAll("[data-tilt-stage]").forEach((stage) => {
  if (prefersReducedMotion) {
    return;
  }

  const handleMove = (event) => {
    const bounds = stage.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const tiltY = (x - 0.5) * 10;
    const tiltX = (0.5 - y) * 8;

    stage.style.setProperty("--tilt-x", `${tiltX}deg`);
    stage.style.setProperty("--tilt-y", `${tiltY}deg`);
  };

  const resetTilt = () => {
    stage.style.setProperty("--tilt-x", "0deg");
    stage.style.setProperty("--tilt-y", "0deg");
  };

  stage.addEventListener("pointermove", handleMove);
  stage.addEventListener("pointerleave", resetTilt);
  stage.addEventListener("pointerup", resetTilt);
});

const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const formData = new FormData(contactForm);
    const submitMode = contactForm.dataset.submitMode || "api";
    const targetUrl = contactForm.getAttribute("action") || "/api/contact";

    if (String(formData.get("website") || formData.get("_honey") || "").trim()) {
      contactForm.reset();
      return;
    }

    submitButton.disabled = true;
    formStatus.className = "form-status";
    formStatus.textContent = "Sending your message securely...";

    try {
      let response;
      let data = {};

      if (submitMode === "formsubmit") {
        response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        });
      } else {
        const payload = {
          name: String(formData.get("name") || "").trim(),
          email: String(formData.get("email") || "").trim(),
          company: String(formData.get("company") || "").trim(),
          message: String(formData.get("message") || "").trim(),
          website: String(formData.get("website") || "").trim(),
        };

        response = await fetch(targetUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });
      }

      data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "We could not send the message right now.");
      }

      contactForm.reset();
      formStatus.className = "form-status is-success";
      formStatus.textContent = data.message || "Your inquiry has been sent. Redirecting...";

      window.setTimeout(() => {
        window.location.href = "thanks.html";
      }, 900);
    } catch (error) {
      formStatus.className = "form-status is-error";
      formStatus.textContent =
        error instanceof Error && error.message
          ? error.message
          : "We could not send the message right now. Please email info@mantrix.ae directly.";
    } finally {
      submitButton.disabled = false;
    }
  });
}
