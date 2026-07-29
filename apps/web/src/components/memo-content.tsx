// ponytail: regex covers bold only; if italic/links/lists are needed,
// replace with react-markdown — do not extend regexes.
const BOLD_RE = /(\*\*[^*\n]+\*\*)/g;
const BOLD_FULL = /^\*\*[^*\n]+\*\*$/;

export function MemoContent({ text }: { text: string }) {
  return (
    <>
      {text.split(BOLD_RE).map((part, i) =>
        BOLD_FULL.test(part) ? (
          // biome-ignore lint/suspicious/noArrayIndexKey: parts derive from immutable text; order never changes
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          part
        ),
      )}
    </>
  );
}
