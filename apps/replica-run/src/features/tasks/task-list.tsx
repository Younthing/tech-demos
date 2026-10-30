import { useState } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearFinished,
  createTask,
  dropTemplate,
  removeTask,
  renameTask,
  saveTemplate,
  setEstimate,
  tasksFromTemplate,
  placeFinished,
  toggleDone,
} from "./model.ts"
import { TEMPLATE_LIMIT, type Store, type Task } from "../timer/types.ts"

type Props = {
  store: Store
  now: number
  onChange: (recipe: (prev: Store) => Store) => void
}

export function TaskList({ store, now, onChange }: Props) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState("")
  const [estimate, setEstimateValue] = useState(1)
  const [editing, setEditing] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState("")

  function commitAdd() {
    const task = createTask(title, estimate, now)
    if (!task) return
    onChange((prev) => ({
      ...prev,
      tasks: [...prev.tasks, task],
      activeId: prev.activeId ?? task.id,
    }))
    setTitle("")
    setEstimateValue(1)
    setAdding(false)
  }

  return (
    <section className="mt-8" aria-label="Queue">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-base font-medium">Queue</h2>
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-md px-2 py-1 text-sm [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Queue menu</span>
            <span aria-hidden="true">···</span>
          </summary>
          <div className="absolute right-0 z-10 mt-1 w-56 rounded-md border border-[var(--ripen-line)] bg-[var(--ripen-card)] p-2 text-sm shadow-lg">
            <button
              type="button"
              className="block w-full rounded px-2 py-1 text-left hover:bg-white/10"
              onClick={() =>
                onChange((prev) => ({
                  ...prev,
                  tasks: clearFinished(prev.tasks),
                  activeId: prev.tasks.some((task) => task.id === prev.activeId && !task.done)
                    ? prev.activeId
                    : null,
                }))
              }
            >
              Clear finished
            </button>
            <button
              type="button"
              className="block w-full rounded px-2 py-1 text-left hover:bg-white/10"
              onClick={() => onChange((prev) => ({ ...prev, tasks: [], activeId: null }))}
            >
              Clear the queue
            </button>
            <form
              className="mt-2 grid gap-1 border-t border-[var(--ripen-line)] pt-2"
              onSubmit={(event) => {
                event.preventDefault()
                onChange((prev) => ({
                  ...prev,
                  templates: saveTemplate(prev.templates, templateName, prev.tasks),
                }))
                setTemplateName("")
              }}
            >
              <Label htmlFor="template-name">Save queue as a template</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(event) => setTemplateName(event.target.value)}
                placeholder="Name"
              />
              <Button type="submit" variant="secondary" disabled={store.templates.length >= TEMPLATE_LIMIT}>
                Save template ({store.templates.length}/{TEMPLATE_LIMIT})
              </Button>
            </form>
            {store.templates.length > 0 && (
              <ul className="mt-2 grid gap-1 border-t border-[var(--ripen-line)] pt-2">
                {store.templates.map((template) => (
                  <li key={template.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      className="flex-1 rounded px-2 py-1 text-left hover:bg-white/10"
                      onClick={() =>
                        onChange((prev) => {
                          const added = tasksFromTemplate(template, now)
                          return {
                            ...prev,
                            tasks: [...prev.tasks, ...added],
                            activeId: prev.activeId ?? added[0]?.id ?? null,
                          }
                        })
                      }
                    >
                      Add {template.name}
                    </button>
                    <button
                      type="button"
                      className="px-1 text-xs"
                      aria-label={`Remove template ${template.name}`}
                      onClick={() =>
                        onChange((prev) => ({
                          ...prev,
                          templates: dropTemplate(prev.templates, template.id),
                        }))
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </div>

      {store.tasks.length === 0 && !adding && (
        <p className="sr-only">The queue is empty. Add the next thing you actually intend to finish.</p>
      )}

      <ul className="grid gap-1">
        {store.tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            active={task.id === store.activeId}
            editing={editing === task.id}
            onSelect={() => onChange((prev) => ({ ...prev, activeId: task.id }))}
            onToggle={() =>
              onChange((prev) => ({
                ...prev,
                tasks: placeFinished(toggleDone(prev.tasks, task.id), prev.settings.checkToBottom),
              }))
            }
            onEdit={() => setEditing(editing === task.id ? null : task.id)}
            onRename={(value) => onChange((prev) => ({ ...prev, tasks: renameTask(prev.tasks, task.id, value) }))}
            onEstimate={(value) =>
              onChange((prev) => ({ ...prev, tasks: setEstimate(prev.tasks, task.id, value) }))
            }
            onDelete={() =>
              onChange((prev) => ({
                ...prev,
                tasks: removeTask(prev.tasks, task.id),
                activeId: prev.activeId === task.id ? null : prev.activeId,
              }))
            }
          />
        ))}
      </ul>

      {adding ? (
        <form
          className="mt-3 grid gap-2 rounded-md border border-dashed border-[var(--ripen-line)] p-3"
          onSubmit={(event) => {
            event.preventDefault()
            commitAdd()
          }}
        >
          <Label htmlFor="task-title">Task title</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={180}
          />
          <Label htmlFor="task-estimate">Focus blocks</Label>
          <Input
            id="task-estimate"
            type="number"
            min={0}
            max={20}
            value={estimate}
            onChange={(event) => setEstimateValue(Number(event.target.value))}
          />
          <div className="flex gap-2">
            <Button type="submit">Add to queue</Button>
            <Button type="button" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          className="mt-3 w-full rounded-md border border-dashed border-[var(--ripen-line)] px-3 py-3 text-sm"
          onClick={() => setAdding(true)}
        >
          New task
        </button>
      )}
    </section>
  )
}

function TaskRow({
  task,
  active,
  editing,
  onSelect,
  onToggle,
  onEdit,
  onRename,
  onEstimate,
  onDelete,
}: {
  task: Task
  active: boolean
  editing: boolean
  onSelect: () => void
  onToggle: () => void
  onEdit: () => void
  onRename: (value: string) => void
  onEstimate: (value: number) => void
  onDelete: () => void
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-md bg-[var(--ripen-paper)] px-3 py-2 text-[var(--ripen-paper-ink)] ${active ? "shadow-[inset_3px_0_0_var(--ripen-bg)]" : ""}`}
    >
      <input
        type="checkbox"
        checked={task.done}
        aria-label={`Mark ${task.title} finished`}
        onChange={onToggle}
      />
      {editing ? (
        <Input
          aria-label={`Title for ${task.title}`}
          defaultValue={task.title}
          onBlur={(event) => onRename(event.target.value)}
          className="h-8 flex-1"
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={`flex-1 truncate text-left ${task.done ? "line-through opacity-70" : ""}`}
        >
          {task.title}
        </button>
      )}
      <span className="shrink-0 text-sm tabular-nums" aria-label={`${task.doneCount} of ${task.estimate} focus blocks done`}>
        {task.doneCount}/{task.estimate}
      </span>
      {editing && (
        <Input
          aria-label={`Estimate for ${task.title}`}
          type="number"
          min={0}
          max={20}
          defaultValue={task.estimate}
          className="h-8 w-16"
          onBlur={(event) => onEstimate(Number(event.target.value))}
        />
      )}
      <button type="button" className="rounded p-1" aria-label={editing ? `Done editing ${task.title}` : `Edit ${task.title}`} onClick={onEdit}>
        <Pencil className="size-4" aria-hidden="true" />
      </button>
      <button type="button" className="rounded p-1" aria-label={`Delete ${task.title}`} onClick={onDelete}>
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}
