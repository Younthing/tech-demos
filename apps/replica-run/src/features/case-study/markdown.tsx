import type { ReactNode } from "react"

/** A small renderer for the headings, lists, tables, links, and bold the study files use. */
export function Markdown({ source }: { source: string }) {
  const blocks = source.replaceAll("\r\n", "\n").split(/\n{2,}/)
  return (
    <div className="grid gap-4 text-sm leading-6">
      {blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </div>
  )
}

function Block({ block }: { block: string }) {
  const lines = block.split("\n").filter((line) => line.length > 0)
  if (lines.length === 0) return null
  const first = lines[0] ?? ""
  if (first.startsWith("|")) return <Table lines={lines} />
  if (lines.every((line) => line.startsWith("- "))) {
    return (
      <ul className="list-disc space-y-1 pl-5">
        {lines.map((line, index) => (
          <li key={index}>{inline(line.slice(2))}</li>
        ))}
      </ul>
    )
  }
  if (first.startsWith("### ")) return <h3 className="text-base font-semibold">{inline(first.slice(4))}</h3>
  if (first.startsWith("## ")) return <h2 className="text-xl font-semibold">{inline(first.slice(3))}</h2>
  if (first.startsWith("# ")) return <h2 className="text-2xl font-semibold">{inline(first.slice(2))}</h2>
  return <p>{inline(lines.join(" "))}</p>
}

function Table({ lines }: { lines: string[] }) {
  const rows = lines.filter((line) => !/^\|\s*-+/.test(line))
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">
        <tbody>
          {rows.map((line, index) => (
            <tr key={index} className="border-b">
              {splitRow(line).map((cell, cellIndex) =>
                index === 0 ? (
                  <th key={cellIndex} className="px-2 py-1 font-medium">
                    {inline(cell)}
                  </th>
                ) : (
                  <td key={cellIndex} className="px-2 py-1 align-top">
                    {inline(cell)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim())
}

function inline(text: string): ReactNode[] {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g)
  return parts.filter(Boolean).map((part, index) => {
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
    if (link) {
      return (
        <a key={index} href={link[2]} className="underline underline-offset-2" target="_blank" rel="noreferrer">
          {link[1]}
        </a>
      )
    }
    const bold = /^\*\*([^*]+)\*\*$/.exec(part)
    if (bold) return <strong key={index}>{bold[1]}</strong>
    return <span key={index}>{part}</span>
  })
}
