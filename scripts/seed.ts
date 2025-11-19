// Seed script for demo data
// Run with: tsx scripts/seed.ts

import { generateId } from '../app/lib/db.server';

const orgId = crypto.randomUUID();
const userId = 'dev-user-1';
const now = Date.now();

// Sample data
const categories = [
  { id: generateId(), name: 'Electronics', description: 'Electronic devices and accessories' },
  { id: generateId(), name: 'Clothing', description: 'Apparel and accessories' },
  { id: generateId(), name: 'Food & Beverage', description: 'Food items and drinks' },
  { id: generateId(), name: 'Office Supplies', description: 'Stationery and office equipment' },
];

const locations = [
  { id: generateId(), name: 'Main Warehouse', type: 'warehouse', address: '123 Main St' },
  { id: generateId(), name: 'Downtown Store', type: 'store', address: '456 Downtown Ave' },
  { id: generateId(), name: 'Online Fulfillment', type: 'online', address: 'Virtual' },
];

const products = [
  { name: 'Laptop Computer', sku: 'ELEC-001', category: 0, cost: 800, selling: 1200, min_stock: 5 },
  { name: 'Wireless Mouse', sku: 'ELEC-002', category: 0, cost: 15, selling: 30, min_stock: 20 },
  { name: 'T-Shirt (Blue)', sku: 'CLTH-001', category: 1, cost: 8, selling: 20, min_stock: 30 },
  { name: 'Jeans (Denim)', sku: 'CLTH-002', category: 1, cost: 25, selling: 60, min_stock: 15 },
  { name: 'Coffee Beans (1kg)', sku: 'FOOD-001', category: 2, cost: 12, selling: 25, min_stock: 50 },
  { name: 'Green Tea', sku: 'FOOD-002', category: 2, cost: 5, selling: 12, min_stock: 40 },
  { name: 'Notebook A4', sku: 'OFF-001', category: 3, cost: 2, selling: 5, min_stock: 100 },
  { name: 'Ballpoint Pen', sku: 'OFF-002', category: 3, cost: 0.5, selling: 1.5, min_stock: 200 },
];

const suppliers = [
  { name: 'Tech Supplies Inc', contact: 'John Doe', email: 'john@techsupplies.com', phone: '+1234567890' },
  { name: 'Fashion Wholesale', contact: 'Jane Smith', email: 'jane@fashionwholesale.com', phone: '+0987654321' },
  { name: 'Food Distributors Ltd', contact: 'Bob Johnson', email: 'bob@fooddist.com', phone: '+1122334455' },
];

console.log('🌱 Seeding database with demo data...\n');

console.log(`Organization ID: ${orgId}`);
console.log(`User ID: ${userId}`);
console.log('\nSample Products:');
products.forEach(p => console.log(`  - ${p.name} (${p.sku}): ${p.cost} → ${p.selling}`));

console.log('\nSample Categories:');
categories.forEach(c => console.log(`  - ${c.name}`));

console.log('\nSample Locations:');
locations.forEach(l => console.log(`  - ${l.name} (${l.type})`));

console.log('\nSample Suppliers:');
suppliers.forEach(s => console.log(`  - ${s.name}`));

console.log('\n✅ Seed data structure ready!');
console.log('\nTo apply this seed data, you can:');
console.log('1. Use the UI to create these items manually');
console.log('2. Execute SQL inserts based on this template');
console.log('3. Extend this script to directly insert into D1');
console.log('\nNote: Direct D1 seeding requires wrangler CLI integration.');
