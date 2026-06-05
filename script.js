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

  initServiceConfigurator();
  initBannerAdmin();
  initCart();

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

function initServiceConfigurator() {
  const categories = document.querySelectorAll("[data-category]");
  const optionsContainer = document.querySelector("[data-config-options]");
  const summaryTitle = document.querySelector("[data-summary-title]");
  const summaryPrice = document.querySelector("[data-summary-price]");
  const summaryTime = document.querySelector("[data-summary-time]");
  const summaryOptionsContainer = document.querySelector("[data-summary-options]");
  const addToCartBtn = document.querySelector("[data-config-add-to-cart]");
  const toast = document.querySelector("[data-toast]");

  if (!optionsContainer) return;

  const servicesData = {
    logo: {
      name: "Logo / Brand",
      basePrice: 999,
      baseTime: "7-14 dni roboczych",
      options: [
        { id: "variants", type: "select", label: "Liczba wariantów projektu", choices: [
          { value: "1", label: "1 wariant", price: 0 },
          { value: "2", label: "2 warianty", price: 300 },
          { value: "3", label: "3 warianty", price: 500 }
        ]},
        { id: "revisions", type: "select", label: "Liczba tur poprawek", choices: [
          { value: "2", label: "2 tury (Standard)", price: 0 },
          { value: "4", label: "4 tury", price: 200 },
          { value: "unlimited", label: "Bez limitu", price: 600 }
        ]},
        { id: "express", type: "toggle", label: "Ekspresowa realizacja", desc: "+ 50% ceny, projekt w 3 dni", priceMultiplier: 0.5 },
        { id: "brandbook", type: "toggle", label: "Księga Znaku (Brandbook)", desc: "Szczegółowa instrukcja marki", price: 500 }
      ]
    },
    baner: {
      name: "Baner",
      basePrice: 299,
      baseTime: "3-5 dni roboczych",
      options: [
        { id: "size", type: "select", label: "Format banera", choices: [
          { value: "200x100", label: "200 x 100 cm", price: 0 },
          { value: "300x100", label: "300 x 100 cm", price: 100 },
          { value: "custom", label: "Własny format", price: 50 }
        ]},
        { id: "print", type: "toggle", label: "Przygotowanie do druku (DTP)", desc: "Spady, marginesy, profil CMYK", price: 50 },
        { id: "express", type: "toggle", label: "Ekspresowa realizacja", desc: "Projekt na jutro", price: 150 }
      ]
    },
    wizytowka: {
      name: "Wizytówka",
      basePrice: 249,
      baseTime: "3-5 dni roboczych",
      options: [
        { id: "sides", type: "select", label: "Strony", choices: [
          { value: "1", label: "Jednostronna", price: 0 },
          { value: "2", label: "Dwustronna", price: 50 }
        ]},
        { id: "premium", type: "toggle", label: "Projekt Premium", desc: "Tłoczenie, UV, złocenia (projekt)", price: 100 }
      ]
    },
    ulotka: {
      name: "Ulotka",
      basePrice: 349,
      baseTime: "4-7 dni roboczych",
      options: [
        { id: "format", type: "select", label: "Format", choices: [
          { value: "A5", label: "A5", price: 0 },
          { value: "A4", label: "A4", price: 50 },
          { value: "DL", label: "DL (składana)", price: 100 }
        ]},
        { id: "print", type: "toggle", label: "Przygotowanie DTP", desc: "Pliki produkcyjne pod konkretną drukarnię", price: 50 }
      ]
    },
    social: {
      name: "Social Media",
      basePrice: 499,
      baseTime: "5-10 dni roboczych",
      options: [
        { id: "posts", type: "select", label: "Pakiet postów", choices: [
          { value: "3", label: "3 szablony postów", price: 0 },
          { value: "6", label: "6 szablonów", price: 300 },
          { value: "9", label: "9 szablonów", price: 550 }
        ]},
        { id: "animation", type: "toggle", label: "Dodatkowa animacja (Reels)", desc: "Prosta animacja logo/tekstu", price: 250 },
        { id: "templates", type: "toggle", label: "Pliki źródłowe (Canva/PSD)", desc: "Edytowalne szablony", price: 200 }
      ]
    },
    www: {
      name: "Strona WWW",
      basePrice: 1999,
      baseTime: "14-30 dni roboczych",
      options: [
        { id: "pages", type: "select", label: "Wielkość strony", choices: [
          { value: "lp", label: "Landing Page (One-page)", price: 0 },
          { value: "multi", label: "Strona firmowa (do 5 podstron)", price: 1000 },
          { value: "shop", label: "E-commerce (sklep internetowy)", price: 3000 }
        ]},
        { id: "seo", type: "toggle", label: "Podstawowe SEO", desc: "Optymalizacja tagów i struktury pod Google", price: 400 },
        { id: "lang", type: "toggle", label: "Dodatkowa wersja językowa", desc: "Przełącznik i integracja", price: 500 }
      ]
    },
    inne: {
      name: "Inny projekt",
      basePrice: 199,
      baseTime: "Do ustalenia",
      options: [
        { id: "consultation", type: "toggle", label: "Wymaga konsultacji wideo", desc: "Rozmowa z projektantem", price: 150 }
      ]
    }
  };

  let currentCategory = "logo";
  let currentSelections = {};

  function renderOptions(categoryId) {
    const service = servicesData[categoryId];
    if (!service) return;

    optionsContainer.innerHTML = "";
    currentSelections = {};

    service.options.forEach((opt) => {
      if (opt.type === "select") {
        currentSelections[opt.id] = opt.choices[0]; // domyślnie pierwszy
        const optionsHtml = opt.choices.map(choice =>
          `<option value="${choice.value}">${choice.label}${choice.price > 0 ? ` (+${choice.price} zł)` : ""}</option>`
        ).join("");

        optionsContainer.insertAdjacentHTML("beforeend", `
          <div class="option-group">
            <label for="opt-${opt.id}">${opt.label}</label>
            <select id="opt-${opt.id}" class="styled-select" data-option-id="${opt.id}">
              ${optionsHtml}
            </select>
          </div>
        `);
      } else if (opt.type === "toggle") {
        currentSelections[opt.id] = false;
        optionsContainer.insertAdjacentHTML("beforeend", `
          <label class="option-toggle" for="opt-${opt.id}">
            <input type="checkbox" id="opt-${opt.id}" data-option-id="${opt.id}" />
            <div class="toggle-info">
              <strong>${opt.label}</strong>
              <small>${opt.desc}</small>
              ${opt.price ? `<span>+${opt.price} zł</span>` : ""}
              ${opt.priceMultiplier ? `<span>+${opt.priceMultiplier * 100}%</span>` : ""}
            </div>
            <div class="toggle-switch"></div>
          </label>
        `);
      }
    });

    if(window.lucide) {
      window.lucide.createIcons();
    }

    bindOptionEvents();
    updateSummary();
  }

  function bindOptionEvents() {
    optionsContainer.querySelectorAll("select").forEach(select => {
      select.addEventListener("change", (e) => {
        const id = e.target.dataset.optionId;
        const service = servicesData[currentCategory];
        const optionDef = service.options.find(o => o.id === id);
        currentSelections[id] = optionDef.choices.find(c => c.value === e.target.value);
        updateSummary();
      });
    });

    optionsContainer.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
      checkbox.addEventListener("change", (e) => {
        const id = e.target.dataset.optionId;
        currentSelections[id] = e.target.checked;
        updateSummary();
      });
    });
  }

  function updateSummary() {
    const service = servicesData[currentCategory];
    let total = service.basePrice;
    let multiplier = 0;
    summaryOptionsContainer.innerHTML = "";

    summaryTitle.textContent = service.name;
    summaryTime.textContent = service.baseTime;

    service.options.forEach((opt) => {
      const selected = currentSelections[opt.id];
      if (opt.type === "select" && selected) {
        total += selected.price;
        if(selected.price > 0) {
           summaryOptionsContainer.insertAdjacentHTML("beforeend", `
            <div class="summary-option-item">
              <span>${opt.label}: ${selected.label}</span>
              <span>+${selected.price} zł</span>
            </div>
          `);
        }
      } else if (opt.type === "toggle" && selected) {
        if (opt.price) {
          total += opt.price;
          summaryOptionsContainer.insertAdjacentHTML("beforeend", `
            <div class="summary-option-item">
              <span>${opt.label}</span>
              <span>+${opt.price} zł</span>
            </div>
          `);
        }
        if (opt.priceMultiplier) {
          multiplier += opt.priceMultiplier;
          summaryOptionsContainer.insertAdjacentHTML("beforeend", `
            <div class="summary-option-item">
              <span>${opt.label}</span>
              <span>+${opt.priceMultiplier * 100}%</span>
            </div>
          `);
        }
      }
    });

    if (multiplier > 0) {
      total = total + (total * multiplier);
    }

    summaryPrice.textContent = `${total} zł`;
    summaryPrice.dataset.rawPrice = total; // zapisz jako liczbe do koszyka
  }

  function showToast() {
    if (!toast) return;
    toast.classList.add("is-visible");
    setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 3000);
  }

  categories.forEach((btn) => {
    btn.addEventListener("click", () => {
      categories.forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      currentCategory = btn.dataset.category;
      renderOptions(currentCategory);
    });
  });

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const serviceName = summaryTitle.textContent;
      const price = summaryPrice.dataset.rawPrice || 0;

      const configBrandName = document.getElementById("config-brand-name")?.value || "";
      const configDetailsText = document.getElementById("config-details-text")?.value || "";
      const customTitle = configBrandName ? `${serviceName} (${configBrandName})` : serviceName;

      // Zbieranie opcji
      let optionsArray = [];
      const service = servicesData[currentCategory];
      service.options.forEach((opt) => {
        const selected = currentSelections[opt.id];
        if (opt.type === "select" && selected) {
          optionsArray.push(`${opt.label}: ${selected.label}`);
        } else if (opt.type === "toggle" && selected) {
          optionsArray.push(`${opt.label}`);
        }
      });

      if (configDetailsText) {
          optionsArray.push(`Uwagi: ${configDetailsText}`);
      }

      // Zamiast duplikować logikę, wywołujemy globalnie dostępną funkcję koszyka lub emulujemy zdarzenie
      // Opcja najprostsza: wysłanie CustomEvent
      document.dispatchEvent(new CustomEvent("markedia:add-to-cart", {
        detail: { id: currentCategory, title: customTitle, price: parseFloat(price), options: optionsArray }
      }));

      showToast();
    });
  }

  // Initial render
  renderOptions(currentCategory);
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

