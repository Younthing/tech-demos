import { NavLink } from "react-router"
import type { ReactNode } from "react"

const links = [
  { to: "/", label: "Timer" },
  { to: "/diff", label: "Parity" },
  { to: "/fixes", label: "Complaints" },
  { to: "/about", label: "Pipeline" },
]

export function StudyShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-4 px-4 py-3 text-sm">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                isActive ? "font-semibold" : "text-muted-foreground hover:text-foreground"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
