document.body.classList.add("is-loading");

const ready = () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  const header = document.querySelector("[data-header]");
  const cursorLight = document.querySelector(".cursor-light");
  const progressBar = document.querySelector(".scroll-progress span");
  const menuToggle = document.querySelector(".menu-toggle");
  const revealItems = document.querySelectorAll(".reveal");
  const counters = document.querySelectorAll("[data-count]");
  const navLinks = document.querySelectorAll(".nav a");
  const sections = [...navLinks]
    .filter((link) => link.getAttribute("href")?.startsWith("#"))
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  window.setTimeout(() => document.body.classList.remove("is-loading"), 620);

  const onScroll = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 40);

    if (progressBar) {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
    }

    const active = sections
      .slice()
      .reverse()
      .find((section) => section.getBoundingClientRect().top < 170);

    navLinks.forEach((link) => {
      link.classList.toggle("is-active", active && link.getAttribute("href") === `#${active.id}`);
    });
  };

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  menuToggle?.addEventListener("click", () => {
    const isOpen = header.classList.toggle("is-menu-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Zamknij menu" : "Otworz menu");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      header?.classList.remove("is-menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
      menuToggle?.setAttribute("aria-label", "Otworz menu");
    });
  });

  window.addEventListener(
    "pointermove",
    (event) => {
      if (!cursorLight) return;
      cursorLight.style.opacity = "1";
      cursorLight.style.transform = `translate(${event.clientX - 180}px, ${event.clientY - 180}px)`;

      document.querySelectorAll("[data-depth]").forEach((item) => {
        const depth = Number(item.dataset.depth || 0);
        const x = (event.clientX / window.innerWidth - 0.5) * 34 * depth;
        const y = (event.clientY / window.innerHeight - 0.5) * 34 * depth;
        item.style.translate = `${x}px ${y}px`;
      });
    },
    { passive: true }
  );

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
  );

  revealItems.forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
    revealObserver.observe(item);
  });

  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const target = Number(entry.target.dataset.count);
        const duration = 1300;
        const start = performance.now();

        const tick = (time) => {
          const progress = Math.min((time - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4);
          entry.target.textContent = Math.round(target * eased);

          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
        counterObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.45 }
  );

  counters.forEach((counter) => counterObserver.observe(counter));

  document.querySelectorAll(".tilt-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const rotateX = ((y / rect.height - 0.5) * -10).toFixed(2);
      const rotateY = ((x / rect.width - 0.5) * 12).toFixed(2);
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "perspective(800px) rotateX(0deg) rotateY(0deg)";
    });
  });

  document.querySelectorAll(".magnetic").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.2;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.28;
      button.style.transform = `translate(${x}px, ${y}px)`;
    });

    button.addEventListener("pointerleave", () => {
      button.style.transform = "";
    });
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;

      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");

      document.querySelectorAll(".portfolio-item").forEach((item) => {
        item.classList.toggle("is-hidden", filter !== "all" && item.dataset.category !== filter);
      });
    });
  });

  const serviceCopy = {
    print: {
      title: "Materiały do druku",
      text: "Wizytówki, ulotki, plakaty i bannery gotowe pod produkcję, z mocnym komunikatem i czystym eksportem.",
      accent: "#6a0dad",
    },
    social: {
      title: "Grafiki social media",
      text: "Posty, relacje, reklamy i serie formatów, które wyglądają spójnie w feedzie, stories i kampaniach.",
      accent: "#2777fc",
    },
    brand: {
      title: "Identyfikacja marki",
      text: "Logo, kolory, typografia i system wizualny, który pozwala marce wyglądać pewnie w każdym punkcie kontaktu.",
      accent: "#070707",
    },
  };

  document.querySelectorAll("[data-service-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const preview = document.querySelector("[data-service-preview]");
      const data = serviceCopy[button.dataset.serviceTab];
      if (!preview || !data) return;

      document.querySelectorAll("[data-service-tab]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      preview.querySelector("h3").textContent = data.title;
      preview.querySelector("p").textContent = data.text;
      preview.style.setProperty("--service-accent", data.accent);
      preview.animate(
        [
          { transform: "translateY(10px)", opacity: 0.5 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 320, easing: "cubic-bezier(.19,1,.22,1)" }
      );
    });
  });

  document.querySelectorAll("[data-compare]").forEach((input) => {
    const stage = input.closest(".compare")?.querySelector(".compare__stage");
    const setCompare = () => stage?.style.setProperty("--compare", `${input.value}%`);
    input.addEventListener("input", setCompare);
    setCompare();
  });

  document.querySelectorAll(".faq-item button").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  document.querySelectorAll("[data-brief]").forEach((button) => {
    button.addEventListener("click", () => {
      const textarea = document.querySelector(".contact-form textarea");
      document.querySelectorAll("[data-brief]").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");

      if (textarea && !textarea.value.trim()) {
        textarea.value = `${button.dataset.brief}\nTermin: \nFormaty / kanały: \nDodatkowe informacje: `;
      }

      textarea?.focus();
    });
  });

  initBannerConfigurator();
  initBannerCatalog();
  initBannerAdmin();

  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = lightbox?.querySelector("img");
  const lightboxCaption = lightbox?.querySelector("p");
  const lightboxClose = lightbox?.querySelector(".lightbox__close");

  const closeLightbox = () => {
    lightbox?.classList.remove("is-open");
    lightbox?.setAttribute("aria-hidden", "true");
  };

  document.querySelectorAll(".portfolio-open").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".portfolio-item");
      const image = item?.querySelector("img");
      const title = item?.querySelector("h3")?.textContent.trim() || "Realizacja Markedia";

      if (!lightbox || !lightboxImage || !image) return;

      lightboxImage.src = image.currentSrc || image.src;
      lightboxImage.alt = image.alt;
      if (lightboxCaption) lightboxCaption.textContent = title;
      lightbox.classList.add("is-open");
      lightbox.setAttribute("aria-hidden", "false");
      lightboxClose?.focus();
    });
  });

  lightboxClose?.addEventListener("click", closeLightbox);
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeLightbox();
      header?.classList.remove("is-menu-open");
      menuToggle?.setAttribute("aria-expanded", "false");
    }
  });

  initMotionField();
};

