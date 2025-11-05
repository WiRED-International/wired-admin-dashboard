import React from "react";

export type ResizableTHProps = {
  columnKey: string;
  children: React.ReactNode;
  baseStyle: React.CSSProperties;
  setColWidths: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  colWidths: Record<string, number>;
  onHeaderClick?: () => void; 
};

export const ResizableTH: React.FC<ResizableTHProps> = ({
  columnKey,
  children,
  baseStyle,
  setColWidths,
  colWidths,
  onHeaderClick,
}) => {
  const thRef = React.useRef<HTMLTableHeaderCellElement | null>(null);
  const startXRef = React.useRef(0);
  const startWidthRef = React.useRef<number | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // prevent triggering sort
    startXRef.current = e.clientX;
    startWidthRef.current = thRef.current?.offsetWidth ?? null;
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (startWidthRef.current == null) return;
    const delta = e.clientX - startXRef.current;
    const newWidth = Math.max(60, startWidthRef.current + delta);
    setColWidths((prev) => ({ ...prev, [columnKey]: newWidth }));
  };

  const onMouseUp = () => {
    startWidthRef.current = null;
    document.removeEventListener("mousemove", onMouseMove);
    document.removeEventListener("mouseup", onMouseUp);
  };

  return (
    <th
      ref={thRef}
      style={{
        ...baseStyle,
        position: "relative",
        width: colWidths[columnKey]
          ? `${colWidths[columnKey]}px`
          : baseStyle.width,
        cursor: "pointer",
      }}
      onClick={onHeaderClick}
    >
      <div style={{ display: "inline-flex", alignItems: "center" }}>
        {children}
      </div>

      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          height: "100%",
          width: "6px",
          cursor: "col-resize",
          userSelect: "none",
          backgroundColor: "transparent",
        }}
        onMouseEnter={(e) =>
          ((e.target as HTMLElement).style.backgroundColor = "#d0d0d0")
        }
        onMouseLeave={(e) =>
          ((e.target as HTMLElement).style.backgroundColor = "transparent")
        }
      />
    </th>
  );
};