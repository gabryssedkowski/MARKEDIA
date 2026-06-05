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

  initProductConfigurator();

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

const defaultCatalog = {
  categories: ["Budowlane", "Mechanik", "Gastronomia", "Nieruchomości", "Usługi lokalne"],
  banners: [
    {
      id: "demo-budowlane",
      title: "Remonty i elewacje",
      category: "Budowlane",
      format: "200 x 100 cm",
      priceFrom: "indywidualna wycena",
      description: "Czytelny wzór dla ekip remontowych, elewacji, dachów i usług budowlanych.",
      image: "assets/catalog/budowlane.svg",
      isActive: true,
      createdAt: "2026-05-28T00:00:00.000Z",
    },
    {
      id: "demo-mechanik",
      title: "Mechanika pojazdowa",
      category: "Mechanik",
      format: "200 x 100 cm",
      priceFrom: "indywidualna wycena",
      description: "Mocny baner dla warsztatu, serwisu opon, pomocy drogowej albo detailingu.",
      image: "assets/catalog/mechanik.svg",
      isActive: true,
      createdAt: "2026-05-28T00:00:00.000Z",
    },
  ],
};

function getLocalData(key, defaultValue) {
  try {
    const data = localStorage.getItem(key);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return defaultValue;
}

function setLocalData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      throw new Error("Brak miejsca w pamięci przeglądarki (localStorage). Usuń stare dane.");
    }
    throw e;
  }
}

async function requestJson(url, options = {}) {
  const method = options.method || "GET";

  await new Promise(resolve => setTimeout(resolve, 300));

  if (url === "/api/banner-catalog" && method === "GET") {
    return getLocalData("markedia-catalog", defaultCatalog);
  }

  if (url === "/api/banner-category" && method === "POST") {
    const payload = JSON.parse(options.body);
    const name = (payload.name || "").trim();
    if (!name) throw new Error("Podaj nazwę kategorii.");

    const catalog = getLocalData("markedia-catalog", defaultCatalog);
    if (!catalog.categories.some(c => c.toLowerCase() === name.toLowerCase())) {
      catalog.categories.push(name);
      catalog.categories.sort((a, b) => a.localeCompare(b, "pl"));
      setLocalData("markedia-catalog", catalog);
    }
    return catalog;
  }

  if (url === "/api/banner-catalog" && method === "POST") {
    const payload = JSON.parse(options.body);
    const title = (payload.title || "").trim();
    const category = (payload.category || "").trim();
    if (!title || !category) throw new Error("Podaj tytuł i kategorię banera.");

    const catalog = getLocalData("markedia-catalog", defaultCatalog);
    const banner = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title,
      category,
      format: (payload.format || "").trim() || "200 x 100 cm",
      priceFrom: (payload.priceFrom || "").trim() || "indywidualna wycena",
      description: (payload.description || "").trim(),
      image: payload.imageDataUrl || "assets/catalog/placeholder.svg",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (!catalog.categories.some(c => c.toLowerCase() === category.toLowerCase())) {
      catalog.categories.push(category);
      catalog.categories.sort((a, b) => a.localeCompare(b, "pl"));
    }

    catalog.banners.unshift(banner);
    setLocalData("markedia-catalog", catalog);
    return { banner, catalog };
  }

  const catalogDeleteMatch = url.match(/^\/api\/banner-catalog\/([^/]+)$/);
  if (catalogDeleteMatch && method === "DELETE") {
    const catalog = getLocalData("markedia-catalog", defaultCatalog);
    catalog.banners = catalog.banners.filter(b => b.id !== catalogDeleteMatch[1]);
    setLocalData("markedia-catalog", catalog);
    return catalog;
  }

  if (url === "/api/banner-orders" && method === "GET") {
    const orders = getLocalData("markedia-orders", []);
    return { orders };
  }

  if (url === "/api/banner-orders" && method === "POST") {
    const payload = JSON.parse(options.body);
    const title = (payload.title || "").trim();
    const phone = (payload.phone || "").trim();
    const contact = (payload.contact || "").trim();

    if (!title || !phone || !contact) throw new Error("Uzupełnij hasło, telefon i imię albo nazwę firmy.");

    const date = new Date();
    const stamp = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("");
    const orderId = `MRK-${stamp}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order = {
      id: orderId,
      createdAt: date.toISOString(),
      status: "nowe",
      selectedBanner: (payload.selectedBanner || "").trim() || "Startowy baner SPRZEDAM",
      template: (payload.template || "").trim() || "Sprzedam",
      format: (payload.format || "").trim() || "200 x 100 cm",
      material: "trwały baner hard solvent",
      finish: "zgrzewane krawędzie, oczka co 50 cm",
      title,
      phone,
      contact,
      email: (payload.email || "").trim(),
      quantity: (payload.quantity || "").trim() || "1",
      deadline: (payload.deadline || "").trim() || "Standardowy",
      notes: (payload.notes || "").trim(),
      brief: (payload.brief || "").trim(),
    };

    const orders = getLocalData("markedia-orders", []);
    orders.unshift(order);
    setLocalData("markedia-orders", orders.slice(0, 500));
    return { order };
  }

  const orderDeleteMatch = url.match(/^\/api\/banner-orders\/([^/]+)$/);
  if (orderDeleteMatch && method === "DELETE") {
    let orders = getLocalData("markedia-orders", []);
    const initialLen = orders.length;
    orders = orders.filter(o => o.id !== orderDeleteMatch[1]);

    if (orders.length === initialLen) throw new Error("Nie znaleziono zamówienia.");
    setLocalData("markedia-orders", orders);
    return { orders };
  }

  throw new Error("Nie znaleziono endpointu.");
}



function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        // compress slightly
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result;
    });
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
  const cartState = {
    items: JSON.parse(localStorage.getItem("markedia-cart")) || [],
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

        const cartItemHTML = `
          <div class="cart-item">
            <div class="cart-item__info">
              <span class="cart-item__title">${item.title}</span>
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

  function addToCart(id, title, price) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice)) return;

    const existingItem = cartState.items.find((item) => item.id === id);

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      cartState.items.push({ id, title, price: parsedPrice, quantity: 1 });
    }

    saveCart();
    updateCartUI();
    toggleCart(); // Otwórz koszyk po dodaniu
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

  document.addEventListener("cart:add", (e) => {
    const item = e.detail;
    addToCart(item.id, item.title, item.price);
  });

  addToCartBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const id = btn.dataset.itemId;
      const title = btn.dataset.itemTitle;
      const price = btn.dataset.itemPrice;
      addToCart(id, title, price);
    });
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