function initBannerConfigurator() {
  const form = document.querySelector("[data-order-form]");
  const previews = document.querySelectorAll("[data-banner-preview]");
  const summary = document.querySelector("[data-banner-summary]");
  const selectedBannerInput = document.querySelector("[data-selected-banner]");
  const formatButtons = document.querySelectorAll("[data-banner-format]");
  const templateButtons = document.querySelectorAll("[data-template]");
  const customSize = document.querySelector("[data-custom-size]");
  const customWidth = document.querySelector("[data-custom-width]");
  const customHeight = document.querySelector("[data-custom-height]");
  const orderStatus = document.querySelector("[data-order-status]");
  const orderSelectionTitle = document.querySelector("[data-selected-template-title]");
  const orderSelectionMeta = document.querySelector("[data-selected-template-meta]");
  const orderRecaps = document.querySelectorAll("[data-order-recap]");
  const orderFlow = document.querySelectorAll(".order-flow span");
  const previewFields = {
    title: document.querySelectorAll("[data-preview-title]"),
    subtitle: document.querySelectorAll("[data-preview-subtitle]"),
    size: document.querySelectorAll("[data-preview-size]"),
  };

  if (!previews.length || !summary) return;

  const setPreviewText = (nodes, value) => {
    nodes.forEach((node) => {
      node.textContent = value;
    });
  };

  const templateCopy = {
    promo: {
      title: "SPRZEDAM",
      subtitle: "600 265 203",
      theme: "sale",
    },
    premium: {
      title: "Usługa premium",
      subtitle: "Elegancki baner dla marki, która chce wyglądać pewnie i profesjonalnie.",
      theme: "premium",
    },
    event: {
      title: "Noc pełna emocji",
      subtitle: "Zapowiedź wydarzenia, koncertu, premiery albo otwarcia lokalu.",
      theme: "event",
    },
    local: {
      title: "Tu działa Twoja firma",
      subtitle: "Czytelny baner dla lokalnego biznesu, sklepu lub punktu usługowego.",
      theme: "local",
    },
    minimal: {
      title: "Mniej słów. Więcej efektu.",
      subtitle: "Minimalny układ z dużym kontrastem i jednym mocnym komunikatem.",
      theme: "minimal",
    },
    recruit: {
      title: "Dołącz do zespołu",
      subtitle: "Baner rekrutacyjny, który brzmi konkretnie i wygląda nowocześnie.",
      theme: "recruit",
    },
  };

  const inputs = {
    title: document.querySelector('[data-preview-input="title"]'),
    subtitle: document.querySelector('[data-preview-input="subtitle"]'),
  };
  const orderInputs = {
    contact: document.querySelector('[data-order-input="contact"]'),
    email: document.querySelector('[data-order-input="email"]'),
    quantity: document.querySelector('[data-order-input="quantity"]'),
    deadline: document.querySelector('[data-order-input="deadline"]'),
    notes: document.querySelector('[data-order-input="notes"]'),
  };

  let selectedBannerLabel = selectedBannerInput?.value || "Startowy baner SPRZEDAM";

  const getSelectedTemplate = () => document.querySelector("[data-template].is-active strong")?.textContent.trim() || "Sprzedam";

  const getSelectedFormat = () => {
    const active = document.querySelector("[data-banner-format].is-active")?.dataset.bannerFormat || "200 x 100 cm";
    if (active !== "własny wymiar") return active;

    const width = customWidth?.value.trim();
    const height = customHeight?.value.trim();
    return width && height ? `${width} x ${height} cm` : "własny wymiar";
  };

  const setOrderStatus = (message = "", type = "") => {
    if (!orderStatus) return;
    orderStatus.textContent = message;
    orderStatus.classList.toggle("is-ok", type === "ok");
    orderStatus.classList.toggle("is-error", type === "error");
  };

  const setRecap = (name, value) => {
    orderRecaps.forEach((node) => {
      if (node.dataset.orderRecap === name) node.textContent = value;
    });
  };

  const updateOrderProgress = () => {
    const hasContact = Boolean(orderInputs.contact?.value.trim());
    const hasPhone = Boolean(inputs.subtitle?.value.trim());
    const activeStep = hasContact && hasPhone ? 2 : hasContact || hasPhone ? 1 : 0;

    orderFlow.forEach((step, index) => {
      step.classList.toggle("is-active", index <= activeStep);
    });
  };

  const updateSummary = () => {
    const selectedTemplate = getSelectedTemplate();
    const selectedFormat = getSelectedFormat();
    const summaryRows = [
      `Szablon: ${selectedTemplate}`,
      `Wybrany wzór: ${selectedBannerLabel}`,
      `Format: ${selectedFormat}`,
      "Materiał: trwały baner hard solvent",
      "Wykończenie: zgrzewane krawędzie, oczka co 50 cm",
      `Hasło: ${inputs.title?.value || ""}`,
      `Telefon: ${inputs.subtitle?.value || ""}`,
      `Kontakt: ${orderInputs.contact?.value || ""}`,
      `Email: ${orderInputs.email?.value || ""}`,
      `Ilość: ${orderInputs.quantity?.value || "1"}`,
      `Termin: ${orderInputs.deadline?.value || "Standardowy"}`,
      `Uwagi: ${orderInputs.notes?.value || ""}`,
    ];

    summary.value = summaryRows.join("\n");
    setRecap("template", selectedBannerLabel);
    setRecap("format", selectedFormat);
    setRecap("contact", orderInputs.contact?.value ? `${orderInputs.contact.value}${inputs.subtitle?.value ? ` / ${inputs.subtitle.value}` : ""}` : "Uzupełnij kontakt");
    setRecap("deadline", `${orderInputs.deadline?.value || "Standardowy"} / ${orderInputs.quantity?.value || "1"} szt.`);
    if (orderSelectionTitle) orderSelectionTitle.textContent = selectedBannerLabel;
    if (orderSelectionMeta) {
      orderSelectionMeta.textContent = `${selectedFormat} / hard solvent / zgrzew + oczka co 50 cm`;
    }
    updateOrderProgress();
  };

  const updatePreview = () => {
    setPreviewText(previewFields.title, inputs.title?.value || "SPRZEDAM");
    setPreviewText(previewFields.subtitle, inputs.subtitle?.value || "600 265 203");
    updateSummary();
  };

  Object.values(inputs).forEach((input) => {
    input?.addEventListener("input", updatePreview);
  });

  Object.values(orderInputs).forEach((input) => {
    input?.addEventListener("input", updateSummary);
    input?.addEventListener("change", updateSummary);
  });

  [customWidth, customHeight].forEach((input) => {
    input?.addEventListener("input", () => {
      setPreviewText(previewFields.size, getSelectedFormat());
      updateSummary();
    });
  });

  templateButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const template = button.dataset.template;
      const copy = templateCopy[template];
      if (!copy) return;

      templateButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      previews.forEach((preview) => {
        preview.dataset.theme = copy.theme || template;
      });

      if (inputs.title) inputs.title.value = copy.title;
      if (inputs.subtitle) inputs.subtitle.value = copy.subtitle;
      updatePreview();

      previews.forEach((preview) => {
        preview.animate(
          [
            { transform: "scale(0.97) rotate(-0.6deg)", filter: "saturate(0.8)" },
            { transform: "scale(1) rotate(0deg)", filter: "saturate(1)" },
          ],
          { duration: 360, easing: "cubic-bezier(.19,1,.22,1)" }
        );
      });
    });
  });

  formatButtons.forEach((button) => {
    button.addEventListener("click", () => {
      formatButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      const isCustom = button.dataset.bannerFormat === "własny wymiar";
      if (customSize) customSize.hidden = !isCustom;
      setPreviewText(previewFields.size, getSelectedFormat());
      updateSummary();
    });
  });

  document.addEventListener("banner:selected", (event) => {
    const banner = event.detail || {};

    if (selectedBannerInput) {
      selectedBannerInput.value = [banner.title, banner.category].filter(Boolean).join(" / ");
    }
    selectedBannerLabel = [banner.title, banner.category].filter(Boolean).join(" / ") || "Startowy baner SPRZEDAM";

    if (inputs.title && banner.title) {
      inputs.title.value = banner.title.toUpperCase();
    }

    const matchedFormat = [...formatButtons].find((button) => button.dataset.bannerFormat === banner.format);
    if (matchedFormat) {
      formatButtons.forEach((item) => item.classList.remove("is-active"));
      matchedFormat.classList.add("is-active");
      setPreviewText(previewFields.size, matchedFormat.dataset.bannerFormat);
    }

    updatePreview();
    document.querySelector("#zamowienie")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) return;

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setOrderStatus("Zapisuję zamówienie...");
    updateSummary();

    try {
      const payload = {
        selectedBanner: selectedBannerLabel,
        template: getSelectedTemplate(),
        format: getSelectedFormat(),
        title: inputs.title?.value,
        phone: inputs.subtitle?.value,
        contact: orderInputs.contact?.value,
        email: orderInputs.email?.value,
        quantity: orderInputs.quantity?.value,
        deadline: orderInputs.deadline?.value,
        notes: orderInputs.notes?.value,
        brief: summary.value,
      };

      const result = await requestJson("/api/banner-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      setOrderStatus(`Zamówienie ${result.order.id} zapisane. Oddzwonimy z wyceną.`, "ok");
    } catch (error) {
      setOrderStatus(`${error.message} Jeśli coś blokuje zapis, wyślij brief mailowo.`, "error");
    } finally {
      submitButton.disabled = false;
    }
  });

  previews.forEach((preview) => {
    preview.dataset.theme = "sale";
  });
  updatePreview();
}

