import { useCallback, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Link, NavLink, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, type Product } from "./api";
import { useRequest } from "./useRequest";
import { EnquiryForm } from "./EnquiryForm";
import "./App.css";

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function Resource<T>({ load, children }: {
  load: (signal: AbortSignal) => Promise<T>;
  children: (data: T) => ReactNode;
}) {
  const { result, retry } = useRequest(load);
  if (result.status === "loading") return <p className="notice" role="status">Loading…</p>;
  if (result.status === "error") return (
    <div className="notice">
      <p role="alert">{result.message}</p>
      <button className="secondary" onClick={retry}>Try again</button>
    </div>
  );
  return children(result.data);
}

function SearchForm({ query }: { query: string }) {
  const navigate = useNavigate();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(`/search?${new URLSearchParams({ q: value })}`);
  }
  return (
    <form className="search" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor="search-input">Search products</label>
      <input id="search-input" name="q" type="search" defaultValue={query} maxLength={100} placeholder="Search products" />
      <button type="submit">Search</button>
    </form>
  );
}

function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="product-image">
      {failed || !product.image
        ? <span>Image unavailable</span>
        : <img src={product.image} alt={product.title} loading="lazy" onError={() => setFailed(true)} />}
    </div>
  );
}

function ProductGrid({ products }: { products: Product[] }) {
  return (
    <ul className="grid">
      {products.map((product) => (
        <li key={product.id}>
          <Link className="card" to={`/products/${product.id}`}>
            <ProductImage product={product} />
            <div className="card-copy">
              <span className="category">{product.category}</span>
              <h3>{product.title}</h3>
              <span>{currency.format(product.price)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Home() {
  return (
    <>
      <div className="hero">
        <h1>The catalogue</h1>
        <p>Browse our selection and get in touch about a product.</p>
        <Link className="button" to="/search">Browse all products <span aria-hidden="true">↗</span></Link>
      </div>
      <section className="section">
        <h2>Featured products</h2>
        <Resource load={api.featured}>{(products) => <ProductGrid products={products} />}</Resource>
      </section>
    </>
  );
}

function CategoryPage() {
  const { slug = "" } = useParams();
  const load = useCallback((signal: AbortSignal) => api.category(slug, signal), [slug]);
  return <Resource load={load}>{({ featured, remaining }) => (
    <div className="section">
      <h1 className="category-title">{featured[0]?.category ?? slug}</h1>
      <h2>Top rated</h2>
      <ProductGrid products={featured} />
      {remaining.length > 0 && (
        <section className="section">
          <h2>More in this category</h2>
          <ProductGrid products={remaining} />
        </section>
      )}
    </div>
  )}</Resource>;
}

function SearchPage() {
  const { search } = useLocation();
  const query = new URLSearchParams(search).get("q") ?? "";
  const load = useCallback((signal: AbortSignal) => api.search(query, signal), [query]);
  return (
    <section className="section">
      <h1>{query ? "Search results" : "All products"}</h1>
      {query && <p>Showing matches for “{query}”.</p>}
      <Resource load={load}>{(products) => products.length
        ? <ProductGrid products={products} />
        : <p className="notice" role="status">No products match this search.</p>}
      </Resource>
    </section>
  );
}

function ProductDetails({ product }: { product: Product }) {
  const [showForm, setShowForm] = useState(false);
  return (
    <article className="detail">
      <ProductImage product={product} />
      <div className="detail-copy">
        <span className="category">{product.category}</span>
        <h1>{product.title}</h1>
        <p className="price">{currency.format(product.price)}</p>
        <p>{product.description}</p>
        <p className="rating">Rated {product.rating.rate} out of 5 · {product.rating.count} ratings</p>
        <button type="button" aria-expanded={showForm} aria-controls="product-enquiry"
          onClick={() => setShowForm((visible) => !visible)}>
          {showForm ? "Hide enquiry form" : "Enquire"}
        </button>
        <div id="product-enquiry" hidden={!showForm}>
          {showForm && <EnquiryForm productId={product.id} />}
        </div>
      </div>
    </article>
  );
}

function ProductPage() {
  const { id = "" } = useParams();
  const load = useCallback((signal: AbortSignal) => api.product(id, signal), [id]);
  return <Resource load={load}>{(product) => <ProductDetails key={product.id} product={product} />}</Resource>;
}

export default function App() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q") ?? "";
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header>
        <div className="wrap header">
          <Link className="brand" to="/">Fieldwork<span>.</span></Link>
          <SearchForm key={location.key} query={query} />
        </div>
        <nav className="wrap nav" aria-label="Catalogue categories">
          <NavLink end to="/">Featured</NavLink>
          <Resource load={api.categories}>{(categories) => categories.map(({ name, slug }) => (
            <NavLink key={slug} to={`/categories/${encodeURIComponent(slug)}`}>{name}</NavLink>
          ))}</Resource>
        </nav>
      </header>
      <main className="wrap" id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/categories/:slug" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="*" element={<section className="section"><h1>Page not found</h1><Link to="/">Back to catalogue</Link></section>} />
        </Routes>
      </main>
    </>
  );
}
