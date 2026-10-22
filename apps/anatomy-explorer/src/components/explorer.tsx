import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator.tsx";
import { FigureStage } from "@/components/figure-stage.tsx";
import { machines, machineById, renderMachine } from "@/machines/index.ts";
import { wrapDegrees } from "@/machines/project.ts";
import { cn } from "@/lib/utils.ts";

const HOME_AZIMUTH = 38;
const HOME_ELEVATION = 32;

export function Explorer() {
  const [machineId, setMachineId] = useState(machines[0].id);
  const [azimuth, setAzimuth] = useState(HOME_AZIMUTH);
  const [elevation, setElevation] = useState(HOME_ELEVATION);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const machine = machineById(machineId);
  const view = useMemo(
    () => renderMachine(machine, azimuth, elevation, selectedId),
    [machine, azimuth, elevation, selectedId],
  );
  const selected = view.parts.find((part) => part.id === selectedId) ?? null;

  return (
    <div className="min-h-svh">
      <header className="mx-auto flex max-w-6xl flex-col gap-6 px-5 pt-8 pb-2 sm:px-8 sm:pt-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className="text-[0.65rem] font-semibold tracking-[0.22em] text-muted-foreground uppercase">Anatomy</p>
          <h1 className="font-heading text-4xl leading-none sm:text-5xl">Explorer</h1>
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
          Three bundled machines, drawn with the Anatomy kit. Drag the figure to orbit it. Click a part to read what it does.
        </p>
      </header>
      <main className="mx-auto grid max-w-6xl gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <section className="min-w-0">
          <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Machines">
            {machines.map((item) => (
              <Button
                key={item.id}
                type="button"
                role="tab"
                size="sm"
                variant={item.id === machine.id ? "default" : "outline"}
                aria-selected={item.id === machine.id}
                onClick={() => {
                  setMachineId(item.id);
                  setSelectedId(null);
                }}
              >
                {item.title}
              </Button>
            ))}
          </div>
          <FigureStage
            fig={machine.fig}
            title={machine.title}
            caption={machine.caption}
            legendLit={machine.legendLit}
            legendRaised={machine.legendRaised}
            svg={view.svg}
            azimuth={azimuth}
            elevation={elevation}
            onAzimuth={setAzimuth}
            onElevation={setElevation}
            onSelect={setSelectedId}
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setAzimuth((value) => wrapDegrees(value - 18))}>
              Turn left
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setAzimuth((value) => wrapDegrees(value + 18))}>
              Turn right
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setAzimuth(HOME_AZIMUTH);
                setElevation(HOME_ELEVATION);
              }}
            >
              Reset view
            </Button>
          </div>
        </section>
        <Card>
          <CardHeader>
            <Badge variant="secondary">{machine.kind}</Badge>
            <CardTitle className="mt-3">{selected ? selected.name : machine.title}</CardTitle>
            <CardDescription>{selected ? selected.description : machine.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <Separator />
            <ol className="mt-2">
              {view.parts.map((part, index) => {
                const active = part.id === selectedId;
                return (
                  <li key={part.id}>
                    <button
                      type="button"
                      aria-pressed={active}
                      className={cn(
                        "flex w-full gap-3 border-b border-border py-3 text-left transition-colors",
                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                      )}
                      onClick={() => setSelectedId(part.id)}
                    >
                      <span className="w-6 shrink-0 font-mono text-[10px] tracking-widest">{String(index + 1).padStart(2, "0")}</span>
                      <span className="text-sm">{part.name}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              Arrow keys orbit while the figure is focused. Elevation stays between 18° and 50°.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
