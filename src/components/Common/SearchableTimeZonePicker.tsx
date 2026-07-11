import { useEffect, useMemo, useRef, useState } from "react";
import moment from "moment-timezone";
import { TIME_ZONE_ALIASES } from "@/data/timeZoneAliases";

type Props = {
  value: string;
  onChange: (timeZone: string) => void;
  placeholder?: string;
};

export default function SearchableTimeZonePicker({
  value,
  onChange,
  placeholder = "Select Time Zone",
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const wrapperRef =
    useRef<HTMLDivElement>(null);

const allTimeZones =
  useMemo(() => {
    return moment.tz.names();
  }, []);

  const filteredTimeZones =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      if (!query) {
        return [
            "Africa/Nairobi",
            "America/Los_Angeles",
            "America/New_York",
            "America/Chicago",
            "Europe/London",
            "Europe/Paris",
            "Asia/Dubai",
            "Asia/Tokyo",
            "UTC",
        ];
        }

      const aliasMatches =
        TIME_ZONE_ALIASES
          .filter((item) =>
            item.aliases.some(
              (alias) =>
                alias
                  .toLowerCase()
                  .includes(query)
            )
          )
          .map(
            (item) => item.timezone
          );

      const timezoneMatches =
        allTimeZones.filter(
          (zone: string) =>
            zone
              .toLowerCase()
              .includes(query)
        );

      return [
        ...new Set([
          ...aliasMatches,
          ...timezoneMatches,
        ]),
      ].slice(0, 100);
    }, [allTimeZones, search]);

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
      ref={wrapperRef}
      style={styles.wrapper}
    >
      <div
        style={styles.dropdown}
        onClick={() =>
          setOpen(!open)
        }
      >
        {value || placeholder}
      </div>

      {open && (
        <div style={styles.panel}>
          <input
            type="text"
            placeholder="Search time zones..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            autoFocus
            style={styles.searchInput}
          />

          <div style={styles.listContainer}>
            {filteredTimeZones.length === 0 && (
              <div style={styles.noResults}>
                No time zones found
              </div>
            )}

            {filteredTimeZones.map((zone: string) => (
              <div
                key={zone}
                style={styles.listItem}
                onClick={() => {
                  onChange(zone);
                  setOpen(false);
                  setSearch("");
                }}
              >
                {zone === value ? "✓ " : ""}
                {zone}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  wrapper: {
    position: "relative",
    width: "100%",
  },

  dropdown: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #CBD5E1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
  },

  panel: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: "4px",
    width: "100%",
    background: "#FFFFFF",
    border: "1px solid #CBD5E1",
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
    maxHeight: "240px",
    overflowY: "auto",
  },

  listItem: {
    padding: "10px 12px",
    cursor: "pointer",
    fontSize: "14px",
  },

  noResults: {
    padding: "12px",
    color: "#64748B",
    fontSize: "14px",
  },
};