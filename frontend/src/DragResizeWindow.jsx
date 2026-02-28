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

const uiLockRef = useRef({ overflow: "", userSelect: "" });

const lockUI = () => {
  try {
    uiLockRef.current.overflow = document.body.style.overflow || "";
    uiLockRef.current.userSelect = document.body.style.userSelect || "";
    document.body.style.overflow = "hidden";
    document.body.style.userSelect = "none";
  } catch {}
};

const unlockUI = () => {
  try {
    document.body.style.overflow = uiLockRef.current.overflow || "";
    document.body.style.userSelect = uiLockRef.current.userSelect || "";
  } catch {}
};
/* TOOLSISP_SCROLL_LOCK_v1 */
const [rect, setRect] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...defaultRect, ...JSON.parse(raw) };
    } catch {}
    return defaultRect;
  });

  // keep in viewport on resize

useEffect(() => {
  const end = () => unlockUI();
  window.addEventListener("pointerup", end, { passive: true });
  window.addEventListener("pointercancel", end, { passive: true });
  window.addEventListener("blur", end);
  return () => {
    window.removeEventListener("pointerup", end);
    window.removeEventListener("pointercancel", end);
    window.removeEventListener("blur", end);
  };
}, []);
/* TOOLSISP_UNLOCK_SAFETY_v1 */

  const reset = () => {
    try { localStorage.removeItem(key); } catch {}
    setRect(defaultRect);
  };
  // Drag (pointer-based)
  const dragRef = useRef({ on: false, dx: 0, dy: 0, pointerId: null });

  const onHeaderDown = (e) => {
    const t = e.target;
    if (t && (t.closest?.("button") || t.closest?.("a") || t.closest?.("input"))) return;
    /* TOOLSISP_CLOSE_CLICK_FIX_v1 */
    // support mouse + touch + pen
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    lockUI();
    dragRef.current.on = true;
    dragRef.current.pointerId = e.pointerId ?? null;
    dragRef.current.dx = e.clientX - rect.x;
    dragRef.current.dy = e.clientY - rect.y;

    // capture pointer so movement continues even if cursor leaves window/element
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}

    window.addEventListener("pointermove", onDragMove, { passive: false });
    window.addEventListener("pointerup", onDragUp, { passive: false });
    window.addEventListener("pointercancel", onDragUp, { passive: false });
  };

  const onDragMove = (e) => {
    if (!dragRef.current.on) return;
    // if we stored a pointerId, ignore others
    if (dragRef.current.pointerId != null && e.pointerId != null && e.pointerId !== dragRef.current.pointerId) return;

    e.preventDefault();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    // use functional update so we always clamp with latest rect.w/h
    setRect((r) => {
      const x = clamp(e.clientX - dragRef.current.dx, 8, vw - r.w - 8);
      const y = clamp(e.clientY - dragRef.current.dy, 8, vh - r.h - 8);
      return { ...r, x, y };
    });
  };

  const onDragUp = (e) => {
    // only end the active pointer
    if (dragRef.current.pointerId != null && e?.pointerId != null && e.pointerId !== dragRef.current.pointerId) return;

    unlockUI();

    dragRef.current.on = false;
    dragRef.current.pointerId = null;
    window.removeEventListener("pointermove", onDragMove);
    window.removeEventListener("pointerup", onDragUp);
    window.removeEventListener("pointercancel", onDragUp);
  };

  // Resize (bottom-right) pointer-based
  const rsRef = useRef({ on: false, x: 0, y: 0, w: 0, h: 0, pointerId: null });

  const onResizeDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    lockUI();
    rsRef.current.on = true;
    rsRef.current.pointerId = e.pointerId ?? null;
    rsRef.current.x = e.clientX;
    rsRef.current.y = e.clientY;
    rsRef.current.w = rect.w;
    rsRef.current.h = rect.h;

    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}

    window.addEventListener("pointermove", onResizeMove, { passive: false });
    window.addEventListener("pointerup", onResizeUp, { passive: false });
    window.addEventListener("pointercancel", onResizeUp, { passive: false });
  };

  const onResizeMove = (e) => {
    if (!rsRef.current.on) return;
    if (rsRef.current.pointerId != null && e.pointerId != null && e.pointerId !== rsRef.current.pointerId) return;

    e.preventDefault();
    const vw = document.documentElement.clientWidth;
    const vh = document.documentElement.clientHeight;

    const dw = e.clientX - rsRef.current.x;
    const dh = e.clientY - rsRef.current.y;

    // clamp using latest rect.x/y from state to avoid stale closure issues
    setRect((r) => {
      const w = clamp(rsRef.current.w + dw, minW, vw - r.x - 8);
      const h = clamp(rsRef.current.h + dh, minH, vh - r.y - 8);
      return { ...r, w, h };
    });
  };

  const onResizeUp = (e) => {
    if (rsRef.current.pointerId != null && e?.pointerId != null && e.pointerId !== rsRef.current.pointerId) return;

    unlockUI();

    rsRef.current.on = false;
    rsRef.current.pointerId = null;
    window.removeEventListener("pointermove", onResizeMove);
    window.removeEventListener("pointerup", onResizeUp);
    window.removeEventListener("pointercancel", onResizeUp);
  };



  return (
    <div className="toolsWindow"
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
        onPointerDown={onHeaderDown}
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
            onPointerDown={(e)=>{e.stopPropagation();}} onClick={reset}
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
  onPointerDown={(e)=>{e.stopPropagation();}} type="button"
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
      <div style={{
  padding: 8,
  height: "calc(100% - 36px)",
  overflow: "auto",
  boxSizing: "border-box"
}}>
        {children}
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={onResizeDown}
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














/* TOOLSISP_BTN_STOPPROP_v1 */



