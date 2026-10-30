import { clampEstimate, makeId, TEMPLATE_LIMIT, type Task, type Template } from "../timer/types.ts"

export function createTask(title: string, estimate: number, now: number): Task | null {
  const clean = title.trim().slice(0, 180)
  if (!clean) return null
  return {
    id: makeId(),
    title: clean,
    estimate: clampEstimate(estimate),
    doneCount: 0,
    done: false,
    createdAt: now,
  }
}

export function creditActive(tasks: Task[], activeId: string | null, autoCheck = false): Task[] {
  if (!activeId) return tasks
  return tasks.map((task) => {
    if (task.id !== activeId || task.done) return task
    const doneCount = task.doneCount + 1
    const done = autoCheck && task.estimate > 0 && doneCount >= task.estimate
    return { ...task, doneCount, done }
  })
}

export function placeFinished(tasks: Task[], enabled: boolean): Task[] {
  if (!enabled) return tasks
  return [...tasks.filter((task) => !task.done), ...tasks.filter((task) => task.done)]
}

export function renameTask(tasks: Task[], id: string, title: string): Task[] {
  const clean = title.trim().slice(0, 180)
  if (!clean) return tasks
  return tasks.map((task) => (task.id === id ? { ...task, title: clean } : task))
}

export function setEstimate(tasks: Task[], id: string, estimate: number): Task[] {
  return tasks.map((task) =>
    task.id === id ? { ...task, estimate: clampEstimate(estimate) } : task,
  )
}

export function toggleDone(tasks: Task[], id: string): Task[] {
  return tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
}

export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id)
}

export function clearFinished(tasks: Task[]): Task[] {
  return tasks.filter((task) => !task.done)
}

export function openBlocks(tasks: Task[]): number {
  return tasks
    .filter((task) => !task.done)
    .reduce((sum, task) => sum + Math.max(0, task.estimate - task.doneCount), 0)
}

export function saveTemplate(templates: Template[], name: string, tasks: Task[]): Template[] {
  const items = tasks
    .filter((task) => !task.done)
    .map((task) => ({ title: task.title, estimate: task.estimate }))
  const clean = name.trim().slice(0, 60)
  if (!clean || items.length === 0 || templates.length >= TEMPLATE_LIMIT) return templates
  return [...templates, { id: makeId(), name: clean, items }]
}

export function dropTemplate(templates: Template[], id: string): Template[] {
  return templates.filter((template) => template.id !== id)
}

export function tasksFromTemplate(template: Template, now: number): Task[] {
  return template.items.map((item, index) => ({
    id: makeId(),
    title: item.title,
    estimate: clampEstimate(item.estimate),
    doneCount: 0,
    done: false,
    createdAt: now + index,
  }))
}
