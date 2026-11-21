// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
