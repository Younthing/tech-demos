import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("focus block ends, a rest starts, and the task records one block", async ({ page }) => {
  const errors: string[] = []
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  page.on("response", (response) => {
    if (response.status() >= 500) errors.push(`${response.status()} ${response.url()}`)
  })

  await page.clock.install({ time: new Date("2026-10-30T15:00:00Z") })
  await page.addInitScript(() => localStorage.clear())
  await page.goto("/")

  const idle = await new AxeBuilder({ page }).analyze()
  expect(idle.violations).toEqual([])

  await page.getByRole("button", { name: "New task" }).click()
  await page.getByLabel("Task title").fill("Draft notes")
  await page.getByRole("button", { name: "Add to queue" }).click()
  await expect(page.getByRole("button", { name: "Draft notes", exact: true })).toBeVisible()

  await page.getByRole("button", { name: "Settings" }).click()
  await page.getByLabel("Focus minutes").fill("1")
  await page.getByRole("switch", { name: "Start rests on their own" }).click()
  await page.getByRole("button", { name: "Save settings" }).click()

  await page.getByRole("button", { name: "Begin" }).click()
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible()
  await page.clock.fastForward(60_000)

  await expect(page.getByRole("tab", { name: "Short rest" })).toHaveAttribute("aria-selected", "true")
  await expect(page.getByLabel("1 of 1 focus blocks done")).toBeVisible()

  await page.getByRole("button", { name: "Report" }).click()
  await expect(page.getByText("1 block")).toBeVisible()

  expect(errors).toEqual([])
})
