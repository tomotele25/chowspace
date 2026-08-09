/**
 * Row validation for the bulk-upload wizard.
 *
 * Mirrors the server rules in chowspace_backend/controller/bulkProduct-controller.js
 * so the vendor sees every problem in the preview instead of discovering it
 * mid-import. The server still re-validates everything — this is for feedback,
 * not for trust.
 */
import { matchImageForRow } from "./bulkParse.js";

export const MAX_NAME_LENGTH = 120;
export const CHUNK_SIZE = 8;

/** Same normalisation the backend's nameKey() uses. */
const key = (value) => String(value ?? "").trim().toLowerCase();

/** Identity used by the { vendor, name, category, price } unique index. */
export const productKey = (name, category, price) =>
  `${key(name)}|${key(category)}|${Number(price)}`;

/**
 * Parses a price cell. Strips currency symbols and separators that survive a
 * spreadsheet export ("₦2,500", " 1500 ").
 */
export const parsePrice = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return undefined;
  }
  const raw =
    typeof value === "string" ? value.replace(/[^0-9.-]/g, "") : value;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

export const parseAvailable = (value) => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return undefined;
  }
  if (typeof value === "boolean") return value;
  const v = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "y", "available"].includes(v)) return true;
  if (["false", "0", "no", "n", "unavailable"].includes(v)) return false;
  return null; // present but unrecognisable
};

/** Case-insensitive category match against the list from the API. */
export const matchCategory = (input, categories) => {
  const k = key(input);
  if (!k) return null;
  return categories.find((c) => key(c) === k) || null;
};

/**
 * Validates every row and attaches its resolved values, image and errors.
 *
 * @param {object[]} rows       canonical rows from parseSpreadsheet
 * @param {object}   context
 * @param {"create"|"update"} context.mode
 * @param {string[]} context.categories       names from /api/product-categories
 * @param {object[]} context.existingProducts the vendor's current menu
 * @param {object}   context.imageIndex       from indexImageFiles, or null
 * @param {Map}      context.manualImages     rowNumber -> File, set in the preview
 * @returns {object[]} rows decorated with { errors, image, resolved }
 */
export const validateRows = (rows, context) => {
  const {
    mode,
    categories = [],
    existingProducts = [],
    imageIndex = null,
    manualImages = new Map(),
  } = context;

  const existingByKey = new Map(
    existingProducts.map((p) => [
      productKey(p.productName, p.category, p.price),
      p,
    ])
  );
  const existingById = new Map(existingProducts.map((p) => [String(p._id), p]));

  const byNameCategory = new Map();
  existingProducts.forEach((p) => {
    const k = `${key(p.productName)}|${key(p.category)}`;
    if (!byNameCategory.has(k)) byNameCategory.set(k, []);
    byNameCategory.get(k).push(p);
  });

  const seenKeys = new Map(); // productKey -> first rowNumber that claimed it
  const seenIds = new Set();

  return rows.map((row) => {
    const errors = [];
    const resolved = {};

    // ── target product (update mode) ────────────────────────────────────
    let target = null;
    if (mode === "update") {
      const id = String(row.productId ?? "").trim();
      if (id) {
        target = existingById.get(id) || null;
        if (!target) errors.push("No product of yours matches this product ID");
        else if (seenIds.has(id)) errors.push("This product appears twice in the file");
        else seenIds.add(id);
      } else {
        const name = String(row.productName ?? "").trim();
        const cat = String(row.category ?? "").trim();
        if (!name) errors.push("Product name is required to match a product");
        else if (!cat) errors.push("Category is required to match by name");
        else {
          const matches = byNameCategory.get(`${key(name)}|${key(cat)}`) || [];
          if (matches.length === 0) {
            errors.push(`You have no "${name}" in ${cat}`);
          } else if (matches.length > 1) {
            errors.push(
              `"${name}" appears ${matches.length} times in ${cat} at different prices — use "Download my menu" so each row carries its ID`
            );
          } else if (seenIds.has(String(matches[0]._id))) {
            errors.push("This product appears twice in the file");
          } else {
            target = matches[0];
            seenIds.add(String(target._id));
          }
        }
      }
    }

    // ── name ────────────────────────────────────────────────────────────
    const name = String(row.productName ?? "").trim();
    if (mode === "create") {
      if (!name) errors.push("Product name is required");
      else if (name.length > MAX_NAME_LENGTH) {
        errors.push(`Name must be ${MAX_NAME_LENGTH} characters or fewer`);
      }
      resolved.productName = name;
    } else {
      resolved.productName = target ? target.productName : name;
    }

    // ── category ────────────────────────────────────────────────────────
    const catInput = String(row.category ?? "").trim();
    if (catInput) {
      const matched = matchCategory(catInput, categories);
      if (!matched) errors.push(`"${catInput}" is not a valid category`);
      resolved.category = matched || catInput;
    } else if (mode === "create") {
      errors.push("Category is required");
      resolved.category = "";
    } else {
      resolved.category = target ? target.category : "";
    }

    // ── price ───────────────────────────────────────────────────────────
    const rawPrice = row.price;
    const hasPrice = rawPrice !== undefined && String(rawPrice).trim() !== "";
    if (hasPrice) {
      const parsed = parsePrice(rawPrice);
      if (parsed === undefined) errors.push("Price must be a number above 0");
      resolved.price = parsed;
    } else if (mode === "create") {
      errors.push("Price is required");
    } else {
      resolved.price = target ? target.price : undefined;
    }

    // ── availability ────────────────────────────────────────────────────
    const avail = parseAvailable(row.available);
    if (avail === null) errors.push('Availability must be "true" or "false"');
    else if (avail !== undefined) resolved.available = avail;

    // ── image ───────────────────────────────────────────────────────────
    const manual = manualImages.get(row.rowNumber);
    let image = manual || null;
    let imageStatus = manual ? "manual" : "empty";

    if (!manual) {
      const match = matchImageForRow(row, imageIndex);
      imageStatus = match.status;
      image = match.file || null;

      if (match.status === "ambiguous") {
        errors.push(
          `Two selected files are named "${row.imageFile}" — rename one`
        );
      }
    }

    if (mode === "create" && !image && imageStatus !== "ambiguous") {
      errors.push(
        imageStatus === "missing"
          ? `No selected photo is named "${row.imageFile}"`
          : "This row needs a photo"
      );
    }

    // ── duplicates ──────────────────────────────────────────────────────
    if (resolved.productName && resolved.category && resolved.price) {
      const k = productKey(
        resolved.productName,
        resolved.category,
        resolved.price
      );

      const firstRow = seenKeys.get(k);
      if (firstRow !== undefined) {
        errors.push(`Same name, category and price as row ${firstRow + 1}`);
      } else {
        seenKeys.set(k, row.rowNumber);
      }

      const clash = existingByKey.get(k);
      const isSelf = target && clash && String(clash._id) === String(target._id);
      if (clash && !isSelf) {
        errors.push(
          `Already on your menu: ${resolved.productName} · ${resolved.category} · ₦${resolved.price}`
        );
      }
    }

    return { ...row, errors, image, imageStatus, resolved, target };
  });
};
