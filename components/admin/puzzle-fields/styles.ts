// Shared input styling + the `Field` label helper for every admin puzzle form
// piece. Lifted out of the old PuzzleManager so all the type-specific field
// components can share one consistent look.

import type { ReactNode } from "react";
import { createElement } from "react";

export const inputClass =
  "rounded-2xl bg-card px-4 py-3 text-base text-ink shadow-sm ring-1 ring-line outline-none focus:ring-2 focus:ring-brand";

export const monoInputClass = `${inputClass} font-mono text-sm`;

/** A labelled form field: a bold caption above its control. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return createElement(
    "label",
    { className: "flex flex-col gap-1.5" },
    createElement("span", { className: "text-sm font-bold text-ink" }, label),
    children,
  );
}
