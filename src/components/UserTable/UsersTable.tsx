import { UserDataInterface } from "../../interfaces/UserDataInterface";
import TableContainer from "../ui/TableContainer";
import cssStyles from "./UsersTable.module.css";
import UserTableActions from "./UserTableActions";
import { globalStyles } from "../../globalStyles";
import SortButtons from "../SortButton/SortButtons";
import { getCellStyle } from "../../utils/helperFunctions";
import React from "react";
import Table from "../ui/table/Table";

type UsersTableProps = {
  users: UserDataInterface[];
  sortBy: string | null;
  sortOrder: "ASC" | "DESC";
  setSortBy: (sortBy: string | null) => void;
  setSortOrder: (sortOrder: "ASC" | "DESC") => void;
  setCurrentPage: (currentPage: number) => void;
  fetchAllUsers: () => void;
  isDeleteConfirmOpen: boolean;
  setIsDeleteConfirmOpen: (isOpen: boolean) => void;
};

const CME_REQUIREMENT = 50;

const currentYear = new Date().getFullYear();
const previousYear = currentYear - 1;

const columns = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  {
    key: "previousYearCmeCredits",
    label: `${previousYear} CME`,
  },
  {
    key: "currentYearCmeCredits",
    label: `${currentYear} CME`,
  },
  { key: "organization", label: "Organization" },
  { key: "country", label: "Country" },
  { key: "role", label: "Role" },
  { key: "actions", label: "Actions" },
];

const nonSortableColumns = ["actions"];

const evenGray = "#FFFEFE";
const oddGray = "#F5F5F5";
const evenGreen = globalStyles.colors.singleUserViewHeader;
const oddGreen = "#E3FFDE";

const UsersTable: React.FC<UsersTableProps> = ({
  users,
  sortBy,
  sortOrder,
  setSortBy,
  setSortOrder,
  setCurrentPage,
  fetchAllUsers,
}: UsersTableProps) => {

  const getSortKey = (columnKey: string) => {
    if (columnKey === "name") {
      return "first_name";
    }

    return columnKey;
  };

  const sortButtonOnClick = (columnKey: string) => {
    if (!columnKey || nonSortableColumns.includes(columnKey)) return;

    const sortKey = getSortKey(columnKey);

    if (sortBy === sortKey) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
      setCurrentPage(1);
    } else {
      setSortBy(sortKey);
      setSortOrder("ASC");
      setCurrentPage(1);
    }
  };

  const renderCmeProgress = (
    credits: number,
    isPreviousYear: boolean
  ) => {
    const requirementMet = credits >= CME_REQUIREMENT;

    let statusColor = "#94A3B8";

    if (requirementMet) {
      statusColor = "#2E7D32";
    } else if (isPreviousYear) {
      statusColor = "#C62828";
    }

    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            width: "9px",
            height: "9px",
            borderRadius: "50%",
            backgroundColor: statusColor,
            flexShrink: 0,
          }}
        />

        <span
          style={{
            fontWeight: 600,
            color: "#334155",
          }}
        >
          {credits} / {CME_REQUIREMENT}
        </span>
      </div>
    );
  };

  const renderCellValue = (
    columnKey: string,
    user: UserDataInterface
  ): React.ReactNode => {

    if (columnKey === "name") {
      return `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
    }

    if (columnKey === "actions") {
      return (
        <UserTableActions
          user={user}
          fetchAllUsers={fetchAllUsers}
        />
      );
    }

    if (columnKey === "previousYearCmeCredits") {
      return renderCmeProgress(
        user.previousYearCmeCredits ?? 0,
        true
      );
    }

    if (columnKey === "currentYearCmeCredits") {
      return renderCmeProgress(
        user.currentYearCmeCredits ?? 0,
        false
      );
    }

    const value =
      (user as unknown as Record<string, unknown>)[columnKey];

    if (value && typeof value === "object") {
      const maybeName = (value as { name?: string }).name;

      return maybeName
        ? maybeName
        : JSON.stringify(value);
    }

    if (value === null || value === undefined) {
      return "";
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      return value;
    }

    return String(value);
  };

  return (
    <TableContainer>
      <Table>
        <thead className={cssStyles.stickyHeader}>
          <tr className={cssStyles.top_user_table_head}>
            {columns.map((column) => {
              const sortKey = getSortKey(column.key);

              return (
                <th
                  key={column.key}
                  style={{
                    ...styles.tableHead,
                    padding: "6px 8px",
                    textAlign: "center",
                    whiteSpace: "nowrap",

                    width:
                      column.key === "name"
                        ? "170px"
                        : column.key === "email"
                        ? "220px"
                        : column.key === "previousYearCmeCredits"
                        ? "130px"
                        : column.key === "currentYearCmeCredits"
                        ? "130px"
                        : column.key === "organization"
                        ? "160px"
                        : column.key === "country"
                        ? "110px"
                        : column.key === "role"
                        ? "100px"
                        : column.key === "actions"
                        ? "160px"
                        : "110px",
                  }}
                  onClick={() =>
                    sortButtonOnClick(column.key)
                  }
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <span>{column.label}</span>

                    {!nonSortableColumns.includes(
                      column.key
                    ) && (
                      <SortButtons
                        columnKey={sortKey}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                      />
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => {
            const isEven = index % 2 === 0;

            return (
              <tr
                key={user.id}
                className={cssStyles.tableRow}
                style={{
                  backgroundColor: isEven
                    ? evenGray
                    : oddGray,
                }}
              >
                {columns.map((column) => {
                  const sortKey = getSortKey(column.key);

                  const isSortedColumn =
                    sortKey === sortBy;

                  const backgroundColor =
                    isSortedColumn
                      ? isEven
                        ? evenGreen
                        : oddGreen
                      : "";

                  const cellValue = renderCellValue(
                    column.key,
                    user
                  );

                  return (
                    <td
                      key={column.key}
                      title={
                        typeof cellValue === "string" ||
                        typeof cellValue === "number"
                          ? String(cellValue)
                          : undefined
                      }
                      style={{
                        ...getCellStyle(
                          column.key,
                          backgroundColor
                        ),
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        maxWidth: "220px",
                      }}
                    >
                      {cellValue}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </Table>
    </TableContainer>
  );
};

export default UsersTable;

const styles: Record<string, React.CSSProperties> = {
  tableHead: {
    textAlign: "left",
    whiteSpace: "nowrap",
    border: "1px solid #E2E8F0",
    padding: "8px 6px",
    background: "#F8FAFC",
    fontWeight: 700,
    fontSize: "14px",
    color: "#334155",
    verticalAlign: "middle",
  },

  tableCell: {
    border: "1px solid #E2E8F0",
    padding: "4px 8px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: "120px",
    verticalAlign: "middle",
    fontSize: "14px",
    color: "#334155",
    backgroundColor: "#FFFFFF",
  },
};