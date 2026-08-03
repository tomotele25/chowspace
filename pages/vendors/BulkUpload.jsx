"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  X,
  LayoutDashboard,
  PackageOpen,
  LogOut,
  MapPin,
  UtensilsCrossed,
  Settings,
  Menu,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileSpreadsheet,
  ImagePlus,
  Download,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
  Pencil,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import imageCompression from "browser-image-compression";

import { BACKENDURL } from "@/lib/api";
import { PRODUCT_CATEGORIES } from "@/constants/productCategories";
import {
  parseSpreadsheet,
  indexImageFiles,
  unusedImages,
  buildCsv,
  downloadCsv,
  TEMPLATE_COLUMNS,
} from "@/lib/bulkParse";
import { validateRows, CHUNK_SIZE } from "@/lib/bulkValidate";

const STEPS = ["Mode", "Spreadsheet", "Photos", "Review", "Done"];

const navLinks = [
  { href: "/vendors/Dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendors/ManageLocation", label: "Locations", icon: MapPin },
  { href: "/manager/ManagerOrder", label: "Orders", icon: UtensilsCrossed },
  { href: "/vendors/ManageProducts", label: "Products", icon: PackageOpen },
  {
    href: "/vendors/BulkUpload",
    label: "Bulk Upload",
    icon: UploadCloud,
    active: true,
  },
  { href: "/manager/Profile", label: "Profile", icon: Settings },
];

/** Reads a dropped folder recursively — dropping a folder gives entries, not files. */
const filesFromDataTransfer = async (dataTransfer) => {
  const items = Array.from(dataTransfer.items || []);
  const entries = items
    .map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null))
    .filter(Boolean);

  if (entries.length === 0) return Array.from(dataTransfer.files || []);

  const out = [];
  const readEntry = async (entry) => {
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      out.push(file);
      return;
    }
    if (entry.isDirectory) {
      const reader = entry.createReader();
      // readEntries returns at most 100 at a time.
      let batch;
      do {
        batch = await new Promise((res, rej) => reader.readEntries(res, rej));
        for (const child of batch) await readEntry(child);
      } while (batch.length > 0);
    }
  };

  for (const entry of entries) await readEntry(entry);
  return out;
};

const isImage = (file) =>
  /^image\//.test(file.type) || /\.(jpe?g|png|webp|heic|heif|gif)$/i.test(file.name);

