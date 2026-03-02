import React, { useMemo, useRef } from "react";

/**
 * Stable draggable + resizable window frame.
 * - Drag from header only
 * - Resize from bottom-right only
 * - Uses window listeners created on demand (no re-render breakage)
 */
export default function WindowFrame({ win, onFocus, onClose, onChange, children }) {
  const ref = useRef(null);

  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  const style = useMemo(() => ({
    left: (win.x ?? 120) + "px",
    top:  (win.y ?? 120) + "px",
    width: (win.w ?? 520) + "px",
    height:(win.h ?? 320) + "px",
    zIndex: win.z ?? 10,
  }), [win.x, win.y, win.w, win.h, win.z]);

  function clamp(n, min, max){
    return Math.max(min, Math.min(max, n));
  }

  function stopDragListeners(){
    window.removeEventListener("mousemove", onMoveDrag, true);
    window.removeEventListener("mouseup", onUpDrag, true);
    document.documentElement.classList.remove("wsNoSelect");
  }

  function stopResizeListeners(){
    window.removeEventListener("mousemove", onMoveResize, true);
    window.removeEventListener("mouseup", onUpResize, true);
    document.documentElement.classList.remove("wsNoSelect");
  }

  function onDownHeader(e){
    if(e.button !== 0) return;
    onFocus?.();
    e.preventDefault();
    e.stopPropagation();

    const el = ref.current;
    if(!el) return;

    const rect = el.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseX: rect.left,
      baseY: rect.top,
    };

    document.documentElement.classList.add("wsNoSelect");
    window.addEventListener("mousemove", onMoveDrag, true);
    window.addEventListener("mouseup", onUpDrag, true);
  }

  function onMoveDrag(e){
    const d = dragRef.current;
    if(!d) return;
    e.preventDefault();

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;

    const nx = clamp(d.baseX + dx, 0, window.innerWidth - 80);
    const ny = clamp(d.baseY + dy, 0, window.innerHeight - 60);

    onChange?.({ x: Math.round(nx), y: Math.round(ny) });
  }

  function onUpDrag(){
    dragRef.current = null;
    stopDragListeners();
  }

  function onDownResize(e){
    if(e.button !== 0) return;
    onFocus?.();
    e.preventDefault();
    e.stopPropagation();

    const el = ref.current;
    if(!el) return;

    const rect = el.getBoundingClientRect();
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      baseW: rect.width,
      baseH: rect.height
    };

    document.documentElement.classList.add("wsNoSelect");
    window.addEventListener("mousemove", onMoveResize, true);
    window.addEventListener("mouseup", onUpResize, true);
  }

  function onMoveResize(e){
    const r = resizeRef.current;
    if(!r) return;
    e.preventDefault();

    const dx = e.clientX - r.startX;
    const dy = e.clientY - r.startY;

    const nw = clamp(r.baseW + dx, 320, window.innerWidth - 40);
    const nh = clamp(r.baseH + dy, 220, window.innerHeight - 40);

    onChange?.({ w: Math.round(nw), h: Math.round(nh) });
  }

  function onUpResize(){
    resizeRef.current = null;
    stopResizeListeners();
  }

  function onReset(e){
    e?.stopPropagation?.();
    // Safe defaults based on window type (no assumptions about tools internals)
    const t = String(win.type || "").toLowerCase();
    const base = {
      x: 140,
      y: 120,
      w: (t === "note" ? 420 : 560),
      h: (t === "note" ? 320 : 360),
    };
    onChange?.(base);
    onFocus?.();
  }

  return (
    <div
      ref={ref}
      className={"wsWin" + (win.isTop ? " isTop" : "")}
      style={style}
      onMouseDown={() => onFocus?.()}
    >
      <div className="wsWinHead" onMouseDown={onDownHeader}>
        <div className="wsWinTitle">{win.title ?? win.type ?? "Window"}</div>
        <div className="wsWinBtns">
          <button
            className="wsWinBtn wsWinBtnReset"
            onClick={onReset}
            title="Reset position/size"
          >
            Reset
          </button>
          <button
            className="wsWinBtn wsWinBtnClose"
            onClick={(e)=>{ e.stopPropagation(); onClose?.(); }}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="wsWinBody">
        {children}
      </div>

      <div className="wsWinResize" onMouseDown={onDownResize} title="Resize" />
    </div>
  );
}

