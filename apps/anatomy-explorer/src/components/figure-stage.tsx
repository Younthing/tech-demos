import { useEffect, useRef } from "react";
import { clamp, wrapDegrees } from "@/machines/project.ts";

type FigureStageProps = {
  fig: string;
  title: string;
  caption: string;
  legendLit: string;
  legendRaised: string;
  svg: string;
  azimuth: number;
  elevation: number;
  onAzimuth: (value: number) => void;
  onElevation: (value: number) => void;
  onSelect: (id: string) => void;
};

export function FigureStage({
  fig,
  title,
  caption,
  legendLit,
  legendRaised,
  svg,
  azimuth,
  elevation,
  onAzimuth,
  onElevation,
  onSelect,
}: FigureStageProps) {
  const drag = useRef<{ x: number; y: number; azimuth: number; elevation: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const frame = useRef(0);
  const pending = useRef<{ azimuth: number; elevation: number } | null>(null);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return (
    <div className="iso" data-theme="light">
      <figure className="iso-figure">
        <div className="iso-plate">
          <div className="iso-plate-corners" aria-hidden="true">
            <span className="iso-plate-corner" data-corner="fig">
              {fig}
            </span>
            <span className="iso-plate-corner" data-corner="title">
              {title}
            </span>
            <span className="iso-plate-corner" data-corner="hint">
              Drag to orbit · click a part
            </span>
            <span className="iso-plate-corner" data-corner="readout" data-readout="">
              {Math.round(azimuth)}° · {Math.round(elevation)}°
            </span>
          </div>
          <div
            className="iso-stage"
            tabIndex={0}
            role="application"
            aria-label={`${title}. Drag to orbit the machine. Click a part to inspect it. Arrow keys turn the view.`}
            dangerouslySetInnerHTML={{ __html: svg }}
            onPointerDown={(event) => {
              if (event.button !== 0) return;
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = { x: event.clientX, y: event.clientY, azimuth, elevation, moved: false };
            }}
            onPointerMove={(event) => {
              const start = drag.current;
              if (!start) return;
              const dx = event.clientX - start.x;
              const dy = event.clientY - start.y;
              if (Math.hypot(dx, dy) <= 4) return;
              start.moved = true;
              pending.current = {
                azimuth: wrapDegrees(start.azimuth + dx * 0.45),
                elevation: clamp(start.elevation - dy * 0.12, 18, 50),
              };
              if (frame.current) return;
              frame.current = requestAnimationFrame(() => {
                frame.current = 0;
                const next = pending.current;
                if (!next) return;
                onAzimuth(next.azimuth);
                onElevation(next.elevation);
              });
            }}
            onPointerUp={() => {
              if (drag.current?.moved) suppressClick.current = true;
              drag.current = null;
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
            onClick={(event) => {
              if (suppressClick.current) {
                suppressClick.current = false;
                return;
              }
              const target = event.target as Element;
              const id =
                target.closest?.("[data-part]")?.getAttribute("data-part") ??
                document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-part]")?.getAttribute("data-part");
              if (id) onSelect(id);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                onAzimuth(wrapDegrees(azimuth - 18));
              } else if (event.key === "ArrowRight") {
                event.preventDefault();
                onAzimuth(wrapDegrees(azimuth + 18));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                onElevation(clamp(elevation + 4, 18, 50));
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                onElevation(clamp(elevation - 4, 18, 50));
              }
            }}
          />
        </div>
        <figcaption className="iso-legend">
          <span className="iso-keys">
            <span className="iso-key">
              <Swatch mark="lit" />
              {legendLit}
            </span>
            <span className="iso-key">
              <Swatch mark="raised" />
              {legendRaised}
            </span>
          </span>
          <span className="iso-caption">{caption}</span>
        </figcaption>
      </figure>
    </div>
  );
}

function Swatch({ mark }: { mark: "lit" | "raised" }) {
  return (
    <svg className="iso-swatch" data-mark={mark} viewBox="0 0 16 10" aria-hidden="true">
      <path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z" />
      <path className="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5" />
    </svg>
  );
}