const productCatalog = {
  logo: {
    title: "Projekt Logo",
    basePrice: 800,
    baseDeadline: "5-7 dni roboczych",
    fields: [
      { id: "variants", label: "Liczba propozycji", type: "select", options: [
        { label: "1 propozycja", price: 0, deadline: 0 },
        { label: "3 propozycje", price: 400, deadline: 2 },
        { label: "5 propozycji", price: 800, deadline: 4 }
      ]},
      { id: "revisions", label: "Liczba poprawek", type: "select", options: [
        { label: "2 rundy poprawek", price: 0, deadline: 0 },
        { label: "Nielimitowane", price: 300, deadline: 2 }
      ]},
      { id: "brandbook", label: "Księga znaku", type: "checkbox", price: 500, deadline: 3 },
      { id: "express", label: "Ekspresowa realizacja (-48h)", type: "checkbox", price: 300, deadline: -2 }
    ]
  },
  baner: {
    title: "Projekt Banera",
    basePrice: 150,
    baseDeadline: "2-3 dni robocze",
    fields: [
      { id: "format", label: "Format", type: "select", options: [
        { label: "Standard (np. 200x100 cm)", price: 0, deadline: 0 },
        { label: "Wielkoformatowy (>300cm)", price: 100, deadline: 1 }
      ]},
      { id: "printPrep", label: "Przygotowanie do druku", type: "checkbox", price: 50, deadline: 0 },
      { id: "express", label: "Ekspresowa realizacja (-24h)", type: "checkbox", price: 100, deadline: -1 }
    ]
  },
  wizytowka: {
    title: "Projekt Wizytówki",
    basePrice: 100,
    baseDeadline: "2-3 dni robocze",
    fields: [
      { id: "sides", label: "Strony", type: "select", options: [
        { label: "Jednostronna", price: 0, deadline: 0 },
        { label: "Dwustronna", price: 50, deadline: 0 }
      ]},
      { id: "variants", label: "Wersje dla pracowników", type: "number", min: 1, basePrice: 0, addPrice: 20 },
      { id: "printPrep", label: "Przygotowanie do druku", type: "checkbox", price: 50, deadline: 0 }
    ]
  },
  ulotka: {
    title: "Projekt Ulotki",
    basePrice: 200,
    baseDeadline: "3-4 dni robocze",
    fields: [
      { id: "format", label: "Format", type: "select", options: [
        { label: "A5 / DL", price: 0, deadline: 0 },
        { label: "Składana (np. 3xDL)", price: 150, deadline: 1 }
      ]},
      { id: "sides", label: "Strony", type: "select", options: [
        { label: "Jednostronna", price: 0, deadline: 0 },
        { label: "Dwustronna", price: 80, deadline: 0 }
      ]},
      { id: "printPrep", label: "Przygotowanie do druku", type: "checkbox", price: 50, deadline: 0 }
    ]
  },
  social: {
    title: "Projekt Social Media",
    basePrice: 120,
    baseDeadline: "2-3 dni robocze",
    fields: [
      { id: "type", label: "Typ", type: "select", options: [
        { label: "Pojedynczy post/story", price: 0, deadline: 0 },
        { label: "Karuzela (do 5 slajdów)", price: 150, deadline: 1 },
        { label: "Zestaw 5 postów", price: 380, deadline: 2 }
      ]},
      { id: "animation", label: "Animacja (np. proste wejście wideo)", type: "checkbox", price: 200, deadline: 2 }
    ]
  },
  www: {
    title: "Projekt Strony WWW (UI/UX)",
    basePrice: 1500,
    baseDeadline: "10-14 dni roboczych",
    fields: [
      { id: "pages", label: "Liczba podstron", type: "select", options: [
        { label: "One-page (Landing Page)", price: 0, deadline: 0 },
        { label: "Do 5 podstron", price: 1000, deadline: 5 },
        { label: "Do 10 podstron", price: 2000, deadline: 10 }
      ]},
      { id: "rwd", label: "Makiety mobilne (RWD)", type: "checkbox", price: 500, deadline: 2 },
      { id: "premium", label: "Projekt Premium (zaawansowane animacje GSAP)", type: "checkbox", price: 1000, deadline: 4 }
    ]
  },
  inne: {
    title: "Inny Projekt",
    basePrice: 0,
    baseDeadline: "Do ustalenia",
    fields: [
      { id: "customType", label: "Rodzaj projektu (np. menu, plakat)", type: "text" },
      { id: "consultation", label: "Darmowa konsultacja przed wyceną", type: "checkbox", price: 0, deadline: 0, checked: true }
    ]
  }
};

