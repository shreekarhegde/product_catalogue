// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { EnquiryForm } from "./EnquiryForm";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function fillForm() {
  render(<EnquiryForm productId={9} />);
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Jamie" } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "jamie@example.test" } });
}

describe("EnquiryForm", () => {
  it("sends JSON and confirms only after success", async () => {
    const fetch = vi.fn(async () => Response.json({ message: "Thank you" }));
    vi.stubGlobal("fetch", fetch);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Send enquiry" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Thank you");
    expect(fetch).toHaveBeenCalledWith("/api/products/9/enquiries", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ name: "Jamie", email: "jamie@example.test" }),
    }));
  });

  it("shows the API error and preserves inputs for a retry", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json(
      { error: { message: "Please try again." } }, { status: 503 },
    )));
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Send enquiry" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Please try again.");
    expect(screen.getByLabelText("Your name")).toHaveValue("Jamie");
    expect(screen.getByLabelText("Email address")).toHaveValue("jamie@example.test");
    expect(screen.getByRole("button", { name: "Send enquiry" })).toBeEnabled();
  });
});

it("preserves the draft and pending send when the product enquiry form is collapsed", async () => {
  let finishDelivery: (response: Response) => void = () => {};
  const delivery = new Promise<Response>((resolve) => { finishDelivery = resolve; });
  const send = vi.fn(() => delivery);
  vi.stubGlobal("fetch", vi.fn(async (path: string, options?: RequestInit) => {
    if (options?.method === "POST") return send();
    if (path === "/api/categories") return Response.json([]);
    return Response.json({
      id: 9, title: "Market Tote", description: "Cotton tote", price: 19,
      category: "bags", image: "", rating: { rate: 4, count: 8 },
    });
  }));

  render(<MemoryRouter initialEntries={["/products/9"]}><App /></MemoryRouter>);
  const toggle = await screen.findByRole("button", { name: /^Enquire$/ });
  fireEvent.click(toggle);
  fireEvent.change(screen.getByLabelText("Your name"), { target: { value: "Jamie" } });
  fireEvent.change(screen.getByLabelText("Email address"), { target: { value: "jamie@example.test" } });
  fireEvent.click(toggle);
  expect(screen.queryByRole("button", { name: "Send enquiry" })).not.toBeInTheDocument();
  fireEvent.click(toggle);
  expect(screen.getByLabelText("Your name")).toHaveValue("Jamie");
  expect(screen.getByLabelText("Email address")).toHaveValue("jamie@example.test");

  fireEvent.click(screen.getByRole("button", { name: "Send enquiry" }));
  fireEvent.click(toggle);
  fireEvent.click(toggle);
  expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  expect(send).toHaveBeenCalledTimes(1);
  finishDelivery(Response.json({ message: "Thank you" }));
  expect(await screen.findByRole("status")).toHaveTextContent("Thank you");
});
