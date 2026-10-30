import { BrowserRouter, Route, Routes } from "react-router"
import { AboutPage } from "../features/case-study/about-page.tsx"
import { DiffPage } from "../features/case-study/diff-page.tsx"
import { FixesPage } from "../features/case-study/fixes-page.tsx"
import { TimerPage } from "../features/timer/timer-page.tsx"

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TimerPage />} />
        <Route path="/diff" element={<DiffPage />} />
        <Route path="/fixes" element={<FixesPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </BrowserRouter>
  )
}
