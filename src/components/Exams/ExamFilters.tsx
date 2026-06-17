import { getAllExams, getAccessibleOrganizations } from "@/api/examsAPI";
import { useEffect, useRef, useState } from "react";
import { ExamListItem } from "@/interfaces/ExamListItemInterface";
import { OrganizationListItem } from "@/interfaces/OrganizationListItemInterface";
import { ExamFilters as ExamFiltersType } from "@/interfaces/Exam";
import SearchableOrganizationPicker from "@/components/Common/SearchableOrganizationPicker";

type ExamFiltersProps = {
  filters: ExamFiltersType;

  setFilters: React.Dispatch<
    React.SetStateAction<ExamFiltersType>
  >; 
};

export default function ExamFilters({
  filters,
  setFilters,
}: ExamFiltersProps) {
  const {
    examId,
    orgId,
    status,
    limit,
    dateFrom,
    dateTo,
  } = filters;

  const [examOptions, setExamOptions] = useState<ExamListItem[]>([]); 

  const [examOpen, setExamOpen] = useState(false);

  const [examSearch, setExamSearch] = useState("");

  const examRef = useRef<HTMLDivElement>(null);

  const [orgOptions, setOrgOptions] = useState<OrganizationListItem[]>([]);

  // Filter logic
  const filteredExams = (examOptions ?? []).filter((exam) =>
    exam.title.toLowerCase().includes(examSearch.toLowerCase())
  );

  const STATUS_OPTIONS = [
    { value: null, label: "All Statuses" },
    { value: "passed", label: "Passed" },
    { value: "failed", label: "Failed" },
    { value: "in-progress", label: "In Progress" },
  ];

   // 1️⃣ Fetch exams + orgs
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [exams, orgs] = await Promise.all([
          getAllExams(),
          getAccessibleOrganizations()
        ]);
        setExamOptions(exams);
        setOrgOptions(orgs);
      } catch (err) {
        console.error("Failed to load filter data:", err);
      } 
    };
    fetchFilters();
  }, []);

  // 2️⃣ Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {

      if (
        examRef.current &&
        !examRef.current.contains(event.target as Node)
      ) {
        setExamOpen(false);
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
    <div style={styles.container}>
      
      {/* LEFT FILTER SECTION */}
      <div style={styles.leftSection}>

        {/* Exam Dropdown */}
        <div
          style={styles.searchableWrapper}
          ref={examRef}
        >

          <div
            style={styles.dropdown}
            onClick={() =>
              setExamOpen(!examOpen)
            }
          >
            {examId
              ? (() => {
                  const exam = examOptions.find(
                    e => e.id === examId
                  );

                  if (!exam) return "All Exams";

                  return `${exam.title} (${new Date(
                    exam.available_from
                  ).toLocaleDateString()})`;
                })()
              : "All Exams"}
          </div>

          {examOpen && (

            <div style={styles.dropdownPanel}>

              <input
                type="text"
                placeholder="Search exams..."
                style={styles.searchInput}
                value={examSearch}
                onChange={(e) =>
                  setExamSearch(
                    e.target.value
                  )
                }
                autoFocus
              />

              <div style={styles.listContainer}>

                {filteredExams.length === 0 && (
                  <div style={styles.noResults}>
                    No exams found
                  </div>
                )}

                {filteredExams.map((exam) => (

                  <div
                    key={exam.id}
                    style={styles.listItem}
                    onClick={() => {

                      setFilters(prev => ({
                        ...prev,
                        examId: exam.id,
                      }));

                      setExamOpen(false);
                    }}
                  >
                    <>
                      <div>
                        {exam.title}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B7280",
                          marginTop: "2px",
                        }}
                      >
                        {new Date(
                            exam.available_from
                          ).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        }
                      </div>
                    </>
                  </div>

                ))}

              </div>

              <div
                style={styles.clearItem}
                onClick={() => {

                  setFilters(prev => ({
                    ...prev,
                    examId: null,
                  }));

                  setExamSearch("");

                  setExamOpen(false);
                }}
              >
                Clear Exam Filter
              </div>

            </div>

          )}

        </div>

        {/* ===== SEARCHABLE ORGANIZATION DROPDOWN ===== */}
        <SearchableOrganizationPicker
          organizations={orgOptions}
          selectedId={orgId}
          onSelect={(id) => {
            setFilters((prev) => ({
              ...prev,
              orgId: id,
            }));
          }}
        />

        {/* Status Dropdown */}
        <select
          style={styles.dropdown}
          value={status ?? ""}
          onChange={(e) => {
            const newStatus = e.target.value || null;
            setFilters((prev) => ({
              ...prev,
              status: newStatus,
            }));           
          }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.label} value={opt.value ?? ""}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Limit Dropdown */}
        <select
          style={styles.dropdown}
          value={limit}
          onChange={(e) => {
            setFilters((prev) => ({
              ...prev,
              limit: Number(e.target.value),
            }));           
          }}
        >
          <option value={10}>10 per page</option>
          <option value={25}>25 per page</option>
          <option value={50}>50 per page</option>
          <option value={100}>100 per page</option>
        </select>
      
        {/* Date From */}
        <input
          type="date"
          style={styles.datePicker}
          value={dateFrom ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            setFilters((prev) => ({
              ...prev,
              dateFrom: val,
            }));           
          }}
        />

        {/* Date To */}
        <input
          type="date"
          style={styles.datePicker}
          value={dateTo ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            setFilters((prev) => ({
              ...prev,
              dateTo: val,
            }));           
          }}
        />

        {/* Clear Filters */}
        <button
          style={styles.clearBtn}
          onClick={() => {
            setFilters({
              examId: null,
              orgId: null,
              status: null,
              limit: 50,
              dateFrom: null,
              dateTo: null,
            });           
          }}
          >
          Clear Filters
        </button>
      </div>

      {/* RIGHT SIDE: Create Exam Button */}
      <button style={styles.createBtn}>+ Create Exam</button>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "10px",
    paddingBottom: "5px",
    borderBottom: "1px solid #e1e1e1",
  },

  leftSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  dropdown: {
    padding: "10px 14px",
    backgroundColor: "#F4F4F5",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#444",
    cursor: "pointer",
    border: "1px solid #ddd",
  },

  clearBtn: {
    padding: "10px 16px",
    backgroundColor: "#E0E0E0",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "#333",
  },

  createBtn: {
    padding: "10px 18px",
    backgroundColor: "#2B78F6",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "15px",
  },

  datePicker: {
    padding: "10px 14px",
    backgroundColor: "#F4F4F5",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#444",
    cursor: "pointer",
    border: "1px solid #ddd",
  },

  searchableWrapper: {
    position: "relative",
    minWidth: "180px",
  },

  dropdownPanel: {
    position: "absolute",
    top: "48px",
    left: 0,
    width: "100%",
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "6px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    zIndex: 1000,
  },

  searchInput: {
    width: "100%",
    padding: "10px 12px",
    border: "none",
    borderBottom: "1px solid #eee",
    outline: "none",
    fontSize: "14px",
  },

  listContainer: {
    maxHeight: "200px",
    overflowY: "auto",
  },

  listItem: {
    padding: "10px 14px",
    cursor: "pointer",
    fontSize: "14px",
  },
    
  clearItem: {
    padding: "10px 14px",
    backgroundColor: "#F4F4F5",
    cursor: "pointer",
    fontSize: "14px",
    borderTop: "1px solid #eee",
    textAlign: "center",
  },

  noResults: {
    padding: "12px",
    color: "#666",
    fontStyle: "italic",
  },
};

