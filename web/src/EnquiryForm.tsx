import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { api } from "./api";

export function EnquiryForm({ productId }: { productId: number }) {
  const pending = useRef<AbortController | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const confirmation = useRef<HTMLParagraphElement>(null);

  useEffect(() => () => pending.current?.abort(), []);
  useEffect(() => {
    if (state === "sent") confirmation.current?.focus();
  }, [state]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;

    const fields = new FormData(event.currentTarget);
    const controller = new AbortController();
    pending.current = controller;
    setError("");
    setState("sending");
    try {
      await api.enquire(productId, {
        name: String(fields.get("name") ?? "").trim(),
        email: String(fields.get("email") ?? "").trim(),
        message: String(fields.get("message") ?? "").trim() || undefined,
      }, controller.signal);
      if (!controller.signal.aborted) setState("sent");
    } catch (failure) {
      if (!controller.signal.aborted) {
        setError(failure instanceof Error ? failure.message : "Could not send your enquiry.");
        setState("idle");
      }
    } finally {
      pending.current = null;
    }
  }

  if (state === "sent") {
    return <p className="notice success" role="status" ref={confirmation} tabIndex={-1}>
      <strong>Thank you.</strong> Your enquiry has been sent.
    </p>;
  }

  return (
    <form className="enquiry" onSubmit={submit}>
      <fieldset disabled={state === "sending"}>
        <legend>Enquire about this product</legend>
        <label>Your name<input name="name" autoComplete="name" required maxLength={100} /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={254} /></label>
        <label>Message <span>(optional)</span><textarea name="message" maxLength={2000} rows={4} /></label>
        {error && <p className="notice" role="alert">{error}</p>}
        <button type="submit">{state === "sending" ? "Sending…" : "Send enquiry"}</button>
      </fieldset>
    </form>
  );
}
