/**
 * Spreadsheet parsing and image matching for the vendor bulk-upload wizard.
 *
 * Kept out of the page component so the matching rules — which decide what a
 * vendor's data actually means — can be reasoned about on their own.
 */
import Papa from "papaparse";

/** Columns the template ships with. Extra columns are ignored, not an error. */
export const TEMPLATE_COLUMNS = [
  "productName",
  "price",
  "category",
  "available",
  "imageFile",
];

/**
 * Header aliases. Vendors rename columns, add spaces, or translate them —
 * matching loosely here saves a support conversation later.
 */
const HEADER_ALIASES = {
  productname: "productName",
  "product name": "productName",
  name: "productName",
  product: "productName",
  item: "productName",
  "item name": "productName",

  price: "price",
  amount: "price",
  cost: "price",
  "unit price": "price",

  category: "category",
  type: "category",
  "product category": "category",

  available: "available",
  availability: "available",
  "in stock": "available",
  status: "available",

  imagefile: "imageFile",
  "image file": "imageFile",
  image: "imageFile",
  photo: "imageFile",
  picture: "imageFile",
  "image name": "imageFile",
  filename: "imageFile",
  "file name": "imageFile",

  productid: "productId",
  "product id": "productId",
  id: "productId",
  _id: "productId",
};

const normaliseHeader = (header) => {
  const key = String(header ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  return HEADER_ALIASES[key] || HEADER_ALIASES[key.replace(/\s/g, "")] || null;
};

/** Maps a raw parsed row onto our canonical field names. */
const normaliseRow = (raw, index) => {
  const row = { rowNumber: index };

  Object.entries(raw).forEach(([header, value]) => {
    const field = normaliseHeader(header);
    if (!field) return;
    row[field] = typeof value === "string" ? value.trim() : value;
  });

  return row;
};

/** True when every canonical field on the row is blank. */
const isBlankRow = (row) =>
  !TEMPLATE_COLUMNS.some((c) => String(row[c] ?? "").trim() !== "") &&
  !String(row.productId ?? "").trim();

/**
 * Parses a CSV or Excel file into canonical rows.
 * Excel support is dynamically imported so SheetJS stays out of the main bundle.
 *
 * @returns {Promise<{ rows: object[], headers: string[] }>}
 */
export const parseSpreadsheet = async (file) => {
  const name = file.name.toLowerCase();
  let rawRows = [];
  let headers = [];

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: true,
      skipEmptyLines: "greedy",
    });
    rawRows = parsed.data;
    headers = parsed.meta.fields || [];
  } else if (/\.(xlsx|xls|xlsm)$/.test(name)) {
    const XLSX = await import("xlsx");
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) throw new Error("That spreadsheet has no sheets in it.");

    rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const headerRow = XLSX.utils.sheet_to_json(sheet, { header: 1 })[0] || [];
    headers = headerRow.map(String);
  } else {
    throw new Error("Upload a .csv or .xlsx file.");
  }

  // Check the headers before the rows. A file with the wrong columns parses
  // to zero usable rows, and "no product rows" would send the vendor looking
  // at their data when the real problem is the header line.
  const recognised = headers.map(normaliseHeader).filter(Boolean);
  if (!recognised.includes("productName")) {
    throw new Error(
      `Couldn't find a product name column. Your file has: ${
        headers.filter(Boolean).join(", ") || "no headers"
      }. Rename one column to "productName".`
    );
  }

  const rows = rawRows.map(normaliseRow).filter((r) => !isBlankRow(r));

  if (rows.length === 0) {
    throw new Error("That file has headers but no product rows.");
  }

  return { rows, headers };
};

/* ── Image matching ─────────────────────────────────────────────────────── */

/** Strips any folder path and lowercases — "C:\pics\Jollof.JPG" -> "jollof.jpg" */
const baseName = (value) =>
  String(value ?? "")
    .trim()
    .split(/[\\/]/)
    .pop()
    .toLowerCase();

/** Filename without its extension — "jollof.jpg" -> "jollof" */
const stem = (value) => baseName(value).replace(/\.[^.]+$/, "");

/**
 * Indexes selected files by full name and by stem.
 *
 * A stem claimed by two different files (same name in two folders) is marked
 * ambiguous rather than silently resolved, so the vendor is told instead of
 * getting the wrong photo on a product.
 */
export const indexImageFiles = (files) => {
  const byName = new Map();
  const byStem = new Map();
  const ambiguousStems = new Set();

  files.forEach((file) => {
    const full = baseName(file.name);
    const s = stem(file.name);

    if (!byName.has(full)) byName.set(full, file);

    if (byStem.has(s) && byStem.get(s) !== file) ambiguousStems.add(s);
    else byStem.set(s, file);
  });

  return { byName, byStem, ambiguousStems, all: files };
};

/**
 * Resolves one row's `imageFile` cell against the selected files.
 *
 * Matching is by filename only — never by row order or file order — so
 * re-sorting the spreadsheet cannot change which photo lands on which product.
 *
 * @returns {{ file?: File, status: "matched"|"empty"|"missing"|"ambiguous" }}
 */
export const matchImageForRow = (row, index) => {
  const cell = String(row.imageFile ?? "").trim();
  if (!cell) return { status: "empty" };
  if (!index) return { status: "missing" };

  const full = baseName(cell);
  const exact = index.byName.get(full);
  if (exact) return { file: exact, status: "matched" };

  const s = stem(cell);
  if (index.ambiguousStems.has(s)) return { status: "ambiguous" };

  const byStem = index.byStem.get(s);
  if (byStem) return { file: byStem, status: "matched" };

  return { status: "missing" };
};

/** Files that no row referenced — usually a typo in the spreadsheet. */
export const unusedImages = (index, rows) => {
  if (!index) return [];
  const used = new Set();

  rows.forEach((row) => {
    const { file } = matchImageForRow(row, index);
    if (file) used.add(file);
  });

  return index.all.filter((f) => !used.has(f));
};

/* ── Template generation ────────────────────────────────────────────────── */

const csvCell = (value) => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const buildCsv = (columns, rows) =>
  [
    columns.join(","),
    ...rows.map((r) => columns.map((c) => csvCell(r[c])).join(",")),
  ].join("\n");

export const downloadCsv = (filename, csv) => {
  // BOM so Excel opens UTF-8 correctly — without it, "₦" and "&" mangle.
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