export default function BulkUpload() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [categories, setCategories] = useState(PRODUCT_CATEGORIES);
  const [existingProducts, setExistingProducts] = useState([]);
  const [loadingContext, setLoadingContext] = useState(true);

  const [rawRows, setRawRows] = useState([]);
  const [fileName, setFileName] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [manualImages, setManualImages] = useState(new Map());
  const [edits, setEdits] = useState(new Map()); // rowNumber -> partial overrides
  const [removed, setRemoved] = useState(new Set());

  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState(null);

  const sheetInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const folderInputRef = useRef(null);
  const rowImageInputRef = useRef(null);
  const rowImageTarget = useRef(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status, router]);

  /* ── Context: categories + the vendor's current menu ──────────────────── */
  useEffect(() => {
    if (!session?.user?.accessToken) return;

    const load = async () => {
      try {
        const [cats, prods] = await Promise.allSettled([
          axios.get(`${BACKENDURL}/api/product-categories`),
          axios.get(`${BACKENDURL}/api/product/my-products`, {
            headers: { Authorization: `Bearer ${session.user.accessToken}` },
          }),
        ]);

        if (cats.status === "fulfilled") {
          const names = (cats.value.data.categories || []).map((c) => c.name);
          if (names.length) setCategories(names);
        }
        if (prods.status === "fulfilled") {
          setExistingProducts(prods.value.data.products || []);
        } else {
          toast.error("Couldn't load your current menu");
        }
      } finally {
        setLoadingContext(false);
      }
    };
    load();
  }, [session]);

  /* ── Derived: validated rows ──────────────────────────────────────────── */
  const imageIndex = useMemo(
    () => (imageFiles.length ? indexImageFiles(imageFiles) : null),
    [imageFiles]
  );

  const rows = useMemo(() => {
    const applied = rawRows
      .filter((r) => !removed.has(r.rowNumber))
      .map((r) => ({ ...r, ...(edits.get(r.rowNumber) || {}) }));

    return validateRows(applied, {
      mode: mode || "create",
      categories,
      existingProducts,
      imageIndex,
      manualImages,
    });
  }, [
    rawRows,
    removed,
    edits,
    mode,
    categories,
    existingProducts,
    imageIndex,
    manualImages,
  ]);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);
  const matchedCount = rows.filter((r) => r.image).length;
  const unused = useMemo(
    () => (imageIndex ? unusedImages(imageIndex, rows) : []),
    [imageIndex, rows]
  );

  /* ── Templates ────────────────────────────────────────────────────────── */
  const downloadTemplate = () => {
    const sample = [
      {
        productName: "Jollof Rice",
        price: 2500,
        category: categories[3] || "Rice Dishes",
        available: "true",
        imageFile: "jollof.jpg",
      },
      {
        productName: "Suya",
        price: 1500,
        category: categories[7] || "Grilled/Fried",
        available: "true",
        imageFile: "suya.jpg",
      },
    ];
    downloadCsv("chowspace-products-template.csv", buildCsv(TEMPLATE_COLUMNS, sample));
    toast.success("Template downloaded");
  };

  const downloadCurrentMenu = () => {
    if (existingProducts.length === 0) {
      toast.error("You have no products to export yet");
      return;
    }
    const columns = ["productId", "productName", "category", "price", "available"];
    const csv = buildCsv(
      columns,
      existingProducts.map((p) => ({
        productId: p._id,
        productName: p.productName,
        category: p.category,
        price: p.price,
        available: p.available,
      }))
    );
    downloadCsv("chowspace-my-menu.csv", csv);
    toast.success(`Exported ${existingProducts.length} products`);
  };

  /* ── File handling ────────────────────────────────────────────────────── */
  const handleSpreadsheet = async (file) => {
    if (!file) return;
    try {
      const { rows: parsed } = await parseSpreadsheet(file);
      setRawRows(parsed);
      setFileName(file.name);
      setEdits(new Map());
      setRemoved(new Set());
      setManualImages(new Map());
      toast.success(`Read ${parsed.length} rows`);
      setStep(mode === "update" ? 3 : 2);
    } catch (err) {
      toast.error(err.message || "Couldn't read that file");
    }
  };

  const addImages = (files) => {
    const images = Array.from(files).filter(isImage);
    if (images.length === 0) {
      toast.error("No image files in that selection");
      return;
    }
    setImageFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}:${f.size}`));
      const merged = [...prev];
      images.forEach((f) => {
        if (!seen.has(`${f.name}:${f.size}`)) merged.push(f);
      });
      return merged;
    });
    toast.success(`${images.length} photo${images.length === 1 ? "" : "s"} added`);
  };

  const onDrop = useCallback(
    async (e, kind) => {
      e.preventDefault();
      setDragging(false);
      if (kind === "sheet") {
        const file = e.dataTransfer.files?.[0];
        if (file) handleSpreadsheet(file);
      } else {
        const files = await filesFromDataTransfer(e.dataTransfer);
        addImages(files);
      }
    },
    [mode]
  );

  /* ── Import ───────────────────────────────────────────────────────────── */
  const runImport = async () => {
    if (validRows.length === 0) return;

    setImporting(true);
    setProgress({ done: 0, total: validRows.length });

    const chunks = [];
    for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
      chunks.push(validRows.slice(i, i + CHUNK_SIZE));
    }

    const created = [];
    const failed = [];

    for (const chunk of chunks) {
      const form = new FormData();
      form.append("mode", mode);
      form.append(
        "products",
        JSON.stringify(
          chunk.map((r) => ({
            rowNumber: r.rowNumber,
            productId: r.target?._id || r.productId || undefined,
            productName: r.resolved.productName,
            category: r.resolved.category,
            price: r.resolved.price,
            available: r.resolved.available,
          }))
        )
      );

      for (const r of chunk) {
        if (!r.image) continue;
        try {
          // Cloudinary crops to 500x500 anyway, and HEIC must become JPEG or
          // the upload is rejected outright.
          const compressed = await imageCompression(r.image, {
            maxWidthOrHeight: 1000,
            maxSizeMB: 0.4,
            useWebWorker: true,
            fileType: "image/jpeg",
          });
          form.append(`image_${r.rowNumber}`, compressed, `${r.rowNumber}.jpg`);
        } catch {
          form.append(`image_${r.rowNumber}`, r.image);
        }
      }

      try {
        const res = await axios.post(`${BACKENDURL}/api/product/bulk`, form, {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        });
        created.push(...(res.data.results || []));
        failed.push(...(res.data.failed || []));
      } catch (err) {
        const message =
          err.response?.data?.message || "Upload failed — check your connection";
        chunk.forEach((r) =>
          failed.push({
            rowNumber: r.rowNumber,
            productName: r.resolved.productName,
            message,
          })
        );
      }

      setProgress((p) => ({ ...p, done: p.done + chunk.length }));
    }

    setResult({ created, failed });
    setImporting(false);
    setStep(4);

    if (failed.length === 0) {
      toast.success(
        `${created.length} product${created.length === 1 ? "" : "s"} ${
          mode === "create" ? "added" : "updated"
        }`
      );
    } else {
      toast.error(`${failed.length} row${failed.length === 1 ? "" : "s"} failed`);
    }
  };

  const resetAll = () => {
    setStep(0);
    setMode(null);
    setRawRows([]);
    setFileName("");
    setImageFiles([]);
    setManualImages(new Map());
    setEdits(new Map());
    setRemoved(new Set());
    setResult(null);
  };

  /* ── Small pieces ─────────────────────────────────────────────────────── */
  const DropZone = ({ kind, icon: Icon, title, hint, onPick }) => (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => onDrop(e, kind)}
      onClick={onPick}
      className={`w-full rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition ${
        dragging
          ? "border-[#AE2108] bg-red-50"
          : "border-gray-200 bg-white hover:border-[#AE2108]"
      }`}
    >
      <Icon size={34} className="mx-auto text-gray-300 mb-3" />
      <p className="font-bold text-gray-900 text-sm">{title}</p>
      <p className="text-xs text-gray-400 mt-1">{hint}</p>
    </div>
  );

  const updateEdit = (rowNumber, field, value) => {
    setEdits((prev) => {
      const next = new Map(prev);
      next.set(rowNumber, { ...(next.get(rowNumber) || {}), [field]: value });
      return next;
    });
  };

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen bg-[#F7F5F2] overflow-hidden">
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" },
        }}
      />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white flex flex-col justify-between border-r border-gray-100 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#AE2108] flex items-center justify-center">
                <PackageOpen size={15} className="text-white" />
              </span>
              <span className="text-lg font-black text-gray-900 tracking-tight">
                Chowspace
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-400"
            >
              <X size={18} />
            </button>
          </div>
          <div className="px-3 py-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">
              Menu
            </p>
            <nav className="space-y-0.5">
              {navLinks.map(({ href, label, icon: Icon, active }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-[#AE2108]/10 text-[#AE2108]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={17} />
                  {label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#AE2108]" />
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: "/Login" })}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 w-full transition-all"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-20 bg-[#F7F5F2]/90 backdrop-blur-md border-b border-gray-200/60 px-4 sm:px-6 py-3 flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-600"
            >
              <Menu size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight leading-tight">
                Bulk Upload
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-400">
                {STEPS[step]} · step {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push("/vendors/ManageProducts")}
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <ChevronLeft size={16} /> Products
          </button>
        </header>

        {/* Progress rail */}
        <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    i <= step ? "bg-[#AE2108]" : "bg-gray-200"
                  }`}
                />
                <p
                  className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider hidden sm:block ${
                    i <= step ? "text-[#AE2108]" : "text-gray-300"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
          {/* ── Step 0: mode ────────────────────────────────────────────── */}
          {step === 0 && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-lg font-black text-gray-900 mb-1">
                What would you like to do?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Upload a spreadsheet to add your whole menu at once, or update
                prices on products you already have.
              </p>

              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setMode("create");
                    setStep(1);
                  }}
                  className="text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-[#AE2108] p-5 transition group"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#AE2108]/10 flex items-center justify-center mb-3">
                    <Plus size={18} className="text-[#AE2108]" />
                  </span>
                  <p className="font-black text-gray-900 text-sm">
                    Add new products
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Upload a spreadsheet plus your photos. Every row becomes a
                    new item on your menu.
                  </p>
                </button>

                <button
                  onClick={() => {
                    setMode("update");
                    setStep(1);
                  }}
                  className="text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-[#AE2108] p-5 transition group"
                >
                  <span className="w-10 h-10 rounded-xl bg-[#AE2108]/10 flex items-center justify-center mb-3">
                    <Pencil size={18} className="text-[#AE2108]" />
                  </span>
                  <p className="font-black text-gray-900 text-sm">
                    Update existing prices
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Export your current menu, edit the prices, upload it back.
                    Photos are optional.
                  </p>
                </button>
              </div>

              {!loadingContext && (
                <p className="text-xs text-gray-400 mt-5 text-center">
                  You currently have{" "}
                  <span className="font-bold text-gray-600">
                    {existingProducts.length}
                  </span>{" "}
                  products on your menu.
                </p>
              )}
            </div>
          )}

          {/* ── Step 1: spreadsheet ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <p className="font-black text-gray-900 text-sm mb-1">
                  {mode === "create"
                    ? "1. Start from the template"
                    : "1. Export your current menu"}
                </p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                  {mode === "create"
                    ? "Fill one row per product. The imageFile column should hold the exact filename of that product's photo."
                    : "Each row carries its product ID so we know exactly which item to update. Change the price column, leave everything else alone."}
                </p>
                <button
                  onClick={
                    mode === "create" ? downloadTemplate : downloadCurrentMenu
                  }
                  className="flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-gray-800 transition"
                >
                  <Download size={15} />
                  {mode === "create"
                    ? "Download template"
                    : `Download my menu (${existingProducts.length})`}
                </button>
              </div>

              <div>
                <p className="font-black text-gray-900 text-sm mb-2">
                  2. Upload your filled-in file
                </p>
                <DropZone
                  kind="sheet"
                  icon={FileSpreadsheet}
                  title="Drop your CSV or Excel file here"
                  hint="or tap to browse · .csv, .xlsx"
                  onPick={() => sheetInputRef.current?.click()}
                />
                <input
                  ref={sheetInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.xlsm,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    handleSpreadsheet(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>

              <button
                onClick={() => setStep(0)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-900"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Step 2: photos ──────────────────────────────────────────── */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                <FileSpreadsheet size={18} className="text-[#AE2108]" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {fileName}
                  </p>
                  <p className="text-xs text-gray-400">
                    {rawRows.length} rows ready
                  </p>
                </div>
              </div>

              <DropZone
                kind="images"
                icon={ImagePlus}
                title="Drop your photo folder here"
                hint="or tap to choose files · we match them by filename"
                onPick={() => imageInputRef.current?.click()}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => imageInputRef.current?.click()}
                  className="flex-1 text-xs font-bold text-gray-700 bg-white border-2 border-gray-200 rounded-xl py-2.5 hover:border-[#AE2108] transition"
                >
                  Choose files
                </button>
                <button
                  onClick={() => folderInputRef.current?.click()}
                  className="flex-1 text-xs font-bold text-gray-700 bg-white border-2 border-gray-200 rounded-xl py-2.5 hover:border-[#AE2108] transition"
                >
                  Choose a folder
                </button>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
              />
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={(e) => {
                  addImages(e.target.files);
                  e.target.value = "";
                }}
              />

              {imageFiles.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-black text-gray-900">
                      {matchedCount} of {rows.length} rows matched
                    </p>
                    <button
                      onClick={() => setImageFiles([])}
                      className="text-xs font-semibold text-gray-400 hover:text-red-500"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full bg-[#AE2108] transition-all"
                      style={{
                        width: `${rows.length ? (matchedCount / rows.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {unused.length > 0 && (
                    <p className="text-xs text-amber-600 mt-2.5 flex items-start gap-1.5">
                      <AlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
                      {unused.length} photo{unused.length === 1 ? "" : "s"} not
                      referenced by any row — check the imageFile column for typos
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => setStep(1)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 bg-[#AE2108] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#941B06] transition"
                >
                  Review {rows.length} rows <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: review ──────────────────────────────────────────── */}
          {step === 3 && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Ready", value: validRows.length, tone: "text-green-600" },
                  {
                    label: "Need fixing",
                    value: invalidRows.length,
                    tone: "text-red-500",
                  },
                  { label: "Total", value: rows.length, tone: "text-gray-900" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="bg-white rounded-2xl border border-gray-100 p-3 text-center"
                  >
                    <p className={`text-xl font-black ${s.tone}`}>{s.value}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {invalidRows.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle
                    size={17}
                    className="text-red-500 mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-red-900">
                      {invalidRows.length} row
                      {invalidRows.length === 1 ? "" : "s"} can&apos;t be imported
                    </p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Fix them below, or remove them and import the rest.
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setRemoved((prev) => {
                        const next = new Set(prev);
                        invalidRows.forEach((r) => next.add(r.rowNumber));
                        return next;
                      })
                    }
                    className="text-xs font-bold text-red-600 border border-red-200 bg-white px-3 py-2 rounded-lg hover:bg-red-100 transition flex-shrink-0"
                  >
                    Remove all
                  </button>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[720px]">
                    <thead>
                      <tr className="border-b border-gray-100">
                        {["", "Product", "Category", "Price", "Photo", ""].map(
                          (h, i) => (
                            <th
                              key={i}
                              className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-3"
                            >
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {rows.map((row) => {
                        const bad = row.errors.length > 0;
                        return (
                          <tr
                            key={row.rowNumber}
                            className={bad ? "bg-red-50/40" : ""}
                          >
                            <td className="px-3 py-2.5 align-top">
                              {bad ? (
                                <AlertTriangle
                                  size={15}
                                  className="text-red-500"
                                />
                              ) : (
                                <CheckCircle2
                                  size={15}
                                  className="text-green-500"
                                />
                              )}
                            </td>

                            <td className="px-3 py-2.5 align-top">
                              <input
                                value={
                                  edits.get(row.rowNumber)?.productName ??
                                  row.productName ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateEdit(
                                    row.rowNumber,
                                    "productName",
                                    e.target.value
                                  )
                                }
                                disabled={mode === "update"}
                                className="w-full min-w-[130px] text-sm font-semibold text-gray-900 bg-transparent border border-transparent hover:border-gray-200 focus:border-[#AE2108] rounded-lg px-2 py-1 outline-none disabled:text-gray-500"
                              />
                              {bad && (
                                <ul className="mt-1 space-y-0.5">
                                  {row.errors.map((e, i) => (
                                    <li
                                      key={i}
                                      className="text-[11px] text-red-600 leading-snug"
                                    >
                                      {e}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>

                            <td className="px-3 py-2.5 align-top">
                              <select
                                value={
                                  edits.get(row.rowNumber)?.category ??
                                  row.category ??
                                  ""
                                }
                                onChange={(e) =>
                                  updateEdit(
                                    row.rowNumber,
                                    "category",
                                    e.target.value
                                  )
                                }
                                className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:border-[#AE2108] min-w-[130px]"
                              >
                                <option value="">Select…</option>
                                {categories.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            </td>

                            <td className="px-3 py-2.5 align-top">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-400">₦</span>
                                <input
                                  value={
                                    edits.get(row.rowNumber)?.price ??
                                    row.price ??
                                    ""
                                  }
                                  onChange={(e) =>
                                    updateEdit(
                                      row.rowNumber,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  className="w-20 text-sm font-bold text-gray-900 bg-transparent border border-transparent hover:border-gray-200 focus:border-[#AE2108] rounded-lg px-1.5 py-1 outline-none"
                                />
                              </div>
                              {mode === "update" &&
                                row.target &&
                                row.resolved.price !== row.target.price && (
                                  <p className="text-[10px] text-gray-400 mt-0.5">
                                    was ₦{row.target.price}
                                  </p>
                                )}
                            </td>

                            <td className="px-3 py-2.5 align-top">
                              {row.image ? (
                                <div className="flex items-center gap-1.5">
                                  <img
                                    src={URL.createObjectURL(row.image)}
                                    alt=""
                                    className="w-9 h-9 rounded-lg object-cover border border-gray-200"
                                  />
                                  <span className="text-[10px] text-gray-400 max-w-[70px] truncate">
                                    {row.image.name}
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    rowImageTarget.current = row.rowNumber;
                                    rowImageInputRef.current?.click();
                                  }}
                                  className="flex items-center gap-1 text-[11px] font-bold text-[#AE2108] border border-dashed border-[#AE2108]/40 rounded-lg px-2 py-1.5 hover:bg-red-50 transition"
                                >
                                  <ImagePlus size={12} /> Add
                                </button>
                              )}
                            </td>

                            <td className="px-3 py-2.5 align-top">
                              <button
                                onClick={() =>
                                  setRemoved((prev) =>
                                    new Set(prev).add(row.rowNumber)
                                  )
                                }
                                className="text-gray-300 hover:text-red-500 transition"
                                title="Remove this row"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <input
                ref={rowImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  const target = rowImageTarget.current;
                  if (file && target !== null) {
                    setManualImages((prev) => new Map(prev).set(target, file));
                  }
                  e.target.value = "";
                  rowImageTarget.current = null;
                }}
              />

              <div className="flex items-center justify-between gap-3 pb-4">
                <button
                  onClick={() => setStep(mode === "update" ? 1 : 2)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                >
                  ← Back
                </button>

                <button
                  onClick={runImport}
                  disabled={validRows.length === 0 || invalidRows.length > 0 || importing}
                  className="flex items-center gap-2 bg-[#AE2108] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#941B06] transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {progress.done} / {progress.total}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {mode === "create" ? "Import" : "Update"} {validRows.length}{" "}
                      product{validRows.length === 1 ? "" : "s"}
                    </>
                  )}
                </button>
              </div>

              {invalidRows.length > 0 && (
                <p className="text-center text-xs text-gray-400 -mt-2 pb-4">
                  Fix or remove the {invalidRows.length} flagged row
                  {invalidRows.length === 1 ? "" : "s"} to continue
                </p>
              )}
            </div>
          )}

          {/* ── Step 4: done ────────────────────────────────────────────── */}
          {step === 4 && result && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <span
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    result.failed.length === 0 ? "bg-green-50" : "bg-amber-50"
                  }`}
                >
                  {result.failed.length === 0 ? (
                    <CheckCircle2 size={26} className="text-green-500" />
                  ) : (
                    <AlertTriangle size={26} className="text-amber-500" />
                  )}
                </span>
                <h2 className="text-lg font-black text-gray-900">
                  {result.created.length} product
                  {result.created.length === 1 ? "" : "s"}{" "}
                  {mode === "create" ? "added" : "updated"}
                </h2>
                {result.failed.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {result.failed.length} row
                    {result.failed.length === 1 ? "" : "s"} couldn&apos;t be saved
                  </p>
                )}
              </div>

              {result.failed.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4 pt-4 pb-2">
                    What went wrong
                  </p>
                  <ul className="divide-y divide-gray-50">
                    {result.failed.map((f, i) => (
                      <li key={i} className="px-4 py-3">
                        <p className="text-sm font-bold text-gray-900">
                          {f.productName || `Row ${f.rowNumber + 1}`}
                        </p>
                        <p className="text-xs text-red-600 mt-0.5">{f.message}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={resetAll}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white border-2 border-gray-200 text-gray-700 text-sm font-bold py-3 rounded-xl hover:border-[#AE2108] transition"
                >
                  <RefreshCw size={15} /> Import more
                </button>
                <button
                  onClick={() => router.push("/vendors/ManageProducts")}
                  className="flex-1 bg-[#AE2108] text-white text-sm font-bold py-3 rounded-xl hover:bg-[#941B06] transition"
                >
                  Go to Products
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
