"use client";

import { useState, useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";
import {
  ArrowLeftCircle,
  Plus,
  X,
  LayoutDashboard,
  PackageOpen,
  LogOut,
  Pencil,
  Save,
  GripVertical,
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

// dnd-kit imports
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ✅ Sortable Item (Product Card)
function SortableProduct({
  product,
  index,
  handleEdit,
  handleToggle,
  BACKENDURL,
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: product._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm relative"
    >
      {/* 🔥 Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 p-1.5 rounded-full bg-gray-200 hover:bg-[#AE2108] hover:text-white text-gray-600 cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical size={18} />
      </button>

      {product.image && (
        <img
          src={
            product.image.startsWith("http")
              ? product.image
              : `${BACKENDURL}/uploads/${product.image}`
          }
          alt={product.productName}
          className="w-full h-28 object-cover rounded-md mb-2"
        />
      )}
      <h3 className="font-semibold text-[#AE2108] truncate">
        {product.productName}
      </h3>
      <p className="text-gray-600 text-xs">₦{product.price}</p>
      <p className="text-gray-400 text-xs mb-2">{product.category}</p>

      <div className="flex items-center justify-between">
        <span
          className={`text-xs font-medium ${
            product.available ? "text-green-600" : "text-red-600"
          }`}
        >
          {product.available ? "Available" : "Unavailable"}
        </span>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={product.available}
            onChange={() => handleToggle(product._id)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-red-400 peer-checked:bg-green-500 rounded-full relative transition-colors">
            <div className="w-4 h-4 bg-white rounded-full shadow absolute top-0.5 left-0.5 peer-checked:translate-x-5 transform transition-transform" />
          </div>
        </label>
      </div>

      <button
        onClick={() => handleEdit(product)}
        className="absolute top-2 right-2 text-gray-500 hover:text-[#AE2108]"
      >
        <Pencil size={20} />
      </button>
    </div>
  );
}

export default function ManageProducts() {
  const router = useRouter();
  const { data: session } = useSession();
  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2005";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
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
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/product/my-products`, {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });
        setProducts(res.data.products || []);
      } catch (err) {
        toast.error("Failed to load products");
      }
    };

    if (session?.user?.accessToken) fetchProducts();
  }, [session]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        image: file,
        imagePreview: URL.createObjectURL(file),
      }));
    }
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.productName,
      price: product.price,
      category: product.category,
      available: product.available,
      image: null,
      imagePreview: product.image.startsWith("http")
        ? product.image
        : `${BACKENDURL}/uploads/${product.image}`,
    });
    setEditId(product._id);
    setEditMode(true);
    setShowModal(true);
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

      const url = editMode
        ? `${BACKENDURL}/api/product/update/${editId}`
        : `${BACKENDURL}/api/product/createProduct`;

      const method = editMode ? "patch" : "post";

      const res = await axios({
        method,
        url,
        data: form,
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(editMode ? "Product updated" : "Product added");
      setProducts((prev) => {
        if (editMode) {
          return prev.map((p) => (p._id === editId ? res.data.product : p));
        } else {
          return [res.data.product, ...prev];
        }
      });

      setFormData({
        name: "",
        price: "",
        category: "",
        available: true,
        image: null,
        imagePreview: null,
      });
      setEditMode(false);
      setEditId(null);
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit product");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (productId) => {
    setProducts((prev) =>
      prev.map((p) =>
        p._id === productId ? { ...p, available: !p.available } : p
      )
    );

    try {
      await axios.patch(
        `${BACKENDURL}/api/product/${productId}/toggle-availability`,
        {},
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } }
      );
      toast.success("Updated availability");
    } catch (err) {
      toast.error("Failed to update availability");
      // rollback if error
      setProducts((prev) =>
        prev.map((p) =>
          p._id === productId ? { ...p, available: !p.available } : p
        )
      );
    }
  };

  // ✅ Save new order
  const saveReorder = async () => {
    try {
      const payload = {
        products: products.map((p, index) => ({
          id: p._id,
          position: index,
        })),
      };

      await axios.patch(`${BACKENDURL}/api/product/rearrange`, payload, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      });

      toast.success("Product order saved!");
    } catch (err) {
      toast.error("Failed to save new order");
    }
  };

  const filteredProducts = products.filter((prod) =>
    prod.productName.toLowerCase().includes(search.toLowerCase())
  );

  // ✅ Setup DnD sensors (mouse + touch)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p._id === active.id);
      const newIndex = products.findIndex((p) => p._id === over.id);
      setProducts((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-4 hidden md:flex flex-col justify-between sticky top-0 h-screen">
        <div>
          <h2 className="text-xl font-bold text-[#AE2108] mb-6">
            Vendor Panel
          </h2>
          <nav className="space-y-3">
            <Link
              href="/vendor/dashboard"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link
              href="/vendor/products"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <PackageOpen size={18} /> Products
            </Link>
          </nav>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/Login" })}
          className="flex items-center gap-2 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Product Grid */}
      <main className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md shadow-sm hover:bg-gray-100"
          >
            <ArrowLeftCircle size={18} />
            <span>Back</span>
          </button>

          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border rounded-lg w-64 focus:ring-[#AE2108] focus:outline-none"
          />
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredProducts.map((p) => p._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500">No products found.</p>
              ) : (
                filteredProducts.map((prod, index) => (
                  <SortableProduct
                    key={prod._id}
                    product={prod}
                    index={index}
                    handleEdit={handleEdit}
                    handleToggle={handleToggle}
                    BACKENDURL={BACKENDURL}
                  />
                ))
              )}
            </div>
          </SortableContext>
        </DndContext>

        {/* Save Reorder */}
        <button
          onClick={saveReorder}
          className="fixed bottom-6 right-20 bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg z-50 flex items-center justify-center transition-all duration-200 hover:scale-110"
        >
          <Save size={22} />
        </button>

        {/* Add Product */}
        <button
          onClick={() => setShowModal(true)}
          className="fixed bottom-6 right-6 bg-[#AE2108] hover:bg-[#941B06] text-white p-4 rounded-full shadow-lg z-50"
        >
          <Plus size={24} />
        </button>
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-3 text-gray-500 hover:text-[#AE2108]"
            >
              <X size={22} />
            </button>

            <h2 className="text-xl font-semibold mb-4 text-[#AE2108]">
              {editMode ? "Edit Product" : "Add Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Price</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-lg px-3 py-2"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                />
                <span className="text-sm">Available</span>
              </div>

              <div>
                <label className="block text-sm font-medium">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 w-full"
                />
                {formData.imagePreview && (
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="mt-2 h-32 w-full object-cover rounded-lg"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#AE2108] hover:bg-[#941B06] text-white px-4 py-2 rounded-lg shadow-md"
              >
                {loading
                  ? "Saving..."
                  : editMode
                  ? "Update Product"
                  : "Add Product"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
