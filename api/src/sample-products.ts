import type { Product } from "./products.js";

const products: Product[] = [
  { id: 1, title: "Canvas Travel Bag", category: "bags", price: 64, rating: { rate: 4.8, count: 22 }, description: "A canvas weekender with a zipped inside pocket.", image: "" },
  { id: 5, title: "Day Pack", category: "bags", price: 42, rating: { rate: 4.5, count: 16 }, description: "A compact backpack with adjustable straps.", image: "" },
  { id: 9, title: "Market Tote", category: "bags", price: 19, rating: { rate: 4.2, count: 8 }, description: "A wide cotton tote with reinforced handles.", image: "" },
  { id: 15, title: "Desk Lamp", category: "home", price: 38, rating: { rate: 4.7, count: 12 }, description: "An adjustable lamp for reading and desk work.", image: "" },
  { id: 20, title: "Ceramic Mug", category: "home", price: 14, rating: { rate: 4.4, count: 26 }, description: "A glazed ceramic mug with a wide handle.", image: "" },
];

export async function loadSampleProducts(): Promise<Product[]> {
  return products;
}
