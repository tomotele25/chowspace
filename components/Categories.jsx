import React from "react";
import { Home, Pill, Wine, ShoppingBag } from "lucide-react";
import { useCategory } from "@/context/CategoryContext";

const categories = [
  { name: "restaurant", label: "Restaurant", icon: Home, color: "#AE2108" },
  { name: "drinks", label: "Drinks", icon: Wine, color: "#B8860B" },
  { name: "malls", label: "Malls", icon: ShoppingBag, color: "#6A1B9A" },
  { name: "pharmacy", label: "Pharmacy", icon: Pill, color: "#2E7D32" },
];

const Categories = () => {
  const { selectedCategory, setSelectedCategory } = useCategory();

  const handleCategoryClick = (categoryName) => {
    const isDeselecting = selectedCategory === categoryName;
    setSelectedCategory(isDeselecting ? null : categoryName);

    if (!isDeselecting) {
      document
        .getElementById("vendors")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="px-6 md:px-20 lg:px-20 py-14">
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
          Explore <span className="text-[#AE2108]">Categories</span>
        </h2>
        <p className="text-sm text-gray-400 mt-1">
          Find exactly what you're in the mood for
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === cat.name;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => handleCategoryClick(cat.name)}
              className={`group relative flex flex-col items-center justify-center gap-3 rounded-2xl py-7 px-4 border transition-all duration-200 active:scale-[0.97] ${
                isSelected
                  ? "shadow-md"
                  : "bg-white border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              }`}
              style={
                isSelected
                  ? {
                      backgroundColor: `${cat.color}10`,
                      borderColor: `${cat.color}40`,
                    }
                  : undefined
              }
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
                style={{
                  backgroundColor: isSelected
                    ? `${cat.color}20`
                    : `${cat.color}0D`,
                }}
              >
                <Icon size={26} style={{ color: cat.color }} />
              </div>
              <span
                className="text-sm font-semibold"
                style={{ color: isSelected ? cat.color : "#374151" }}
              >
                {cat.label}
              </span>

              {isSelected && (
                <span
                  className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
