import { cn } from "cn";
import type { ExecutionState } from "./model";

const LABEL: Record<ExecutionState, string> = {
  idle: "Idle",
  busy: "Busy",
  success: "Success",
  error: "Error",
};

export function ExecutionMark({ state }: { state: ExecutionState }) {
  return (
    <span className="inline-flex items-center gap-2 text-[0.625rem] font-semibold tracking-widest uppercase">
      <span
        aria-hidden="true"
        className={cn(
          "size-2 shrink-0",
          state === "idle" && "bg-muted-foreground/40",
          state === "busy" && "bg-foreground motion-safe:animate-pulse",
          state === "success" && "bg-foreground",
          state === "error" && "bg-destructive",
        )}
      />
      <span
        role="status"
        className={state === "error" ? "text-destructive" : "text-muted-foreground"}
      >
        {LABEL[state]}
      </span>
    </span>
  );
}
