import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),

  // Products
  route("products", "routes/products._index.tsx"),
  route("products/new", "routes/products.new.tsx"),
  route("products/:id", "routes/products.$id.tsx"),

  // Inventory
  route("inventory", "routes/inventory._index.tsx"),

  // Sales
  route("sales", "routes/sales._index.tsx"),

  // Suppliers
  route("suppliers", "routes/suppliers._index.tsx"),

  // Reports
  route("reports", "routes/reports._index.tsx"),

  // Settings
  route("settings", "routes/settings._index.tsx"),
] satisfies RouteConfig;
