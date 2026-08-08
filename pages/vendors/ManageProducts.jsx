"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  Plus,
  X,
  PackageOpen,
  Save,
  GripVertical,
  Search,
  AlertTriangle,
  ImagePlus,
  SlidersHorizontal,
} from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";

import VendorLayout from "@/components/layouts/VendorLayout";
import ManagerLayout from "@/components/layouts/ManagerLayout";

const ProductDragGrid = dynamic(
  () => import("@/components/vendor/ProductDragGrid"),
  { ssr: false },
);

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ManageProducts() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const BACKENDURL = "https://chowspace-backend.vercel.app";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    available: true,
    image: null,
    imagePreview: null,
  });
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    "African",
    "Fast Food",
    "Pastry",
    "Rice Dishes",
    "Swallows",
    "Soups & Stews",
    "Snacks",
    "Grilled/Fried",
    "Beverages",
    "Smoothies",
    "Small Chops",
    "Shawarma & Sandwiches",
    "Bakery",
    "Drinks",
    "Desserts",
    "Breakfast",
    "Lunch",
    "Dinner",
  ];

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/product/my-products`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        });
        setProducts(res.data.products || []);
      } catch {
        toast.error("Failed to load products");
      } finally {
        setPageLoading(false);
      }
    };
    if (session?.user?.accessToken) fetch();
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((p) => ({
      ...p,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file)
      setFormData((p) => ({
        ...p,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
  };

  const openAdd = () => {
    setEditMode(false);
    setEditId(null);
    setFormData({
      name: "",
      price: "",
      category: "",
      available: true,
      image: null,
      imagePreview: null,
    });
    setShowModal(true);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.productName,
      price: product.price,
      category: product.category,
      available: product.available,
      image: null,
      imagePreview: product.image?.startsWith("http")
        ? product.image
        : `${BACKENDURL}/uploads/${product.image}`,
    });
    setEditId(product._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await axios.delete(`${BACKENDURL}/api/product-delete/${deleteId}`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
      });
      setProducts((p) => p.filter((x) => x._id !== deleteId));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setShowDeleteModal(false);
      setDeleteId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const form = new FormData();
      form.append("productName", formData.name);
      form.append("price", formData.price);
      form.append("category", formData.category);
      form.append("available", formData.available);
      if (formData.image) form.append("image", formData.image);
      const res = await axios({
        method: editMode ? "patch" : "post",
        url: editMode
          ? `${BACKENDURL}/api/product/update/${editId}`
          : `${BACKENDURL}/api/product/createProduct`,
        data: form,
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success(editMode ? "Product updated!" : "Product added!");
      setProducts((p) =>
        editMode
          ? p.map((x) => (x._id === editId ? res.data.product : x))
          : [res.data.product, ...p],
      );
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    setProducts((p) =>
      p.map((x) => (x._id === id ? { ...x, available: !x.available } : x)),
    );
    try {
      await axios.patch(
        `${BACKENDURL}/api/product/${id}/toggle-availability`,
        {},
        {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        },
      );
    } catch {
      toast.error("Failed to update");
      setProducts((p) =>
        p.map((x) => (x._id === id ? { ...x, available: !x.available } : x)),
      );
    }
  };

  const saveReorder = async () => {
    try {
      await axios.patch(
        `${BACKENDURL}/api/product/rearrange`,
        { products: products.map((p, i) => ({ id: p._id, position: i })) },
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } },
      );
      toast.success("Order saved!");
    } catch {
      toast.error("Failed to save order");
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.productName.toLowerCase().includes(search.toLowerCase()) &&
      (filterCat === "All" || p.category === filterCat),
  );
  const availableCount = products.filter((p) => p.available).length;

  // This page is reachable by vendors and by their managers, so the sidebar
  // has to match who is looking at it — a manager seeing the vendor's full
  // menu (Wallet, Team, Verification) would be shown routes they can't open.
  const Layout = role === "manager" ? ManagerLayout : VendorLayout;

  return (
    <Layout
      title="Products"
      subtitle={`${availableCount} of ${products.length} live`}
      actions={
        <>
          {/* Filter toggle — mobile only */}
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`sm:hidden w-9 h-9 flex items-center justify-center rounded-lg border-2 transition-all ${showFilters ? "border-[#AE2108] text-[#AE2108] bg-red-50" : "border-gray-200 text-gray-600 bg-white"}`}
          >
            <SlidersHorizontal size={16} />
          </button>

          {/* Save order */}
          <button
            onClick={saveReorder}
            className="flex items-center gap-1.5 bg-white border-2 border-gray-200 text-gray-700 text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-2 rounded-xl hover:border-green-400 hover:text-green-600 transition-all"
          >
            <Save size={15} />
            <span className="hidden sm:inline">Save Order</span>
          </button>

          {/* Add product */}
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 bg-[#AE2108] text-white text-xs sm:text-sm font-bold px-3 sm:px-4 py-2 rounded-xl hover:bg-[#941B06] transition-all shadow-md shadow-red-200"
          >
            <Plus size={15} />
            <span className="hidden xs:inline">Add</span>
            <span className="hidden sm:inline"> Product</span>
          </button>
        </>
      }
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontWeight: 600, fontSize: "13px" },
        }}
      />

      {/* Filters — collapsible on mobile, always on desktop */}
      <div
        className={`bg-white border-b border-gray-100 flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${showFilters ? "max-h-52" : "max-h-0"} sm:max-h-none sm:overflow-visible`}
      >
        <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-52 flex-shrink-0">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-4 py-2 text-sm border-2 border-gray-200 rounded-xl focus:border-[#AE2108] focus:outline-none w-full font-medium"
            />
          </div>
          {/* Category pills */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {["All", ...categories].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex-shrink-0 transition-all ${
                  filterCat === cat
                    ? "bg-[#AE2108] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FIX 2: Drag hint banner — now visible on ALL screen sizes */}
      <div className="px-4 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 flex-shrink-0">
        <GripVertical size={13} className="text-amber-500 flex-shrink-0" />
        <p className="text-[11px] text-amber-700 font-semibold">
          Hover a card and drag the <span className="font-black">⠿</span> handle
          to reorder, then hit <span className="font-black">Save Order</span>
        </p>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
        {pageLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden animate-pulse"
              >
                <div className="h-36 sm:h-40 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-7 bg-gray-100 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <PackageOpen size={48} className="mb-3 opacity-30" />
            <p className="font-semibold text-sm">No products found</p>
            <p className="text-xs mt-1">
              Try a different search or add a new product
            </p>
          </div>
        ) : (
          <ProductDragGrid
            products={filteredProducts}
            setProducts={setProducts}
            handleEdit={handleEdit}
            handleToggle={handleToggle}
            handleDelete={handleDelete}
            BACKENDURL={BACKENDURL}
          />
        )}
        <div className="h-4" />
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div
            className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl z-10 overflow-hidden flex flex-col"
            style={{ maxHeight: "95dvh" }}
          >
            {/* Drag pill */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-gray-900">
                  {editMode ? "Edit Product" : "New Product"}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {editMode ? "Update product details" : "Add to your menu"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-4">
              <form
                onSubmit={handleSubmit}
                className="space-y-4"
                id="product-form"
              >
                {/* Image */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
                    Product Image
                  </label>
                  <label className="relative block w-full h-36 sm:h-40 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#AE2108] transition cursor-pointer overflow-hidden group">
                    {formData.imagePreview ? (
                      <img
                        src={formData.imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-400 group-hover:text-[#AE2108] transition">
                        <ImagePlus size={26} />
                        <span className="text-xs font-semibold">
                          Tap to upload image
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Name */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-[#AE2108] focus:outline-none transition"
                    placeholder="e.g. Jollof Rice + Chicken"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Price (₦)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                      ₦
                    </span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-2.5 text-sm font-semibold focus:border-[#AE2108] focus:outline-none transition"
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:border-[#AE2108] focus:outline-none transition bg-white"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Availability */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Available now
                    </p>
                    <p className="text-xs text-gray-400">
                      Customers can see and order this
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, available: !p.available }))
                    }
                    className={`relative w-12 h-6 rounded-full transition-colors duration-200 flex-shrink-0 ${formData.available ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${formData.available ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </form>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 flex gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-[#AE2108] text-white text-sm font-bold hover:bg-[#941B06] transition shadow-md shadow-red-200 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : editMode ? (
                  "Update Product"
                ) : (
                  "Add Product"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-[#AE2108]" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              Delete Product?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This product will be permanently removed from your menu.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 rounded-xl bg-[#AE2108] text-white text-sm font-bold hover:bg-[#941B06] transition shadow-md shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