function initCart() {
  let initialItems = [];
  try {
    initialItems = JSON.parse(localStorage.getItem("markedia-cart")) || [];
  } catch (error) {
    console.error("Cart init error", error);
  }

  const cartState = {
    items: initialItems,
  };

  const overlay = document.querySelector("[data-cart-overlay]");
  const drawer = document.querySelector("[data-cart-drawer]");
  const toggleBtns = document.querySelectorAll("[data-cart-toggle]");
  const cartItemsContainer = document.querySelector("[data-cart-items]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const cartCounts = document.querySelectorAll("[data-cart-count]");
  const addToCartBtns = document.querySelectorAll("[data-add-to-cart]");
  const checkoutBtn = document.querySelector("[data-cart-checkout]");

  function saveCart() {
    localStorage.setItem("markedia-cart", JSON.stringify(cartState.items));
  }

  function toggleCart() {
    if (!drawer || !overlay) return;
    const isOpen = drawer.classList.contains("is-open");

    if (isOpen) {
      drawer.classList.remove("is-open");
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      drawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    } else {
      drawer.classList.add("is-open");
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      drawer.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }
  }

  function updateCartUI() {
    if (!cartItemsContainer || !cartTotal || !cartCounts) return;

    let totalElements = 0;
    let totalPrice = 0;

    cartItemsContainer.innerHTML = "";

    if (cartState.items.length === 0) {
      cartItemsContainer.innerHTML = '<p class="cart-empty-message">Twój koszyk jest pusty.</p>';
    } else {
      cartState.items.forEach((item, index) => {
        totalElements += item.quantity;
        totalPrice += item.price * item.quantity;

        // Opcje zapisane jako tablica z zachowaniem bezpieczeństwa
        const optionsHtml = (item.options && Array.isArray(item.options))
          ? `<small style="color: var(--muted); font-size: 0.8rem; display: flex; flex-direction: column; gap: 4px; margin-top: 4px;">
              ${item.options.map(opt => `<span>${escapeHTML(opt)}</span>`).join('')}
             </small>`
          : "";

        const cartItemHTML = `
          <div class="cart-item">
            <div class="cart-item__info">
              <span class="cart-item__title">${escapeHTML(item.title)}</span>
              ${optionsHtml}
              <span class="cart-item__price">${item.price} zł</span>
            </div>
            <div class="cart-item__actions">
              <div class="cart-item__quantity">
                <button type="button" data-cart-action="decrease" data-index="${index}" aria-label="Zmniejsz ilość">
                  <i data-lucide="minus"></i>
                </button>
                <span>${item.quantity}</span>
                <button type="button" data-cart-action="increase" data-index="${index}" aria-label="Zwiększ ilość">
                  <i data-lucide="plus"></i>
                </button>
              </div>
              <button class="cart-item__remove" type="button" data-cart-action="remove" data-index="${index}" aria-label="Usuń z koszyka">
                <i data-lucide="trash-2"></i>
              </button>
            </div>
          </div>
        `;
        cartItemsContainer.insertAdjacentHTML("beforeend", cartItemHTML);
      });
    }

    cartCounts.forEach(counter => {
      counter.textContent = totalElements;
      // Ukryj badge gdy zero
      if(totalElements === 0) {
        counter.style.display = 'none';
      } else {
        counter.style.display = 'flex';
      }
    });

    cartTotal.textContent = `${totalPrice} zł`;
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function addToCart(id, title, price, optionsText = "", skipToggle = false) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) return;

    // Check if exact same item with same options exists
    const existingItem = cartState.items.find((item) => {
      // porównanie tablic options
      if (item.id !== id) return false;
      const opts1 = item.options || [];
      const opts2 = optionsText || [];
      if (opts1.length !== opts2.length) return false;
      return opts1.every((val, i) => val === opts2[i]);
    });

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartState.items.push({ id, title, price: parsedPrice, quantity: 1, options: optionsText });
    }

    saveCart();
    updateCartUI();

    if (!skipToggle) {
      toggleCart();
    }
  }

  function updateQuantity(index, delta) {
    if (cartState.items[index]) {
      cartState.items[index].quantity += delta;
      if (cartState.items[index].quantity <= 0) {
        cartState.items.splice(index, 1);
      }
      saveCart();
      updateCartUI();
    }
  }

  function removeItem(index) {
    if (cartState.items[index]) {
      cartState.items.splice(index, 1);
      saveCart();
      updateCartUI();
    }
  }

  // Event Listeners
  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", toggleCart);
  });

  if (overlay) {
    overlay.addEventListener("click", toggleCart);
  }

  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.itemId;
      const title = btn.dataset.itemTitle;
      const price = btn.dataset.itemPrice;
      addToCart(id, title, price);
    });
  });

  document.addEventListener("markedia:add-to-cart", (e) => {
    const { id, title, price, options } = e.detail;
    addToCart(id, title, price, options, true); // true = skipToggle dla formularza konfiguratora, aby nie zasłaniał ekranu od razu
    updateCartUI();
  });

  if (cartItemsContainer) {
    cartItemsContainer.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-cart-action]");
      if (!actionBtn) return;

      const action = actionBtn.dataset.cartAction;
      const index = parseInt(actionBtn.dataset.index, 10);

      if (isNaN(index)) return;

      if (action === "increase") updateQuantity(index, 1);
      if (action === "decrease") updateQuantity(index, -1);
      if (action === "remove") removeItem(index);
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", () => {
      if (cartState.items.length === 0) return;

      let emailBody = "Dzień dobry, chciałbym złożyć zamówienie na następujące pakiety:\n\n";
      cartState.items.forEach(item => {
        emailBody += `- ${item.title} (x${item.quantity}) - ${item.price * item.quantity} zł\n`;
        if (item.options && Array.isArray(item.options)) {
          emailBody += `  Wybrane opcje:\n  ${item.options.join("\n  ")}\n`;
        }
      });
      emailBody += `\nŁączna wartość: ${cartTotal.textContent}\n\nProszę o kontakt w celu finalizacji.`;

      window.location.href = `mailto:markediapl@gmail.com?subject=Zamówienie z koszyka - Markedia&body=${encodeURIComponent(emailBody)}`;
    });
  }

  // Inicjalizacja UI
  updateCartUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ready);
} else {
  ready();
}
