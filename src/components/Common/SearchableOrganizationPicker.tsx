import { useEffect, useMemo, useRef, useState } from "react";

type Organization = {
  id: number;
  name: string;
};

type Props = {
  organizations: Organization[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  placeholder?: string;
  clearLabel?: string;
};

export default function SearchableOrganizationPicker({
  organizations,
  selectedId,
  onSelect,
  placeholder = "All Organizations",
  clearLabel = "Clear Organization Filter",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef =
    useRef<HTMLDivElement>(null);

  const filteredOrganizations =
    useMemo(() => {

      return organizations.filter(
        org =>
          org.name
            .toLowerCase()
            .includes(
              search.toLowerCase()
            )
      );

    }, [
      organizations,
      search,
    ]);

  useEffect(() => {

    function handleClickOutside(
      event: MouseEvent
    ) {

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target as Node
        )
      ) {
        setOpen(false);
      }

    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

  }, []);

  return (
    <div
      style={styles.wrapper}
      ref={wrapperRef}
    >

      <div
        style={styles.dropdown}
        onClick={() =>
          setOpen(!open)
        }
      >
        {selectedId
          ? organizations.find(
              o =>
                o.id ===
                selectedId
            )?.name
          : placeholder}
      </div>

      {open && (
        <div style={styles.panel}>

          <input
            type="text"
            placeholder="Search organizations..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            autoFocus
            style={styles.searchInput}
          />

          <div style={styles.listContainer}>

            {filteredOrganizations.length === 0 && (
              <div style={styles.noResults}>
                No organizations found
              </div>
            )}

            {filteredOrganizations.map(
              (org) => (
                <div
                  key={org.id}
                  style={styles.listItem}
                  onClick={() => {
                    onSelect(org.id);
                    setOpen(false);
                    setSearch("");
                  }}
                >
                  {org.name}
                </div>
              )
            )}

          </div>

          <div
            style={styles.clearItem}
            onClick={() => {
              onSelect(null);
              setOpen(false);
              setSearch("");
            }}
          >
            {clearLabel}
          </div>

        </div>
      )}

    </div>
  );
}

const styles: {
  [key: string]:
    React.CSSProperties;
} = {

  wrapper: {
    position: "relative",
  },

  dropdown: {
    minWidth: "220px",
    padding: "10px 14px",
    backgroundColor:
      "#F4F4F5",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#444",
    border: "1px solid #ddd",
    cursor: "pointer",
  },

  panel: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "4px",
    width: "320px",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "8px",
    boxShadow:
      "0 4px 12px rgba(0,0,0,0.12)",
    zIndex: 1000,
  },

  searchInput: {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #E5E7EB",
    fontSize: "14px",
  },

  listContainer: {
    maxHeight: "220px",
    overflowY: "auto",
  },

  listItem: {
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "14px",
  },

  noResults: {
    padding: "12px",
    color: "#666",
  },

  clearItem: {
    padding: "10px 12px",
    borderTop: "1px solid #E5E7EB",
    cursor: "pointer",
    fontSize: "14px",
    color: "#B91C1C",
    fontWeight: 600,
  },

};