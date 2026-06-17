type TableHeadCellProps = {
  children: React.ReactNode;

  width?: string;

  onClick?: () => void;

  style?: React.CSSProperties;
};

export default function TableHeadCell({
  children,
  width,
  onClick,
  style = {},
}: TableHeadCellProps) {

  return (
    <th
      onClick={onClick}
      style={{
        ...styles.cell,
        width,
        ...style,
      }}
    >
      {children}
    </th>
  );
}

const styles: { [key: string]: React.CSSProperties } = {

  cell: {
    textAlign: "left",

    whiteSpace: "nowrap",

    border: "1px solid #E2E8F0",

    padding: "14px 12px",

    background: "#F8FAFC",

    fontWeight: 700,

    fontSize: "14px",

    color: "#334155",

    verticalAlign: "middle",

    userSelect: "none",
  },
};