const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });

async function requestJson(url, options = {}) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "Nie udało się wykonać operacji.");
  }

  return data;
}

function initBannerCatalog() {
  const filters = document.querySelector("[data-catalog-filters]");
  const grid = document.querySelector("[data-catalog-grid]");
  const empty = document.querySelector("[data-catalog-empty]");

  if (!filters || !grid) return;

  let catalog = { categories: [], banners: [] };
  let activeCategory = "all";

  const renderFilters = () => {
    const categories = ["all", ...catalog.categories];
    filters.innerHTML = categories
      .map((category) => {
        const label = category === "all" ? "Wszystkie" : category;
        return `<button class="${category === activeCategory ? "is-active" : ""}" type="button" data-catalog-category="${escapeHTML(category)}">${escapeHTML(label)}</button>`;
      })
      .join("");

    filters.querySelectorAll("[data-catalog-category]").forEach((button) => {
      button.addEventListener("click", () => {
        activeCategory = button.dataset.catalogCategory;
        renderFilters();
        renderCards();
      });
    });
  };

  const renderCards = () => {
    const banners = catalog.banners.filter((banner) => banner.isActive !== false);
    const filtered = activeCategory === "all" ? banners : banners.filter((banner) => banner.category === activeCategory);

    empty?.classList.toggle("is-visible", filtered.length === 0);
    grid.innerHTML = filtered
      .map(
        (banner) => `
          <article class="catalog-card">
            <div class="catalog-card__media">
              <span class="catalog-card__badge">${escapeHTML(banner.category)}</span>
              <img src="${escapeHTML(banner.image || "assets/catalog/placeholder.svg")}" alt="${escapeHTML(banner.title)}" loading="lazy" />
            </div>
            <div class="catalog-card__body">
              <h3>${escapeHTML(banner.title)}</h3>
              <div class="catalog-card__meta">
                <span>${escapeHTML(banner.format || "200 x 100 cm")}</span>
                <span>${escapeHTML(banner.priceFrom || "indywidualna wycena")}</span>
              </div>
              <p>${escapeHTML(banner.description || "Gotowa wizualizacja do zamówienia i dopasowania pod Twoje dane.")}</p>
              <button class="btn btn--primary" type="button" data-order-banner="${escapeHTML(banner.id)}">
                <i data-lucide="shopping-bag" aria-hidden="true"></i>
                <span>Zamów ten wzór</span>
              </button>
            </div>
          </article>
        `
      )
      .join("");

    grid.querySelectorAll("[data-order-banner]").forEach((button) => {
      button.addEventListener("click", () => {
        const banner = catalog.banners.find((item) => item.id === button.dataset.orderBanner);
        if (!banner) return;
        document.dispatchEvent(new CustomEvent("banner:selected", { detail: banner }));
      });
    });

    window.lucide?.createIcons();
  };

  requestJson("/api/banner-catalog")
    .then((data) => {
      catalog = data;
      renderFilters();
      renderCards();
    })
    .catch(() => {
      empty?.classList.add("is-visible");
      if (empty) empty.textContent = "Nie udało się wczytać katalogu.";
    });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(file);
  });
}

