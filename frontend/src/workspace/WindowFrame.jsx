import React, { useEffect, useMemo, useRef } from "react";

/**
 * Minimal draggable + resizable window frame.
 * Drag from header only. Resize from bottom-right handle.
 */
export default function WindowFrame({ win, onFocus, onClose, onChange, children }) {
  const ref = useRef(null);

  const style = useMemo(() => ({
    left: (win.x ?? 120) + "px",
    top:  (win.y ?? 120) + "px",
    width: (win.w ?? 520) + "px",
    height:(win.h ?? 320) + "px",
    zIndex: win.z ?? 10,
  }), [win]);

  useEffect(() => {
    const el = ref.current;
    if(!el) return;

    const header = el.querySelector(".wsWinHead");
    const resizer = el.querySelector(".wsWinResize");

    let drag = null;
    let resize = null;

    function clamp(n, min, max){
      return Math.max(min, Math.min(max, n));
    }

    function onDownHeader(e){
      if(e.button !== 0) return;
      onFocus?.();
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      drag = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: rect.left,
        baseY: rect.top
      };

      window.addEventListener("mousemove", onMoveDrag, true);
      window.addEventListener("mouseup", onUpDrag, true);
    }

    function onMoveDrag(e){
      if(!drag) return;
      e.preventDefault();

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;

      const nx = clamp(drag.baseX + dx, 0, window.innerWidth - 80);
      const ny = clamp(drag.baseY + dy, 0, window.innerHeight - 60);

      onChange?.({ x: Math.round(nx), y: Math.round(ny) });
    }

    function onUpDrag(){
      drag = null;
      window.removeEventListener("mousemove", onMoveDrag, true);
      window.removeEventListener("mouseup", onUpDrag, true);
    }

    function onDownResize(e){
      if(e.button !== 0) return;
      onFocus?.();
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      resize = {
        startX: e.clientX,
        startY: e.clientY,
        baseW: rect.width,
        baseH: rect.height
      };

      window.addEventListener("mousemove", onMoveResize, true);
      window.addEventListener("mouseup", onUpResize, true);
    }

    function onMoveResize(e){
      if(!resize) return;
      e.preventDefault();

      const dx = e.clientX - resize.startX;
      const dy = e.clientY - resize.startY;

      const nw = clamp(resize.baseW + dx, 320, window.innerWidth - 40);
      const nh = clamp(resize.baseH + dy, 220, window.innerHeight - 40);

      onChange?.({ w: Math.round(nw), h: Math.round(nh) });
    }

    function onUpResize(){
      resize = null;
      window.removeEventListener("mousemove", onMoveResize, true);
      window.removeEventListener("mouseup", onUpResize, true);
    }

    header?.addEventListener("mousedown", onDownHeader);
    resizer?.addEventListener("mousedown", onDownResize);

    return () => {
      header?.removeEventListener("mousedown", onDownHeader);
      resizer?.removeEventListener("mousedown", onDownResize);
      window.removeEventListener("mousemove", onMoveDrag, true);
      window.removeEventListener("mouseup", onUpDrag, true);
      window.removeEventListener("mousemove", onMoveResize, true);
      window.removeEventListener("mouseup", onUpResize, true);
    };
  }, [onFocus, onChange]);

  return (
    <div
      ref={ref}
      className="wsWin"
      style={style}
      onMouseDown={() => onFocus?.()}
    >
      <div className="wsWinHead">
        <div className="wsWinTitle">{win.title ?? win.type ?? "Window"}</div>
        <div className="wsWinBtns">
          <button className="wsWinBtn" onClick={(e)=>{ e.stopPropagation(); onClose?.(); }} title="Close">✕</button>
        </div>
      </div>

      <div className="wsWinBody">
        {children}
      </div>

      <div className="wsWinResize" title="Resize" />
    </div>
  );
}
