/* TOOLS_WINDOW_CHROME_v1 */
import { useEffect, useMemo, useRef, useState } from "react";

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export default function DragResizeWindow({
  id,
  title = "Drag / Resize",
  ipText = "",
  defaultRect = { x: 90, y: 160, w: 560, h: 260 },
  minW = 360,
  minH = 200,
  onClose,
  children
}) {
  const key = useMemo(() => `toolsisp:panel:${id}`, [id]);
  const ref = useRef(null);

  const [rect, setRect] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...defaultRect, ...JSON.parse(raw) };
    } catch {}
    return defaultRect;
  });

  // keep in viewport on resize
  useEffect(() => {
    const onResize = () => {
      setRect(r => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const w = clamp(r.w, minW, vw - 16);
        const h = clamp(r.h, minH, vh - 16);
        const x = clamp(r.x, 8, Math.max(8, vw - w - 8));
        const y = clamp(r.y, 8, Math.max(8, vh - h - 8));
        return { x, y, w, h };
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [minW, minH]);

  // persist
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(rect)); } catch {}
  }, [key, rect]);

  const reset = () => {
    try { localStorage.removeItem(key); } catch {}
    setRect(defaultRect);
  };

  // Drag
  const dragRef = useRef({ on: false, dx: 0, dy: 0 });
  const onHeaderDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current.on = true;
    dragRef.current.dx = e.clientX - rect.x;
    dragRef.current.dy = e.clientY - rect.y;
    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragUp);
  };
  const onDragMove = (e) => {
    if (!dragRef.current.on) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = clamp(e.clientX - dragRef.current.dx, 8, vw - rect.w - 8);
    const y = clamp(e.clientY - dragRef.current.dy, 8, vh - rect.h - 8);
    setRect(r => ({ ...r, x, y }));
  };
  const onDragUp = () => {
    dragRef.current.on = false;
    document.removeEventListener("mousemove", onDragMove);
    document.removeEventListener("mouseup", onDragUp);
  };

  // Resize (bottom-right)
  const rsRef = useRef({ on: false, x: 0, y: 0, w: 0, h: 0 });
  const onResizeDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    rsRef.current.on = true;
    rsRef.current.x = e.clientX;
    rsRef.current.y = e.clientY;
    rsRef.current.w = rect.w;
    rsRef.current.h = rect.h;
    document.addEventListener("mousemove", onResizeMove);
    document.addEventListener("mouseup", onResizeUp);
  };
  const onResizeMove = (e) => {
    if (!rsRef.current.on) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const dw = e.clientX - rsRef.current.x;
    const dh = e.clientY - rsRef.current.y;

    const w = clamp(rsRef.current.w + dw, minW, vw - rect.x - 8);
    const h = clamp(rsRef.current.h + dh, minH, vh - rect.y - 8);
    setRect(r => ({ ...r, w, h }));
  };
  const onResizeUp = () => {
    rsRef.current.on = false;
    document.removeEventListener("mousemove", onResizeMove);
    document.removeEventListener("mouseup", onResizeUp);
  };

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        zIndex: 50,
        borderRadius: 16,
        overflow: "hidden",
        background: "rgba(18,20,26,0.72)",
        border: "1px solid rgba(255,255,255,0.10)",
        boxShadow: "0 16px 60px rgba(0,0,0,0.55)",
        backdropFilter: "blur(12px)"
      }}
    >
      {/* Header */}
      <div
        onMouseDown={onHeaderDown}
        style={{
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 8px 0 10px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
          cursor: "grab",
          userSelect: "none"
        }}
        title="Drag"
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 12, letterSpacing: 0.2, opacity: 0.92 }}>
            {title}
          </div>
          {ipText ? (
            <div style={{ fontSize: 11, opacity: 0.65, whiteSpace: "nowrap" }}>
              {ipText}
            </div>
          ) : null}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={reset}
            style={{
              height: 24,
              padding: "0 8px",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.06)",
              color: "inherit",
              fontWeight: 800,
              fontSize: 11,
              cursor: "pointer"
            }}
            title="Reset position/size"
           className="twBtn twReset">Reset</button>

          <button
  type="button"
  className="twBtn twClose"
  onClick={onClose}
  title="Close"
  aria-label="Close"
>
  ×
</button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 8, height: "calc(100% - 36px)" }}>
        {children}
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={onResizeDown}
        style={{
          position: "absolute",
          right: 6,
          bottom: 6,
          width: 18,
          height: 18,
          cursor: "nwse-resize",
          borderRadius: 6,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)"
        }}
        title="Resize"
      />
    </div>
  );
}


/* TOOLS_TIGHTPAD_DRG_v1 */

