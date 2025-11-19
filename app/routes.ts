import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/_index.tsx"),

  // Products
  route("products", "routes/products._index.tsx"),
  route("products/new", "routes/products.new.tsx"),
  route("products/:id", "routes/products.$id.tsx"),
  route("products/:id/edit", "routes/products.$id.edit.tsx"),

  // Categories
  route("categories", "routes/categories._index.tsx"),

  // Locations
  route("locations", "routes/locations._index.tsx"),

  // Inventory
  route("inventory", "routes/inventory._index.tsx"),
  route("inventory/adjust", "routes/inventory.adjust.tsx"),
  route("inventory/transfer", "routes/inventory.transfer.tsx"),

  // Sales
  route("sales", "routes/sales._index.tsx"),
  route("sales/new", "routes/sales.new.tsx"),
  route("sales/:id", "routes/sales.$id.tsx"),

  // Suppliers
  route("suppliers", "routes/suppliers._index.tsx"),

  // Reports
  route("reports", "routes/reports._index.tsx"),
  route("reports/stock", "routes/reports.stock.tsx"),
  route("reports/low-stock", "routes/reports.low-stock.tsx"),
  route("reports/sales", "routes/reports.sales.tsx"),
  route("reports/movements", "routes/reports.movements.tsx"),

  // Settings
  route("settings", "routes/settings._index.tsx"),

  // API
  route("api/barcode/:productId", "routes/api.barcode.$productId.tsx"),
] satisfies RouteConfig;
