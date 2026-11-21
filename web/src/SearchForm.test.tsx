// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import { SearchForm } from "./SearchForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Results() {
  return <h1>{new URLSearchParams(useLocation().search).get("q")}</h1>;
}

function renderSearch() {
  const fetch = vi.fn(async () => Response.json([{ id: 1, title: "Canvas Travel Bag" }]));
  vi.stubGlobal("fetch", fetch);
  render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<SearchForm query="" />} />
        <Route path="/search" element={<Results />} />
      </Routes>
    </MemoryRouter>,
  );
  return fetch;
}

it("fetches matching titles and submits the clicked suggestion", async () => {
  const fetch = renderSearch();
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "tra" } });
  const suggestion = await screen.findByRole("option", { name: "Canvas Travel Bag" });
  expect(fetch).toHaveBeenCalledWith("/api/products?q=tra", expect.any(Object));
  fireEvent.click(suggestion);
  expect(screen.getByRole("heading", { name: "Canvas Travel Bag" })).toBeInTheDocument();
});

it("supports keyboard selection and dismissal", async () => {
  renderSearch();
  const input = screen.getByRole("combobox");
  fireEvent.change(input, { target: { value: "tra" } });
  await screen.findByRole("option");
  fireEvent.keyDown(input, { key: "Escape" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "ArrowDown" });
  expect(screen.getByRole("option")).toHaveAttribute("aria-selected", "true");
  fireEvent.submit(screen.getByRole("search"));
  expect(screen.getByRole("heading", { name: "Canvas Travel Bag" })).toBeInTheDocument();
});