function initProductConfigurator() {
  const form = document.querySelector("[data-configurator-form]");
  if (!form) return;

  const dynamicFieldsContainer = document.querySelector("[data-configurator-fields]");
  const recapProduct = document.querySelector('[data-config-recap="product"]');
  const recapOptions = document.querySelector('[data-config-recap="options"]');
  const recapDeadline = document.querySelector('[data-config-recap="deadline"]');
  const recapPrice = document.querySelector('[data-config-recap="price"]');
  const addToCartBtn = document.querySelector("[data-config-add-to-cart]");
  const statusMsg = document.querySelector("[data-config-status]");

  let currentCategory = "logo";
  let currentPrice = 0;
  let currentDeadlineDays = 0;
  let currentConfig = {};

  let currentBannerCatalog = null;
  let dynamicFields = [];
  let selectedBannerCategoryIndex = 0;

  // --- STORE LOGIC ---
  const storeView = document.getElementById("store-view");
  const configuratorView = document.getElementById("configurator-view");
  const backToStoreBtn = document.getElementById("back-to-store");
  const storeCategoriesBtns = document.querySelectorAll("[data-store-category]");
  const storeProductsGrid = document.getElementById("store-products-grid");
  const configProductTitle = document.getElementById("configurator-product-title");

  const storeProducts = {
    logo: [
      { id: "logo-basic", title: "Projekt Logo", desc: "Profesjonalne logo dla Twojej marki. Odśwież swój wizerunek.", price: 800, badge: "Popularne", img: "assets/placeholder-logo.jpg", configCat: "logo" }
    ],
    baner: [
      { id: "baner-budowlany", title: "Baner Budowlany", desc: "Wytrzymały baner dla firm remontowych i budowlanych.", price: 150, badge: "Popularne", img: "assets/placeholder-baner.jpg", configCat: "baner" },
      { id: "baner-mechanik", title: "Baner Mechanik", desc: "Zwiększ widoczność swojego warsztatu samochodowego.", price: 150, badge: "", img: "assets/placeholder-baner.jpg", configCat: "baner" },
      { id: "baner-beauty", title: "Baner Beauty", desc: "Elegancki baner dla salonów kosmetycznych i fryzjerskich.", price: 150, badge: "Nowość", img: "assets/placeholder-baner.jpg", configCat: "baner" },
      { id: "baner-gastronomia", title: "Baner Gastronomia", desc: "Apetyczny projekt banera dla restauracji i food trucków.", price: 150, badge: "", img: "assets/placeholder-baner.jpg", configCat: "baner" },
      { id: "baner-transport", title: "Baner Transport", desc: "Czytelny baner dla firm transportowych i logistycznych.", price: 150, badge: "", img: "assets/placeholder-baner.jpg", configCat: "baner" },
      { id: "baner-sklep", title: "Baner Sklep Internetowy", desc: "Promuj swój e-commerce w przestrzeni miejskiej.", price: 150, badge: "Nowość", img: "assets/placeholder-baner.jpg", configCat: "baner" },
      { id: "baner-uniwersalny", title: "Baner Uniwersalny", desc: "Czysty, uniwersalny projekt dostosowany do każdej branży.", price: 150, badge: "", img: "assets/placeholder-baner.jpg", configCat: "baner" }
    ],
    wizytowka: [
      { id: "wizytowka-basic", title: "Projekt Wizytówki", desc: "Zrób świetne pierwsze wrażenie. Eleganckie i nowoczesne.", price: 100, badge: "", img: "assets/placeholder-wizytowka.jpg", configCat: "wizytowka" }
    ],
    ulotka: [
       { id: "ulotka-basic", title: "Projekt Ulotki", desc: "Skuteczna reklama w formacie papierowym. Różne formaty.", price: 200, badge: "", img: "assets/placeholder-ulotka.jpg", configCat: "ulotka" }
    ],
    social: [
       { id: "social-basic", title: "Projekt Social Media", desc: "Spójny wizerunek na Facebooku, Instagramie i LinkedInie.", price: 300, badge: "Popularne", img: "assets/placeholder-social.jpg", configCat: "social" }
    ],
    www: [
       { id: "www-basic", title: "Projekt Strony WWW", desc: "Nowoczesna, responsywna strona szyta na miarę.", price: 2000, badge: "", img: "assets/placeholder-www.jpg", configCat: "www" }
    ],
    inne: [
       { id: "inne-basic", title: "Inny Projekt", desc: "Nie znalazłeś tego, czego szukasz? Skontaktuj się z nami.", price: 0, badge: "", img: "assets/placeholder-inne.jpg", configCat: "inne" }
    ]
  };

  let currentStoreCategory = "logo";

  const renderStoreProducts = () => {
    if (!storeProductsGrid) return;
    const products = storeProducts[currentStoreCategory] || [];
    storeProductsGrid.innerHTML = "";

    products.forEach(prod => {
      const card = document.createElement("div");
      card.className = "product-card reveal";

      const badgeHtml = prod.badge ? `<div class="product-badge ${prod.badge === 'Nowość' ? 'product-badge--new' : 'product-badge--popular'}">${prod.badge}</div>` : '';

      const priceText = prod.price > 0 ? `${prod.price} zł` : "Wycena";

      card.innerHTML = `
        <div class="product-card__image">
          ${badgeHtml}
          <!-- Używamy szarego tła jako placeholdera w razie braku obrazka -->
          <img src="${prod.img}" alt="${prod.title}" onerror="this.style.display='none'">
        </div>
        <div class="product-card__content">
          <h3 class="product-card__title">${prod.title}</h3>
          <p class="product-card__desc">${prod.desc}</p>
          <div class="product-card__footer">
            <div class="product-card__price">
              <span>Cena od</span>
              <strong>${priceText}</strong>
            </div>
            <button class="product-card__btn magnetic" type="button" data-open-config="${prod.configCat}" data-product-title="${prod.title}">
              <span>Konfiguruj</span>
              <i data-lucide="arrow-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      `;
      storeProductsGrid.appendChild(card);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }

    const dynamicRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            dynamicRevealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );

    storeProductsGrid.querySelectorAll('.reveal').forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 90}ms`;
      dynamicRevealObserver.observe(item);
    });

    // Add event listeners to newly created "Konfiguruj" buttons
    const configBtns = storeProductsGrid.querySelectorAll("[data-open-config]");
    configBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const cat = e.currentTarget.dataset.openConfig;
        const pTitle = e.currentTarget.dataset.productTitle;
        openConfigurator(cat, pTitle);
      });
    });
  };

  const openConfigurator = (category, productTitle) => {
    if (storeView && configuratorView) {
      storeView.classList.add("hidden");
      configuratorView.classList.remove("hidden");
      configuratorView.style.display = "block";

      if(configProductTitle) {
          configProductTitle.textContent = `Konfigurujesz: ${productTitle}`;
      }

      // Scroll do konfiguratora
      configuratorView.scrollIntoView({ behavior: 'smooth', block: 'start' });

      currentCategory = category;

      const iconMap = {
          logo: "pen-tool",
          baner: "layout-template",
          wizytowka: "contact",
          ulotka: "file-text",
          social: "instagram",
          www: "monitor",
          inne: "more-horizontal"
      };

      const iconEl = document.querySelector(".illustration-icon");
      if(iconEl && window.lucide) {
          iconEl.setAttribute("data-lucide", iconMap[currentCategory] || "layers");
          window.lucide.createIcons();
      }

      renderFields();
    }
  };

  if (backToStoreBtn) {
    backToStoreBtn.addEventListener("click", () => {
      if (storeView && configuratorView) {
        configuratorView.classList.add("hidden");
        configuratorView.style.display = "none";
        storeView.classList.remove("hidden");
        storeView.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  if (storeCategoriesBtns.length > 0) {
    storeCategoriesBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        storeCategoriesBtns.forEach(b => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        currentStoreCategory = btn.dataset.storeCategory;
        renderStoreProducts();
      });
    });

    // Inicjalizacja widoku sklepu
    renderStoreProducts();
  }
  // --- END STORE LOGIC ---


  const renderFields = async () => {
    const product = productCatalog[currentCategory];
    if (!product) return;

    dynamicFields = [...product.fields];

    if (currentCategory === "baner") {
      try {
        if (!currentBannerCatalog) {
          currentBannerCatalog = await requestJson("/api/banner-catalog");
        }

        const categories = currentBannerCatalog.categories || [];
        const categoryOptions = [
          { label: "Personalizowany projekt", price: 0, deadline: 0, value: "" },
          ...categories.map(c => ({ label: `Gotowy wzór: ${c}`, price: 0, deadline: 0, value: c }))
        ];

        dynamicFields.unshift({
          id: "bannerCategory",
          label: "Wybór projektu",
          type: "select",
          options: categoryOptions,
          isDynamicCategory: true
        });

        const catOpt = categoryOptions[selectedBannerCategoryIndex];
        if (catOpt && catOpt.value) {
           const bannersInCat = currentBannerCatalog.banners.filter(b => b.category === catOpt.value && b.isActive !== false);
           if (bannersInCat.length > 0) {
              const bannerOptions = bannersInCat.map(b => ({
                 label: b.title,
                 price: 0,
                 deadline: 0,
                 value: b.id,
                 image: b.image
              }));

              dynamicFields.splice(1, 0, {
                 id: "bannerTemplate",
                 label: "Wybierz gotowy projekt",
                 type: "visual_select",
                 options: bannerOptions
              });
           }
        }

      } catch(e) {
        console.error("Nie udało się załadować katalogu banerów.", e);
      }
    }

    renderHtml();
  };

  const renderHtml = () => {
    dynamicFieldsContainer.innerHTML = dynamicFields.map(field => {
      let fieldHtml = "";

      if (field.type === "select") {
        const optionsHtml = field.options.map((opt, idx) =>
          `<option value="${idx}">${opt.label} ${opt.price > 0 ? '(+' + opt.price + ' zł)' : ''}</option>`
        ).join("");
        fieldHtml = `
          <div class="config-field-group">
            <label for="${field.id}">${field.label}</label>
            <select id="${field.id}" name="${field.id}" data-config-input>
              ${optionsHtml}
            </select>
          </div>
        `;
      } else if (field.type === "visual_select") {
        const optionsHtml = field.options.map((opt, idx) => `
          <div class="config-visual-card ${idx === 0 ? 'is-active' : ''}" data-visual-option="${idx}">
            <img src="${opt.image || 'assets/catalog/placeholder.svg'}" alt="${opt.label}" loading="lazy" />
            <span>${opt.label}</span>
          </div>
        `).join("");
        fieldHtml = `
          <div class="config-field-group full-width">
            <label>${field.label}</label>
            <div class="config-visual-grid" id="${field.id}-container">
              ${optionsHtml}
            </div>
            <input type="hidden" id="${field.id}" name="${field.id}" value="0" data-config-input>
          </div>
        `;
      } else if (field.type === "checkbox") {
        fieldHtml = `
          <div class="config-field-group">
            <label class="config-checkbox-wrapper">
              <input type="checkbox" id="${field.id}" name="${field.id}" data-config-input ${field.checked ? 'checked' : ''}>
              ${field.label} ${field.price > 0 ? '(+' + field.price + ' zł)' : ''}
            </label>
          </div>
        `;
      } else if (field.type === "number") {
        fieldHtml = `
          <div class="config-field-group">
            <label for="${field.id}">${field.label} ${field.addPrice > 0 ? '(+' + field.addPrice + ' zł/szt)' : ''}</label>
            <input type="number" id="${field.id}" name="${field.id}" min="${field.min}" value="${field.min}" data-config-input>
          </div>
        `;
      } else if (field.type === "text") {
        fieldHtml = `
          <div class="config-field-group full-width">
            <label for="${field.id}">${field.label}</label>
            <input type="text" id="${field.id}" name="${field.id}" placeholder="${field.label}" data-config-input>
          </div>
        `;
      }

      if (field.id === "bannerCategory" || field.id === "bannerTemplate") {
        fieldHtml = fieldHtml.replace('class="config-field-group"', 'class="config-field-group full-width"');
      }

      return fieldHtml;
    }).join("");

    // Restore selected value for bannerCategory if it exists
    const categoryInput = document.getElementById("bannerCategory");
    if (categoryInput) {
       categoryInput.value = selectedBannerCategoryIndex;
    }

    attachInputListeners();

    // Attach listeners for visual selects
    document.querySelectorAll('.config-visual-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const container = e.currentTarget.closest('.config-visual-grid');
        const hiddenInput = container.nextElementSibling;

        container.querySelectorAll('.config-visual-card').forEach(c => c.classList.remove('is-active'));
        e.currentTarget.classList.add('is-active');

        hiddenInput.value = e.currentTarget.dataset.visualOption;

        // Trigger change event to update recap
        hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });

    updateRecap();
  };

  const attachInputListeners = () => {
    document.querySelectorAll("[data-config-input]").forEach(input => {
      input.addEventListener("change", (e) => {
          if (e.target.id === "bannerCategory") {
              selectedBannerCategoryIndex = parseInt(e.target.value, 10) || 0;
              renderFields();
          } else {
              updateRecap();
          }
      });
      input.addEventListener("input", (e) => {
          if (e.target.id !== "bannerCategory") {
              updateRecap();
          }
      });
    });
  };

  const updateRecap = () => {
    const product = productCatalog[currentCategory];
    if (!product) return;

    currentPrice = product.basePrice;

    // Parse base deadline assuming format "X-Y dni..."
    let minDays = 0, maxDays = 0;
    const match = product.baseDeadline.match(/(\d+)-(\d+)/);
    if(match) {
        minDays = parseInt(match[1], 10);
        maxDays = parseInt(match[2], 10);
    }

    let addedDeadline = 0;
    currentConfig = {};
    let optionsHtml = "";

    // Use dynamicFields instead of product.fields to capture dynamically added banner categories and templates
    dynamicFields.forEach(field => {
      const input = document.getElementById(field.id);
      if (!input) return;

      if (field.type === "select" || field.type === "visual_select") {
        const selectedOpt = field.options[parseInt(input.value, 10)];
        if(selectedOpt) {
            currentPrice += selectedOpt.price;
            addedDeadline += selectedOpt.deadline;
            currentConfig[field.label] = selectedOpt.label;

            if(selectedOpt.price > 0) {
                optionsHtml += `<div class="config-recap-option-item"><span>${field.label}: ${selectedOpt.label}</span><span>+${selectedOpt.price} zł</span></div>`;
            } else {
                optionsHtml += `<div class="config-recap-option-item"><span>${field.label}: ${selectedOpt.label}</span><span></span></div>`;
            }
        }
      } else if (field.type === "checkbox") {
        if (input.checked) {
          currentPrice += field.price;
          addedDeadline += field.deadline;
          currentConfig[field.label] = "Tak";

          if(field.price > 0) {
              optionsHtml += `<div class="config-recap-option-item"><span>${field.label}</span><span>+${field.price} zł</span></div>`;
          } else {
              optionsHtml += `<div class="config-recap-option-item"><span>${field.label}</span><span></span></div>`;
          }
        }
      } else if (field.type === "number") {
          const val = parseInt(input.value, 10);
          if(!isNaN(val) && val >= field.min) {
              const extraItems = val - field.min;
              const cost = extraItems * field.addPrice;
              currentPrice += cost;
              currentConfig[field.label] = val;

              if(cost > 0) {
                  optionsHtml += `<div class="config-recap-option-item"><span>${field.label}: ${val}</span><span>+${cost} zł</span></div>`;
              } else {
                  optionsHtml += `<div class="config-recap-option-item"><span>${field.label}: ${val}</span><span></span></div>`;
              }
          }
      } else if (field.type === "text") {
          if(input.value.trim()) {
              currentConfig[field.label] = input.value.trim();
              optionsHtml += `<div class="config-recap-option-item"><span>${field.label}: ${input.value.trim()}</span><span></span></div>`;
          }
      }
    });

    const notesInput = document.querySelector('[data-config-input="notes"]');
    if(notesInput && notesInput.value.trim()) {
        currentConfig["Uwagi"] = notesInput.value.trim();
    }

    recapProduct.textContent = product.title;
    recapOptions.innerHTML = optionsHtml;

    if (currentCategory === "inne") {
        recapPrice.textContent = "indywidualna wycena";
        recapDeadline.textContent = "Do ustalenia";
    } else {
        recapPrice.textContent = currentPrice + " zł";

        let finalMin = Math.max(1, minDays + addedDeadline);
        let finalMax = Math.max(1, maxDays + addedDeadline);
        if(finalMin === finalMax) {
            recapDeadline.textContent = `ok. ${finalMin} dni roboczych`;
        } else {
            recapDeadline.textContent = `ok. ${finalMin}-${finalMax} dni roboczych`;
        }
    }
  };



  addToCartBtn.addEventListener("click", () => {
    const product = productCatalog[currentCategory];

    let title = product.title;
    if(currentCategory === "inne" && currentConfig["Rodzaj projektu (np. menu, plakat)"]) {
        title += ` (${currentConfig["Rodzaj projektu (np. menu, plakat)"]})`;
    }

    const cartItem = {
      id: `conf-${currentCategory}-${Date.now()}`,
      title: title,
      price: currentCategory === "inne" ? 0 : currentPrice,
      config: currentConfig
    };

    document.dispatchEvent(new CustomEvent("cart:add", { detail: cartItem }));

    statusMsg.textContent = "Produkt dodany do koszyka!";
    statusMsg.classList.remove("error");

    setTimeout(() => {
        statusMsg.textContent = "";
    }, 3000);
  });

  // Initial render
  renderFields();
}
