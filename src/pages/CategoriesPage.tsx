import { useEffect, useState } from "react";
import {
  CategoryOption,
  fetchCategories,
} from "../api/moduleApi";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
} from "../api/categoriesAPI";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<number[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [categoryPendingDelete, setCategoryPendingDelete] =
    useState<CategoryOption | null>(null);

  const [deleting, setDeleting] = useState(false);

  const [deleteError, setDeleteError] =
    useState<string | null>(null);
    
  const [creatingSubCategoryFor, setCreatingSubCategoryFor] =
    useState<number | null>(null);

  const [newSubCategoryName, setNewSubCategoryName] =
    useState("");

  const [creatingSubCategory, setCreatingSubCategory] =
    useState(false);

  const [subCategoryCreateError, setSubCategoryCreateError] =
    useState<string | null>(null);

  const [editingSubCategoryId, setEditingSubCategoryId] =
    useState<number | null>(null);

  const [editingSubCategoryName, setEditingSubCategoryName] =
    useState("");

  const [editingSubCategoryParentId, setEditingSubCategoryParentId] =
    useState<number | null>(null);

  const [updatingSubCategory, setUpdatingSubCategory] =
    useState(false);

  const [subCategoryUpdateError, setSubCategoryUpdateError] =
    useState<string | null>(null);
  
  const [subCategoryPendingDelete, setSubCategoryPendingDelete] =
    useState<{ id: number; name: string } | null>(null);

  const [deletingSubCategory, setDeletingSubCategory] =
    useState(false);

  const [subCategoryDeleteError, setSubCategoryDeleteError] =
    useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchCategories();
        setCategories(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load categories."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadCategories();
  }, []);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      setCreateError("Please enter a category name.");
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      await createCategory(newCategoryName);

      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);

      setNewCategoryName("");
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create category."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategoryId === null) return;

    if (!editingCategoryName.trim()) {
      setUpdateError("Please enter a category name.");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError(null);

      await updateCategory(
        editingCategoryId,
        editingCategoryName
      );

      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);

      setEditingCategoryId(null);
      setEditingCategoryName("");
    } catch (err) {
      setUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to update category."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryPendingDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteCategory(categoryPendingDelete.id);

      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);

      setCategoryPendingDelete(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete category."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateSubCategory = async () => {
    if (creatingSubCategoryFor === null) return;

    if (!newSubCategoryName.trim()) {
      setSubCategoryCreateError(
        "Please enter a subcategory name."
      );
      return;
    }

    try {
      setCreatingSubCategory(true);
      setSubCategoryCreateError(null);

      await createSubCategory(
        newSubCategoryName,
        creatingSubCategoryFor
      );

      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);

      setExpandedIds((previous) =>
        previous.includes(creatingSubCategoryFor)
          ? previous
          : [...previous, creatingSubCategoryFor]
      );

      setNewSubCategoryName("");
      setCreatingSubCategoryFor(null);
    } catch (err) {
      setSubCategoryCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create subcategory."
      );
    } finally {
      setCreatingSubCategory(false);
    }
  };

  const handleUpdateSubCategory = async () => {
    if (
      editingSubCategoryId === null ||
      editingSubCategoryParentId === null
    ) {
      return;
    }

    if (!editingSubCategoryName.trim()) {
      setSubCategoryUpdateError(
        "Please enter a subcategory name."
      );
      return;
    }

    try {
      setUpdatingSubCategory(true);
      setSubCategoryUpdateError(null);

      await updateSubCategory(
        editingSubCategoryId,
        editingSubCategoryName,
        editingSubCategoryParentId
      );

      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);

      setExpandedIds((previous) =>
        previous.includes(editingSubCategoryParentId)
          ? previous
          : [...previous, editingSubCategoryParentId]
      );

      setEditingSubCategoryId(null);
      setEditingSubCategoryName("");
      setEditingSubCategoryParentId(null);
    } catch (err) {
      setSubCategoryUpdateError(
        err instanceof Error
          ? err.message
          : "Failed to update subcategory."
      );
    } finally {
      setUpdatingSubCategory(false);
    }
  };

  const handleDeleteSubCategory = async () => {
  if (!subCategoryPendingDelete) return;

    try {
      setDeletingSubCategory(true);
      setSubCategoryDeleteError(null);

      await deleteSubCategory(subCategoryPendingDelete.id);

      const updatedCategories = await fetchCategories();
      setCategories(updatedCategories);

      setSubCategoryPendingDelete(null);
    } catch (err) {
      setSubCategoryDeleteError(
        err instanceof Error
          ? err.message
          : "Failed to delete subcategory."
      );
    } finally {
      setDeletingSubCategory(false);
    }
  };

  const toggleCategory = (id: number) => {
    setExpandedIds((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.heading}>
            Categories &amp; Subcategories
          </h1>
          <p style={styles.subheading}>
            Manage the HealthMAP category and subcategory taxonomy.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm(true);

            setEditingCategoryId(null);
            setEditingCategoryName("");
            setUpdateError(null);

            setEditingSubCategoryId(null);
            setEditingSubCategoryName("");
            setEditingSubCategoryParentId(null);
            setSubCategoryUpdateError(null);

            setCreatingSubCategoryFor(null);
            setNewSubCategoryName("");
            setSubCategoryCreateError(null);

            setCategoryPendingDelete(null);
            setDeleteError(null);
            setSubCategoryPendingDelete(null);
            setSubCategoryDeleteError(null);
          }}
          style={styles.createButton}
          >
            + Create Category
          </button>
      </div>

      {categoryPendingDelete && (
        <div
          style={{
            ...styles.formCard,
            border: "1px solid #FCA5A5",
          }}
        >
          <h3>Delete Category</h3>

          <p>
            Are you sure you want to delete{" "}
            <strong>{categoryPendingDelete.name}</strong>?
          </p>

          <p>
            Categories containing subcategories cannot be deleted.
          </p>

          <button
            type="button"
            onClick={handleDeleteCategory}
            disabled={deleting}
            style={{
              ...styles.deleteButton,
              backgroundColor: "#B91C1C",
              color: "#FFFFFF",
            }}
          >
            {deleting ? "Deleting..." : "Confirm Delete"}
          </button>

          <button
            type="button"
            onClick={() => {
              setCategoryPendingDelete(null);
              setDeleteError(null);
            }}
            disabled={deleting}
            style={{
              ...styles.cancelButton,
              marginLeft: "8px",
            }}
          >
            Cancel
          </button>

          {deleteError && (
            <p style={{ color: "red" }}>{deleteError}</p>
          )}
        </div>
      )}

      {showCreateForm && (
        <div style={styles.formCard}>
          <h3>Create Category</h3>

          <label
            htmlFor="new-category-name"
            style={styles.formLabel}
          >
            Category Name
          </label>

          <input
            id="new-category-name"
            type="text"
            value={newCategoryName}
            onChange={(event) =>
              setNewCategoryName(event.target.value)
            }
            placeholder="Enter category name"
            style={{
              ...styles.formInput,
              display: "block",
              marginBottom: "16px",
            }}
          />

          <button
            type="button"
            onClick={handleCreateCategory}
            disabled={creating || !newCategoryName.trim()}
            style={{
              ...styles.createButton,
              opacity:
                creating || !newCategoryName.trim() ? 0.5 : 1,
              cursor:
                creating || !newCategoryName.trim()
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {creating ? "Saving..." : "Save Category"}
          </button>
          
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setNewCategoryName("");
              setCreateError(null);
            }}
            disabled={creating}
            style={{
              ...styles.cancelButton,
              marginLeft: "8px",
            }}
          >
            Cancel
          </button>

          {createError && (
            <p style={{ color: "red" }}>{createError}</p>
          )}
        </div>
      )}

      {loading && <p>Loading categories...</p>}

      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && categories.length === 0 && (
        <p>No categories found.</p>
      )}

      {!loading &&
        !error &&
        categories.map((category) => {
          const expanded = expandedIds.includes(category.id);

          return (
            <div
              key={category.id}
              style={styles.categoryCard}
            >
              <button
                type="button"
                onClick={() => toggleCategory(category.id)}
                aria-expanded={expanded}
                style={styles.categoryName}
              >
                {expanded ? "▼" : "▶"} {category.name}
              </button>

              <span
                style={{
                  ...styles.count,
                  marginLeft: "16px",
                }}
              >
                {category.subCategories.length} subcategories
              </span>

              <button
                type="button"
                onClick={() => {
                  setEditingCategoryId(category.id);
                  setEditingCategoryName(category.name);
                  setUpdateError(null);

                  // Close any open subcategory editor.
                  setEditingSubCategoryId(null);
                  setEditingSubCategoryName("");
                  setEditingSubCategoryParentId(null);
                  setSubCategoryUpdateError(null);

                  // Close any open deletion confirmations.
                  setCategoryPendingDelete(null);
                  setDeleteError(null);
                  setSubCategoryPendingDelete(null);
                  setSubCategoryDeleteError(null);
                }}
                style={{
                  ...styles.editButton,
                  marginLeft: "12px",
                }}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategoryPendingDelete(category);
                  setDeleteError(null);

                  // Close the Create Category form.
                  setShowCreateForm(false);
                  setNewCategoryName("");
                  setCreateError(null);

                  // Close any open category editor.
                  setEditingCategoryId(null);
                  setEditingCategoryName("");
                  setUpdateError(null);

                  // Close any open subcategory editor.
                  setEditingSubCategoryId(null);
                  setEditingSubCategoryName("");
                  setEditingSubCategoryParentId(null);
                  setSubCategoryUpdateError(null);

                  // Close any open Add Subcategory form.
                  setCreatingSubCategoryFor(null);
                  setNewSubCategoryName("");
                  setSubCategoryCreateError(null);

                  // Close any previous subcategory deletion confirmation.
                  setSubCategoryPendingDelete(null);
                  setSubCategoryDeleteError(null);
                }}
                style={{
                  ...styles.deleteButton,
                  marginLeft: "8px",
                }}
              >
                Delete
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreatingSubCategoryFor(
                    creatingSubCategoryFor === category.id
                      ? null
                      : category.id
                  );
                  setNewSubCategoryName("");
                  setSubCategoryCreateError(null);

                  // Close any open category editor.
                  setEditingCategoryId(null);
                  setEditingCategoryName("");
                  setUpdateError(null);

                  // Close any open subcategory editor.
                  setEditingSubCategoryId(null);
                  setEditingSubCategoryName("");
                  setEditingSubCategoryParentId(null);
                  setSubCategoryUpdateError(null);

                  // Close any open deletion confirmations.
                  setCategoryPendingDelete(null);
                  setDeleteError(null);
                  setSubCategoryPendingDelete(null);
                  setSubCategoryDeleteError(null);
                }}
                style={{
                  ...styles.editButton,
                  marginLeft: "8px",
                }}
              >
                {creatingSubCategoryFor === category.id
                  ? "Cancel"
                  : "+ Add Subcategory"}
              </button>

              {creatingSubCategoryFor === category.id && (
                <div
                  style={{
                    ...styles.formCard,
                    marginTop: "16px",
                  }}
                >
                  <h3>Add Subcategory to {category.name}</h3>

                  <label
                    htmlFor={`subcategory-name-${category.id}`}
                    style={styles.formLabel}
                  >
                    Subcategory Name
                  </label>

                  <input
                    id={`subcategory-name-${category.id}`}
                    type="text"
                    value={newSubCategoryName}
                    onChange={(event) =>
                      setNewSubCategoryName(event.target.value)
                    }
                    placeholder="Enter subcategory name"
                    style={{
                        ...styles.formInput,
                        display: "block",
                        marginBottom: "16px",
                      }}
                  />

                  <button
                    type="button"
                    onClick={handleCreateSubCategory}
                    disabled={
                      creatingSubCategory ||
                      !newSubCategoryName.trim()
                    }
                    style={{
                      ...styles.createButton,
                      opacity:
                        creatingSubCategory || !newSubCategoryName.trim()
                          ? 0.5
                          : 1,
                      cursor:
                        creatingSubCategory || !newSubCategoryName.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {creatingSubCategory
                      ? "Saving..."
                      : "Save Subcategory"}
                  </button>

                  {subCategoryCreateError && (
                    <p style={{ color: "red" }}>
                      {subCategoryCreateError}
                    </p>
                  )}
                </div>
              )}

              {editingCategoryId === category.id && (
                <div
                  style={{
                    ...styles.formCard,
                    marginTop: "16px",
                  }}
                >
                  <input
                    type="text"
                    value={editingCategoryName}
                    onChange={(event) =>
                      setEditingCategoryName(event.target.value)
                    }
                    aria-label="Edit category name"
                    style={{
                      ...styles.formInput,
                      display: "block",
                      marginBottom: "16px",
                    }}
                  />

                  <button
                    type="button"
                    onClick={handleUpdateCategory}
                    disabled={updating || !editingCategoryName.trim()}
                    style={{
                      ...styles.createButton,
                      opacity: updating || !editingCategoryName.trim() ? 0.5 : 1,
                      cursor:
                        updating || !editingCategoryName.trim()
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {updating ? "Saving..." : "Save"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingCategoryId(null);
                      setEditingCategoryName("");
                      setUpdateError(null);
                    }}
                    disabled={updating}
                    style={{
                      ...styles.cancelButton,
                      marginLeft: "8px",
                    }}
                  >
                    Cancel
                  </button>

                  {updateError && (
                    <p style={{ color: "red" }}>{updateError}</p>
                  )}
                </div>
              )}

              {expanded && (
                <ul style={styles.subCategoryList}>
                  {category.subCategories.map((subcategory) => (
                    <li key={subcategory.id} style={styles.subCategoryRow}>
                      <span style={styles.subCategoryName}>
                        {subcategory.name}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingSubCategoryId(subcategory.id);
                          setEditingSubCategoryName(subcategory.name);
                          setEditingSubCategoryParentId(category.id);
                          setSubCategoryUpdateError(null);

                          // Close any open category editor.
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                          setUpdateError(null);

                          // Close any open deletion confirmations.
                          setSubCategoryPendingDelete(null);
                          setSubCategoryDeleteError(null);
                          setCategoryPendingDelete(null);
                          setDeleteError(null);
                        }}
                        style={{
                          ...styles.editButton,
                          marginLeft: "12px",
                        }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSubCategoryPendingDelete({
                            id: subcategory.id,
                            name: subcategory.name,
                          });
                          setSubCategoryDeleteError(null);

                          // Close the Create Category form.
                          setShowCreateForm(false);
                          setNewCategoryName("");
                          setCreateError(null);

                          // Close any open category editor.
                          setEditingCategoryId(null);
                          setEditingCategoryName("");
                          setUpdateError(null);

                          // Close any open subcategory editor.
                          setEditingSubCategoryId(null);
                          setEditingSubCategoryName("");
                          setEditingSubCategoryParentId(null);
                          setSubCategoryUpdateError(null);

                          // Close any open Add Subcategory form.
                          setCreatingSubCategoryFor(null);
                          setNewSubCategoryName("");
                          setSubCategoryCreateError(null);

                          // Close any previous category deletion confirmation.
                          setCategoryPendingDelete(null);
                          setDeleteError(null);
                        }}
                        style={{
                          ...styles.deleteButton,
                          marginLeft: "8px",
                        }}
                      >
                        Delete
                      </button>

                      {subCategoryPendingDelete?.id === subcategory.id && (
                        <div
                          style={{
                            ...styles.formCard,
                            border: "1px solid #FCA5A5",
                            marginTop: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <p>
                            Are you sure you want to delete{" "}
                            <strong>{subCategoryPendingDelete.name}</strong>?
                          </p>

                          <p>
                            This action cannot be undone. Subcategories
                            associated with modules cannot be deleted.
                          </p>

                          <button
                            type="button"
                            onClick={handleDeleteSubCategory}
                            disabled={deletingSubCategory}
                            style={{
                              ...styles.deleteButton,
                              backgroundColor: "#B91C1C",
                              color: "#FFFFFF",
                            }}
                          >
                            {deletingSubCategory
                              ? "Deleting..."
                              : "Confirm Delete"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSubCategoryPendingDelete(null);
                              setSubCategoryDeleteError(null);
                            }}
                            disabled={deletingSubCategory}
                            style={{
                              ...styles.cancelButton,
                              marginLeft: "8px",
                            }}
                          >
                            Cancel
                          </button>

                          {subCategoryDeleteError && (
                            <p style={{ color: "red" }}>
                              {subCategoryDeleteError}
                            </p>
                          )}
                        </div>
                      )}

                      {editingSubCategoryId === subcategory.id && (
                        <div
                          style={{
                            ...styles.formCard,
                            marginTop: "12px",
                            marginBottom: "12px",
                          }}
                        >
                          <label
                            htmlFor={`edit-subcategory-${subcategory.id}`}
                            style={styles.formLabel}
                          >
                            Subcategory Name
                          </label>

                          <input
                            id={`edit-subcategory-${subcategory.id}`}
                            type="text"
                            value={editingSubCategoryName}
                            onChange={(event) =>
                              setEditingSubCategoryName(event.target.value)
                            }
                            style={{
                              ...styles.formInput,
                              display: "block",
                              marginBottom: "16px",
                            }}
                          />

                          <label
                            htmlFor={`subcategory-parent-${subcategory.id}`}
                            style={styles.formLabel}
                          >
                            Parent Category
                          </label>

                          <select
                            id={`subcategory-parent-${subcategory.id}`}
                            value={editingSubCategoryParentId ?? ""}
                            onChange={(event) =>
                              setEditingSubCategoryParentId(
                                Number(event.target.value)
                              )
                            }
                            style={{
                              ...styles.formInput,
                              display: "block",
                              marginBottom: "16px",
                            }}
                          >
                            {categories.map((parent) => (
                              <option key={parent.id} value={parent.id}>
                                {parent.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={handleUpdateSubCategory}
                            disabled={
                              updatingSubCategory ||
                              !editingSubCategoryName.trim() ||
                              editingSubCategoryParentId === null
                            }
                            style={{
                              ...styles.createButton,
                              opacity:
                                updatingSubCategory ||
                                !editingSubCategoryName.trim() ||
                                editingSubCategoryParentId === null
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            {updatingSubCategory ? "Saving..." : "Save"}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingSubCategoryId(null);
                              setEditingSubCategoryName("");
                              setEditingSubCategoryParentId(null);
                              setSubCategoryUpdateError(null);
                            }}
                            disabled={updatingSubCategory}
                            style={{
                              ...styles.cancelButton,
                              marginLeft: "8px",
                            }}
                          >
                            Cancel
                          </button>

                          {subCategoryUpdateError && (
                            <p style={{ color: "red" }}>
                              {subCategoryUpdateError}
                            </p>
                          )}
                        </div>
                      )}
                    </li>
                  ))}

                  {category.subCategories.length === 0 && (
                    <li>No subcategories.</li>
                  )}
                </ul>
              )}
            </div>
          );
        })}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    padding: "15px 20px 20px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "14px",
    color: "#334155",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  heading: {
    margin: 0,
    fontSize: "28px",
    fontWeight: 700,
  },

  subheading: {
    marginTop: "6px",
    marginBottom: 0,
    color: "#666",
    fontSize: "14px",
  },

  createButton: {
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#2B78F6",
    color: "#FFFFFF",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  categoryCard: {
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    padding: "16px",
  },

  categoryName: {
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: 700,
    color: "#0F172A",
    padding: 0,
  },

  count: {
    fontSize: "13px",
    color: "#64748B",
  },

  editButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  deleteButton: {
    padding: "6px 12px",
    borderRadius: "6px",
    border: "1px solid #FCA5A5",
    backgroundColor: "#FFFFFF",
    color: "#B91C1C",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  formCard: {
    padding: "20px",
    border: "1px solid #E2E8F0",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
  },

  formInput: {
    width: "100%",
    maxWidth: "400px",
    height: "38px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    fontSize: "14px",
    color: "#334155",
    boxSizing: "border-box",
  },

  formLabel: {
    display: "block",
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: 600,
    color: "#475569",
  },

  cancelButton: {
    padding: "7px 12px",
    borderRadius: "6px",
    border: "1px solid #CBD5E1",
    backgroundColor: "#FFFFFF",
    color: "#334155",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 600,
  },

  error: {
    padding: "10px 12px",
    borderRadius: "6px",
    backgroundColor: "#FEE2E2",
    color: "#B91C1C",
    fontSize: "14px",
  },

  subCategoryList: {
    listStyle: "none",
    margin: "16px 0 0",
    padding: 0,
    borderTop: "1px solid #E2E8F0",
  },

  subCategoryRow: {
    padding: "10px 12px",
    borderBottom: "1px solid #E2E8F0",
    fontSize: "14px",
    color: "#334155",
  },

  subCategoryName: {
    fontSize: "14px",
    color: "#334155",
    fontWeight: 500,
  },
};