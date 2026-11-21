import { useEffect, useId, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Product } from "./api";

const searchLimit = 100;

export function SearchForm({ query }: { query: string }) {
  const navigate = useNavigate();
  const listId = useId();
  const [value, setValue] = useState(query);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [matches, setMatches] = useState<{ term: string; products: Product[] }>();
  const term = value.trim();
  const options = open && term === matches?.term ? matches.products : [];

  useEffect(() => {
    if (!open || !term) return;
    const controller = new AbortController();
    // Wait for a pause in typing and discard stale responses.
    const timer = window.setTimeout(async () => {
      try {
        const products = await api.search(term, controller.signal);
        if (!controller.signal.aborted) setMatches({ term, products: products.slice(0, 6) });
      } catch {
        // The submitted search still shows any server error and offers a retry.
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, term]);

  function search(text: string) {
    setOpen(false);
    setActive(-1);
    navigate(`/search?${new URLSearchParams({ q: text.trim().slice(0, searchLimit) })}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    search(options[active]?.title ?? value);
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      setActive(-1);
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      setOpen(true);
      if (!options.length) return;
      event.preventDefault();
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => index < 0 && direction < 0
        ? options.length - 1
        : (index + direction + options.length) % options.length);
    }
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <label className="sr-only" htmlFor="search-input">Search products</label>
      <div className="search-field">
        <input
          id="search-input"
          name="q"
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={options.length > 0}
          aria-controls={options.length ? listId : undefined}
          aria-activedescendant={options[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          value={value}
          maxLength={searchLimit}
          placeholder="Search products"
          onChange={(event) => {
            setValue(event.target.value);
            setMatches(undefined);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            setActive(-1);
          }}
          onKeyDown={handleKey}
        />
        {options.length > 0 && (
          <ul className="search-options" role="listbox" id={listId} aria-label="Matching products">
            {options.map(({ id, title }, index) => (
              <li
                key={id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={index === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => search(title)}
              >
                {title}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
