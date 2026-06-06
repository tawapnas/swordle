/**
 * Read-only code surface, used by several puzzle types. Renders a dark editor-ish
 * panel; pass either a `code` string (newlines split into lines) or `lines`.
 */
export default function CodeBlock({
  code,
  lines,
  className = "",
}: {
  code?: string;
  lines?: string[];
  className?: string;
}) {
  const rows = lines ?? (code ?? "").split("\n");
  return (
    <pre
      className={`overflow-x-auto rounded-2xl bg-code-bg px-4 py-3 font-mono text-sm leading-relaxed text-code-fg sm:text-base ${className}`}
    >
      <code>
        {rows.map((line, i) => (
          <span key={i} className="block whitespace-pre">
            {line.length ? line : " "}
          </span>
        ))}
      </code>
    </pre>
  );
}