function initBannerAdmin() {
  const adminPage = document.querySelector(".admin-page");
  const form = document.querySelector("[data-admin-form]");
  const categoryForm = document.querySelector("[data-admin-category-form]");
  const categorySelect = document.querySelector("[data-admin-category-select]");
  const categoryList = document.querySelector("[data-admin-category-list]");
  const bannerList = document.querySelector("[data-admin-banner-list]");
  const orderList = document.querySelector("[data-admin-order-list]");
  const refreshOrders = document.querySelector("[data-admin-refresh-orders]");
  const status = document.querySelector("[data-admin-status]");
  const imageInput = form?.querySelector('input[name="image"]');
  const imagePreview = document.querySelector("[data-admin-image-preview]");

  if (!adminPage || !form || !bannerList) return;

  let catalog = { categories: [], banners: [] };
  let orders = [];

  const setStatus = (message, type = "") => {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-ok", type === "ok");
    status.classList.toggle("is-error", type === "error");
  };

  const renderAdmin = (preferredCategory = categorySelect?.value || "") => {
    const categories = [
      ...new Set([...catalog.categories, ...catalog.banners.map((banner) => banner.category).filter(Boolean)]),
    ];

    if (categorySelect) {
      categorySelect.innerHTML = [
        '<option value="" disabled>Wybierz kategorię</option>',
        ...categories.map((category) => `<option value="${escapeHTML(category)}">${escapeHTML(category)}</option>`),
      ].join("");
      categorySelect.value = categories.includes(preferredCategory) ? preferredCategory : "";
    }

    if (categoryList) {
      categoryList.innerHTML = categories
        .map((category) => {
          const count = catalog.banners.filter((banner) => banner.category === category).length;
          return `<span>${escapeHTML(category)} <b>${count}</b></span>`;
        })
        .join("");
    }

    bannerList.innerHTML =
      categories
        .map((category) => {
          const categoryBanners = catalog.banners.filter((banner) => banner.category === category);
          return `
            <section class="admin-category-section">
              <div class="admin-category-section__top">
                <h3>${escapeHTML(category)}</h3>
                <span>${categoryBanners.length} ${categoryBanners.length === 1 ? "baner" : "banerów"}</span>
              </div>
              <div class="admin-category-banners">
                ${
                  categoryBanners.length
                    ? categoryBanners
                        .map(
                          (banner, index) => `
                            <article class="admin-banner-item">
                              <img src="${escapeHTML(banner.image || "assets/catalog/placeholder.svg")}" alt="${escapeHTML(banner.title)}" loading="lazy" />
                              <div>
                                <small>Baner nr ${index + 1}</small>
                                <h3>${escapeHTML(banner.title)}</h3>
                                <p>${escapeHTML(banner.format || "200 x 100 cm")} • ${escapeHTML(banner.priceFrom || "indywidualna wycena")}</p>
                                <p>${escapeHTML(banner.description || "")}</p>
                              </div>
                              <button type="button" data-delete-banner="${escapeHTML(banner.id)}">Usuń</button>
                            </article>
                          `
                        )
                        .join("")
                    : '<p class="catalog-empty is-visible">Brak banerów w tej kategorii.</p>'
                }
              </div>
            </section>
          `;
        })
        .join("") || '<p class="catalog-empty is-visible">Najpierw dodaj kategorię.</p>';

    bannerList.querySelectorAll("[data-delete-banner]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm("Usunąć ten baner z katalogu?")) return;

        try {
          catalog = await requestJson(`/api/banner-catalog/${button.dataset.deleteBanner}`, { method: "DELETE" });
          renderAdmin();
          setStatus("Baner usunięty.", "ok");
        } catch (error) {
          setStatus(error.message, "error");
        }
      });
    });

    window.lucide?.createIcons();
  };

  const loadCatalog = async () => {
    catalog = await requestJson("/api/banner-catalog");
    renderAdmin();
  };

  const renderOrders = () => {
    if (!orderList) return;

    orderList.innerHTML = orders.length
      ? orders
          .map((order) => {
            const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleString("pl-PL") : "brak daty";
            return `
              <article class="admin-order-item">
                <div class="admin-order-item__top">
                  <strong>${escapeHTML(order.id)}</strong>
                  <span>${escapeHTML(order.status || "nowe")}</span>
                </div>
                <h3>${escapeHTML(order.selectedBanner || order.template || "Baner")}</h3>
                <p>${escapeHTML(order.format || "200 x 100 cm")} • ${escapeHTML(order.quantity || "1")} szt. • ${escapeHTML(order.deadline || "Standardowy")}</p>
                <p><b>${escapeHTML(order.contact || "brak kontaktu")}</b>${order.email ? ` / ${escapeHTML(order.email)}` : ""} / ${escapeHTML(order.phone || "")}</p>
                <p>${escapeHTML(order.title || "")}</p>
                ${order.notes ? `<small>${escapeHTML(order.notes)}</small>` : ""}
                <div class="admin-order-item__bottom">
                  <time>${escapeHTML(createdAt)}</time>
                  <button type="button" data-delete-order="${escapeHTML(order.id)}">Usuń</button>
                </div>
              </article>
            `;
          })
          .join("")
      : '<p class="catalog-empty is-visible">Nie ma jeszcze zapisanych zamówień.</p>';

    orderList.querySelectorAll("[data-delete-order]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm("Usunąć to zamówienie z kolejki?")) return;

        try {
          const data = await requestJson(`/api/banner-orders/${button.dataset.deleteOrder}`, { method: "DELETE" });
          orders = Array.isArray(data.orders) ? data.orders : [];
          renderOrders();
          setStatus("Zamówienie usunięte.", "ok");
        } catch (error) {
          setStatus(error.message, "error");
        }
      });
    });
  };

  const loadOrders = async () => {
    if (!orderList) return;
    const data = await requestJson("/api/banner-orders");
    orders = Array.isArray(data.orders) ? data.orders : [];
    renderOrders();
  };

  imageInput?.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    const dataUrl = await fileToDataUrl(file);

    if (!imagePreview) return;

    if (!dataUrl) {
      imagePreview.innerHTML = '<i data-lucide="image-plus" aria-hidden="true"></i><span>Podgląd pliku</span>';
    } else {
      imagePreview.innerHTML = `<img src="${dataUrl}" alt="Podgląd wizualizacji" />`;
    }

    window.lucide?.createIcons();
  });

  categoryForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(categoryForm);
    const name = String(formData.get("name") || "").trim();
    if (!name) return;

    try {
      catalog = await requestJson("/api/banner-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      categoryForm.reset();
      renderAdmin(name);
      setStatus("Kategoria dodana.", "ok");
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setStatus("Dodaję baner...");

    try {
      const imageDataUrl = await fileToDataUrl(imageInput?.files?.[0]);
      const payload = {
        title: formData.get("title"),
        category: formData.get("category"),
        format: formData.get("format"),
        priceFrom: formData.get("priceFrom"),
        description: formData.get("description"),
        imageDataUrl,
      };
      const result = await requestJson("/api/banner-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      catalog = result.catalog;
      form.reset();
      form.elements.format.value = "200 x 100 cm";
      form.elements.priceFrom.value = "indywidualna wycena";
      if (imagePreview) {
        imagePreview.innerHTML = '<i data-lucide="image-plus" aria-hidden="true"></i><span>Podgląd pliku</span>';
      }
      renderAdmin(payload.category);
      setStatus("Baner dodany do katalogu.", "ok");
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      submitButton.disabled = false;
      window.lucide?.createIcons();
    }
  });

  refreshOrders?.addEventListener("click", () => {
    loadOrders().catch((error) => setStatus(error.message, "error"));
  });

  loadCatalog().catch((error) => setStatus(error.message, "error"));
  loadOrders().catch((error) => setStatus(error.message, "error"));
}

