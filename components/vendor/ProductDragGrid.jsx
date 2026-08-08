import { Pencil, Trash2, GripVertical, PackageOpen, ToggleLeft, ToggleRight } from "lucide-react";
import { cloudinaryResize } from "@/utils/captcha";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableProduct({
  product,
  handleEdit,
  handleToggle,
  handleDelete,
  BACKENDURL,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  const imgSrc = product.image
    ? product.image.startsWith("http")
      ? product.image
      : `${BACKENDURL}/uploads/${product.image}`
    : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 ${
        isDragging
          ? "shadow-2xl scale-105 border-[#AE2108]/30"
          : "shadow-sm hover:shadow-lg border-gray-100"
      }`}
    >
      {/* Image */}
      <div className="relative w-full h-36 sm:h-40 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imgSrc ? (
          <img
            src={cloudinaryResize(imgSrc, 400)}
            alt={product.productName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PackageOpen size={28} className="text-gray-300" />
          </div>
        )}

        {/* Live/Off pill */}
        <div
          className={`absolute top-2 left-2 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            product.available
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          {product.available ? "Live" : "Off"}
        </div>

        {/* Drag handle (raised above everything) */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 z-50 w-7 h-7 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-white transition cursor-grab active:cursor-grabbing touch-none select-none opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          style={{ touchAction: "none" }}
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>

        {/* Fixed overlay (does NOT block drag anymore) */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hidden sm:flex items-center justify-center gap-3 pointer-events-none">
          <button
            onClick={() => handleEdit(product)}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-white hover:text-[#AE2108] transition-all"
          >
            <Pencil size={15} />
          </button>

          <button
            onClick={() => handleDelete(product._id)}
            className="pointer-events-auto w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-red-500 hover:border-red-500 transition-all"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-2.5 sm:p-3">
        <h3 className="font-bold text-gray-900 text-xs sm:text-sm truncate mb-1">
          {product.productName}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className="text-[#AE2108] font-black text-xs sm:text-sm">
            ₦{Number(product.price).toLocaleString()}
          </span>
          <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full truncate max-w-[72px]">
            {product.category}
          </span>
        </div>

        {/* Mobile edit/delete */}
        <div className="flex gap-1.5 sm:hidden mb-2">
          <button
            onClick={() => handleEdit(product)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-100 text-gray-700 text-[11px] font-bold rounded-lg active:bg-gray-200 transition"
          >
            <Pencil size={11} /> Edit
          </button>

          <button
            onClick={() => handleDelete(product._id)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg active:bg-red-100 transition"
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>

        {/* Availability toggle */}
        <button
          onClick={() => handleToggle(product._id)}
          className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all ${
            product.available
              ? "bg-green-50 text-green-700 active:bg-green-100"
              : "bg-red-50 text-red-700 active:bg-red-100"
          }`}
        >
          {product.available ? (
            <ToggleRight size={13} />
          ) : (
            <ToggleLeft size={13} />
          )}
          {product.available ? "Mark Unavailable" : "Mark Available"}
        </button>
      </div>
    </div>
  );
}

export default function ProductDragGrid({
  products,
  setProducts,
  handleEdit,
  handleToggle,
  handleDelete,
  BACKENDURL,
}) {
  // Lower distance threshold for snappier desktop dragging (was 8).
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 8,
      },
    }),
  );

  // `products` here may be a filtered/searched view, so reindex against the
  // full state list by id rather than by position — otherwise saving while
  // a filter is active would drop the hidden products from state.
  const handleDragEnd = ({ active, over }) => {
    if (active.id !== over?.id) {
      setProducts((items) => {
        const o = items.findIndex((p) => p._id === active.id);
        const n = items.findIndex((p) => p._id === over.id);
        if (o === -1 || n === -1) return items;
        return arrayMove(items, o, n);
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={products.map((p) => p._id)}
        strategy={rectSortingStrategy}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
          {products.map((prod) => (
            <SortableProduct
              key={prod._id}
              product={prod}
              handleEdit={handleEdit}
              handleToggle={handleToggle}
              handleDelete={handleDelete}
              BACKENDURL={BACKENDURL}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
