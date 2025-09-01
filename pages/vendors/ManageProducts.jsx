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
} from "lucide-react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

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
  const [dragIndex, setDragIndex] = useState(null);

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

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (dragIndex === index) return;

    const updated = [...products];
    const draggedItem = updated[dragIndex];
    updated.splice(dragIndex, 1);
    updated.splice(index, 0, draggedItem);

    setDragIndex(index);
    setProducts(updated);
  };

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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredProducts.length === 0 ? (
            <p className="text-gray-500">No products found.</p>
          ) : (
            filteredProducts.map((prod, index) => (
              <div
                key={prod._id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 text-sm relative cursor-move"
              >
                {prod.image && (
                  <img
                    src={
                      prod.image.startsWith("http")
                        ? prod.image
                        : `${BACKENDURL}/uploads/${prod.image}`
                    }
                    alt={prod.productName}
                    className="w-full h-28 object-cover rounded-md mb-2"
                  />
                )}
                <h3 className="font-semibold text-[#AE2108] truncate">
                  {prod.productName}
                </h3>
                <p className="text-gray-600 text-xs">₦{prod.price}</p>
                <p className="text-gray-400 text-xs mb-2">{prod.category}</p>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      prod.available ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {prod.available ? "Available" : "Unavailable"}
                  </span>
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prod.available}
                      onChange={() => handleToggle(prod._id)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-red-400 peer-checked:bg-green-500 rounded-full relative transition-colors">
                      <div className="w-4 h-4 bg-white rounded-full shadow absolute top-0.5 left-0.5 peer-checked:translate-x-5 transform transition-transform" />
                    </div>
                  </label>
                </div>

                <button
                  onClick={() => handleEdit(prod)}
                  className="absolute top-2 right-2 text-gray-500 hover:text-[#AE2108]"
                >
                  <Pencil size={20} />
                </button>
              </div>
            ))
          )}
        </div>

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

            <h2 className="text-xl font-bold mb-6 text-[#AE2108]">
              {editMode ? "Edit Product" : "Add New Product"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-2">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  required
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border rounded-md p-2"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="African">African</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Pastry">Pastry</option>
                  <option value="Rice Dishes">Rice Dishes</option>
                  <option value="Swallows">Swallows</option>
                  <option value="Soups & Stews">Soups & Stews</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Grilled/Fried">Grilled/Fried</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Smoothies">Smoothies</option>
                  <option value="Small Chops">Small Chops</option>
                  <option value="Shawarma & Sandwiches">
                    Shawarma & Sandwiches
                  </option>
                  <option value="Bakery">Bakery</option>
                  <option value="Drinks">Drinks</option>
                  <option value="Desserts">Desserts</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                </select>
              </div>

              {/* Availability */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="available"
                  checked={formData.available}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <label className="text-sm text-gray-700">Available</label>
              </div>

              {/* Image Upload at bottom */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="w-full border rounded-md p-2"
                />
                {formData.imagePreview && (
                  <img
                    src={formData.imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover mt-3 rounded-lg border"
                  />
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#AE2108] text-white py-2 rounded-md hover:bg-[#941B06] transition"
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