function initMotionField() {
  const canvas = document.querySelector(".motion-field");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canvas || reduceMotion) return;

  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];

  const resize = () => {
    width = canvas.width = window.innerWidth * window.devicePixelRatio;
    height = canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const count = Math.min(70, Math.max(28, Math.floor(window.innerWidth / 18)));
    particles = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (0.28 + (index % 4) * 0.03) * window.devicePixelRatio,
      vy: (Math.random() - 0.5) * (0.28 + (index % 5) * 0.025) * window.devicePixelRatio,
      r: (1.2 + Math.random() * 2.2) * window.devicePixelRatio,
    }));
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "rgba(106, 13, 173, 0.44)";
    context.strokeStyle = "rgba(39, 119, 252, 0.18)";
    context.lineWidth = window.devicePixelRatio;

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > height) particle.vy *= -1;

      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fill();

      for (let nextIndex = index + 1; nextIndex < particles.length; nextIndex += 1) {
        const next = particles[nextIndex];
        const distance = Math.hypot(particle.x - next.x, particle.y - next.y);
        if (distance < 120 * window.devicePixelRatio) {
          context.globalAlpha = 1 - distance / (120 * window.devicePixelRatio);
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(next.x, next.y);
          context.stroke();
          context.globalAlpha = 1;
        }
      }
    });

    requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize);
  draw();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ready);
} else {
  ready();
}
