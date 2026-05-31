const http = require("node:http");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads", "banners");
const catalogPath = path.join(dataDir, "banner-catalog.json");
const ordersPath = path.join(dataDir, "banner-orders.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

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

function ensureStorage() {
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });

  if (!fs.existsSync(catalogPath)) {
    fs.writeFileSync(catalogPath, JSON.stringify(defaultCatalog, null, 2));
  }

  if (!fs.existsSync(ordersPath)) {
    fs.writeFileSync(ordersPath, JSON.stringify([], null, 2));
  }
}

async function readCatalog() {
  ensureStorage();

  try {
    const data = JSON.parse(await fsp.readFile(catalogPath, "utf8"));
    return {
      categories: Array.isArray(data.categories) ? data.categories : defaultCatalog.categories,
      banners: Array.isArray(data.banners) ? data.banners : [],
    };
  } catch {
    await writeCatalog(defaultCatalog);
    return defaultCatalog;
  }
}

async function writeCatalog(catalog) {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.writeFile(catalogPath, JSON.stringify(catalog, null, 2));
}

async function readOrders() {
  ensureStorage();

  try {
    const data = JSON.parse(await fsp.readFile(ordersPath, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    await writeOrders([]);
    return [];
  }
}

async function writeOrders(orders) {
  await fsp.mkdir(dataDir, { recursive: true });
  await fsp.writeFile(ordersPath, JSON.stringify(orders, null, 2));
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, text) {
  res.writeHead(statusCode, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function readBody(req, limit = 12 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("Payload too large"));
        req.destroy();
        return;
      }

      chunks.push(chunk);
    });

    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function normalizeText(value) {
  return String(value || "").trim();
}

function slugify(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[łŁ]/g, "l")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);
}

function createOrderId() {
  const date = new Date();
  const stamp = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  return `MRK-${stamp}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

async function saveImageFromDataUrl(dataUrl, title) {
  if (!dataUrl) return "";

  const match = String(dataUrl).match(/^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error("Nieobsługiwany format obrazu");
  }

  const extensions = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
  };
  const fileBuffer = Buffer.from(match[2], "base64");
  const fileName = `${slugify(title) || "baner"}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}${extensions[match[1]]}`;
  const filePath = path.join(uploadDir, fileName);

  await fsp.mkdir(uploadDir, { recursive: true });
  await fsp.writeFile(filePath, fileBuffer);
  return `uploads/banners/${fileName}`;
}

async function handleApi(req, res, pathname) {
  if (pathname === "/api/banner-catalog" && req.method === "GET") {
    const catalog = await readCatalog();
    sendJson(res, 200, catalog);
    return true;
  }

  if (pathname === "/api/banner-category" && req.method === "POST") {
    const payload = JSON.parse(await readBody(req));
    const name = normalizeText(payload.name);

    if (!name) {
      sendJson(res, 400, { error: "Podaj nazwę kategorii." });
      return true;
    }

    const catalog = await readCatalog();
    if (!catalog.categories.some((category) => category.toLowerCase() === name.toLowerCase())) {
      catalog.categories.push(name);
      catalog.categories.sort((a, b) => a.localeCompare(b, "pl"));
      await writeCatalog(catalog);
    }

    sendJson(res, 200, catalog);
    return true;
  }

  if (pathname === "/api/banner-catalog" && req.method === "POST") {
    const payload = JSON.parse(await readBody(req));
    const title = normalizeText(payload.title);
    const category = normalizeText(payload.category);

    if (!title || !category) {
      sendJson(res, 400, { error: "Podaj tytuł i kategorię banera." });
      return true;
    }

    const catalog = await readCatalog();
    const image = await saveImageFromDataUrl(payload.imageDataUrl, title);
    const banner = {
      id: `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      title,
      category,
      format: normalizeText(payload.format) || "200 x 100 cm",
      priceFrom: normalizeText(payload.priceFrom) || "indywidualna wycena",
      description: normalizeText(payload.description),
      image: image || "assets/catalog/placeholder.svg",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    if (!catalog.categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
      catalog.categories.push(category);
      catalog.categories.sort((a, b) => a.localeCompare(b, "pl"));
    }

    catalog.banners.unshift(banner);
    await writeCatalog(catalog);
    sendJson(res, 201, { banner, catalog });
    return true;
  }

  const deleteMatch = pathname.match(/^\/api\/banner-catalog\/([^/]+)$/);
  if (deleteMatch && req.method === "DELETE") {
    const catalog = await readCatalog();
    const banner = catalog.banners.find((item) => item.id === deleteMatch[1]);
    catalog.banners = catalog.banners.filter((item) => item.id !== deleteMatch[1]);
    await writeCatalog(catalog);

    if (banner?.image?.startsWith("uploads/banners/")) {
      const imagePath = path.resolve(root, banner.image);
      if (imagePath.startsWith(uploadDir + path.sep)) {
        await fsp.rm(imagePath, { force: true });
      }
    }

    sendJson(res, 200, catalog);
    return true;
  }

  if (pathname === "/api/banner-orders" && req.method === "GET") {
    const orders = await readOrders();
    sendJson(res, 200, { orders });
    return true;
  }

  if (pathname === "/api/banner-orders" && req.method === "POST") {
    const payload = JSON.parse(await readBody(req, 256 * 1024));
    const title = normalizeText(payload.title);
    const phone = normalizeText(payload.phone);
    const contact = normalizeText(payload.contact);

    if (!title || !phone || !contact) {
      sendJson(res, 400, { error: "Uzupełnij hasło, telefon i imię albo nazwę firmy." });
      return true;
    }

    const order = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      status: "nowe",
      selectedBanner: normalizeText(payload.selectedBanner) || "Startowy baner SPRZEDAM",
      template: normalizeText(payload.template) || "Sprzedam",
      format: normalizeText(payload.format) || "200 x 100 cm",
      material: "trwały baner hard solvent",
      finish: "zgrzewane krawędzie, oczka co 50 cm",
      title,
      phone,
      contact,
      email: normalizeText(payload.email),
      quantity: normalizeText(payload.quantity) || "1",
      deadline: normalizeText(payload.deadline) || "Standardowy",
      notes: normalizeText(payload.notes),
      brief: normalizeText(payload.brief),
    };

    const orders = await readOrders();
    orders.unshift(order);
    await writeOrders(orders.slice(0, 500));
    sendJson(res, 201, { order });
    return true;
  }

  const orderMatch = pathname.match(/^\/api\/banner-orders\/([^/]+)$/);
  if (orderMatch && req.method === "DELETE") {
    const orders = await readOrders();
    const nextOrders = orders.filter((order) => order.id !== orderMatch[1]);

    if (nextOrders.length === orders.length) {
      sendJson(res, 404, { error: "Nie znaleziono zamówienia." });
      return true;
    }

    await writeOrders(nextOrders);
    sendJson(res, 200, { orders: nextOrders });
    return true;
  }

  if (pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "Nie znaleziono endpointu." });
    return true;
  }

  return false;
}

function isSafePath(filePath) {
  const relative = path.relative(root, filePath);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://127.0.0.1");
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (await handleApi(req, res, pathname)) return;

    const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^[/\\]+/, "");
    const filePath = path.resolve(root, relativePath);

    if (!isSafePath(filePath)) {
      sendText(res, 403, "Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        sendText(res, 404, "Not found");
        return;
      }

      res.writeHead(200, {
        "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      });
      res.end(data);
    });
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Błąd serwera." });
  }
});

ensureStorage();

server.listen(port, "127.0.0.1", () => {
  console.log(`Markedia landing page: http://127.0.0.1:${port}`);
});
