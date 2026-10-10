import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createModuleUploadUrl,
  uploadModuleZipToS3,
  fetchLetters,
  fetchCategories,
  fetchKeywords,
  fetchPrograms,
  fetchSpecializations,
  ModuleProgram,
  ModuleSpecialization,
  createKeyword,
  LetterOption,
  CategoryOption,
  KeywordOption,
  createModule,
} from "../api/moduleApi";

export default function AddModulePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const [moduleId, setModuleId] = useState("");
  const [name, setName] = useState("");
  const [version, setVersion] = useState("");
  const [contentUpdatedAt, setContentUpdatedAt] = useState("");
  const [description, setDescription] = useState("");
  const [moduleType, setModuleType] = useState<"module" | "animation">(
    "module"
  );
  const [letters, setLetters] = useState<LetterOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [keywords, setKeywords] = useState<KeywordOption[]>([]);

  const [hasQuiz, setHasQuiz] = useState(true);
  const [creditType, setCreditType] = useState<"none" | "cme">("cme");
  const [cmeCredits, setCmeCredits] = useState<number | null>(5);

  const [selectedLetterIds, setSelectedLetterIds] = useState<number[]>([]);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<number[]>([]);
  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>([]);

  const [keywordInput, setKeywordInput] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [programs, setPrograms] = useState<ModuleProgram[]>([]);
  const [specializations, setSpecializations] = useState<
    ModuleSpecialization[]
  >([]);

  const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
  const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<
    number[]
  >([]);

  const specializationProgram = programs.find(
    (program) => program.training_type === "specialization"
  );

  const specializationProgramSelected =
    specializationProgram
      ? selectedProgramIds.includes(specializationProgram.id)
      : false;

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setLoadingOptions(true);
        setOptionsError(null);

        const [
          lettersData,
          categoriesData,
          keywordsData,
          programsData,
          specializationsData,
        ] = await Promise.all([
          fetchLetters(),
          fetchCategories(),
          fetchKeywords(),
          fetchPrograms(),
          fetchSpecializations(),
        ]);

        setLetters(lettersData);
        setCategories(categoriesData);
        setKeywords(keywordsData);
        setPrograms(programsData);
        setSpecializations(specializationsData);
      } catch (err) {
        setOptionsError(
          err instanceof Error
            ? err.message
            : "Failed to load module options."
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} bytes`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const selectFile = (file: File | null) => {
    setUploadError(null);
    setDownloadLink(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".zip")) {
      setSelectedFile(null);
      setUploadError("Please select a ZIP module package.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    selectFile(event.target.files?.[0] ?? null);
  };

  const handleChooseDifferentFile = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    setSelectedFile(null);
    setDownloadLink(null);
    setUploadError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    fileInputRef.current?.click();
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0] ?? null;

    selectFile(file);
  };

  const handleLetterToggle = (letterId: number) => {
    setSelectedLetterIds((current) =>
      current.includes(letterId)
        ? current.filter((id) => id !== letterId)
        : [...current, letterId]
    );
  };

  const handleSubcategoryToggle = (subcategoryId: number) => {
    setSelectedSubcategoryIds((current) =>
      current.includes(subcategoryId)
        ? current.filter((id) => id !== subcategoryId)
        : [...current, subcategoryId]
    );
  };

  const handleKeywordToggle = (keywordId: number) => {
    setSelectedKeywordIds((current) =>
      current.includes(keywordId)
        ? current.filter((id) => id !== keywordId)
        : [...current, keywordId]
    );
  };

  const handleAddKeyword = async () => {
    const keywordName = keywordInput.trim();

    if (!keywordName) return;

    const existingKeyword = keywords.find(
      (keyword) =>
        keyword.name.toLowerCase() ===
        keywordName.toLowerCase()
    );

    if (existingKeyword) {
      setSelectedKeywordIds((current) =>
        current.includes(existingKeyword.id)
          ? current
          : [...current, existingKeyword.id]
      );

      setKeywordInput("");
      return;
    }

    try {
      setAddingKeyword(true);
      setOptionsError(null);

      const newKeyword = await createKeyword(keywordName);

      setKeywords((current) => {
        const alreadyExists = current.some(
          (keyword) => keyword.id === newKeyword.id
        );

        if (alreadyExists) {
          return current;
        }

        return [...current, newKeyword].sort(
          (a, b) => a.name.localeCompare(b.name)
        );
      });

      setSelectedKeywordIds((current) =>
        current.includes(newKeyword.id)
          ? current
          : [...current, newKeyword.id]
      );

      setKeywordInput("");
    } catch (err) {
      setOptionsError(
        err instanceof Error
          ? err.message
          : "Failed to add keyword."
      );
    } finally {
      setAddingKeyword(false);
    }
  };

  const handleCreditTypeChange = (
    value: "none" | "cme"
  ) => {
    setCreditType(value);

    setCmeCredits((current) =>
      value === "none"
        ? null
        : current ?? 5
    );
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadError(null);
      setDownloadLink(null);

      const upload = await createModuleUploadUrl(selectedFile);

      await uploadModuleZipToS3(
        selectedFile,
        upload.uploadUrl
      );

      setDownloadLink(upload.downloadLink);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Failed to upload module package."
      );
    } finally {
      setUploading(false);
    }
  };

  const handleCreateModule = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setCreateError("Module name is required.");
      return;
    }

    if (!downloadLink) {
      setCreateError(
        "Upload the module ZIP before creating the module."
      );
      return;
    }

    if (
      creditType === "cme" &&
      (
        cmeCredits === null ||
        !Number.isInteger(cmeCredits) ||
        cmeCredits < 1
      )
    ) {
      setCreateError(
        "CME credits must be a positive whole number."
      );
      return;
    }

    try {
      setCreating(true);
      setCreateError(null);

      const newModule = await createModule({
        name: trimmedName,
        module_id: moduleId.trim(),
        version: version.trim() || null,
        content_updated_at: contentUpdatedAt || null,
        description: description.trim() || null,
        downloadLink,
        packageSize: selectedFile
          ? String(selectedFile.size)
          : null,
        type: moduleType,
        has_quiz: hasQuiz,
        credit_type: creditType,
        cme_credits:
          creditType === "cme"
            ? cmeCredits
            : null,
        letter_ids: selectedLetterIds,
        subcategory_ids: selectedSubcategoryIds,
        keyword_ids: selectedKeywordIds,
        program_ids: selectedProgramIds,
        specialization_ids: selectedSpecializationIds,
      });

      navigate(`/admin/modules/${newModule.id}/edit`);
    } catch (err) {
      setCreateError(
        err instanceof Error
          ? err.message
          : "Failed to create module."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleProgramToggle = (programId: number) => {
    const program = programs.find(
      (item) => item.id === programId
    );

    const isSpecialization =
      program?.training_type === "specialization";

    setSelectedProgramIds((current) => {
      const selected = current.includes(programId);

      if (selected && isSpecialization) {
        setSelectedSpecializationIds([]);
      }

      return selected
        ? current.filter((id) => id !== programId)
        : [...current, programId];
    });
  };

  const handleSpecializationToggle = (
    specializationId: number
  ) => {
    setSelectedSpecializationIds((current) =>
      current.includes(specializationId)
        ? current.filter((id) => id !== specializationId)
        : [...current, specializationId]
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>Add Module</h1>

          <p style={styles.subheading}>
            Upload a module package and configure its HealthMAP settings.
          </p>
        </div>

        <button
          type="button"
          style={styles.backButton}
          onClick={() => navigate("/admin/modules")}
        >
          ← Back to Modules
        </button>
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Module Package
        </h2>

        <p style={styles.sectionDescription}>
          Select the ZIP package that will be distributed through HealthMAP.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />

        <div
          style={styles.dropZone}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div style={styles.dropZoneTitle}>
            {selectedFile
              ? selectedFile.name
              : "Drop module ZIP here"}
          </div>

          <div style={styles.dropZoneHelp}>
            {selectedFile
              ? formatFileSize(selectedFile.size)
              : "or click to browse"}
          </div>
        </div>

        <div style={styles.uploadActions}>
          {selectedFile && (
            <button
              type="button"
              style={styles.changeFileButton}
              onClick={handleChooseDifferentFile}
              disabled={uploading}
            >
              Choose Different ZIP
            </button>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            style={{
              ...styles.uploadButton,
              ...(!selectedFile || uploading
                ? styles.disabledButton
                : {}),
            }}
          >
            {uploading ? "Uploading..." : "Upload ZIP"}
          </button>
        </div>

        {uploadError && (
          <div style={styles.errorBox}>
            {uploadError}
          </div>
        )}

        {downloadLink && (
          <div style={styles.successBox}>
            Module package uploaded successfully.
          </div>
        )}
      </div>
      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Module Information
        </h2>

        <p style={styles.sectionDescription}>
          Enter the identifying information for this module.
        </p>

        <div style={styles.detailsGrid}>
          <label style={styles.field}>
            <span style={styles.label}>
              Module ID
            </span>

            <input
              type="text"
              value={moduleId}
              onChange={(event) =>
                setModuleId(event.target.value)
              }
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Name
            </span>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Version
            </span>

            <input
              type="text"
              value={version}
              onChange={(event) =>
                setVersion(event.target.value)
              }
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Content Updated
            </span>

            <input
              type="date"
              value={contentUpdatedAt}
              onChange={(event) =>
                setContentUpdatedAt(event.target.value)
              }
              style={styles.input}
            />
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              Type
            </span>

            <select
              value={moduleType}
              onChange={(event) =>
                setModuleType(
                  event.target.value as "module" | "animation"
                )
              }
              style={styles.input}
            >
              <option value="module">
                Module
              </option>

              <option value="animation">
                Animation
              </option>
            </select>
          </label>

          <label
            style={{
              ...styles.field,
              ...styles.fullWidth,
            }}
          >
            <span style={styles.label}>
              Description
            </span>

            <textarea
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              style={styles.textarea}
              rows={5}
            />
          </label>

          <div
            style={{
              ...styles.field,
              ...styles.fullWidth,
            }}
          >
            <span style={styles.label}>
              Package URL
            </span>

            <div style={styles.readOnlyValue}>
              {downloadLink ||
                "Upload the module ZIP above to generate the package URL."}
            </div>
          </div>
        </div>
      </div>
      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Library Organization
        </h2>

        <p style={styles.sectionDescription}>
          Choose where this module appears in the HealthMAP library.
        </p>

        {loadingOptions ? (
          <p style={styles.placeholder}>
            Loading library options...
          </p>
        ) : optionsError ? (
          <div style={styles.errorBox}>
            {optionsError}
          </div>
        ) : (
          <>
            <div style={styles.librarySection}>
              <div style={styles.libraryLabel}>
                Letters
              </div>

              <div style={styles.letterGrid}>
                {letters.map((letter) => {
                  const selected =
                    selectedLetterIds.includes(letter.id);

                  return (
                    <button
                      key={letter.id}
                      type="button"
                      onClick={() =>
                        handleLetterToggle(letter.id)
                      }
                      style={{
                        ...styles.letterButton,
                        ...(selected
                          ? styles.letterButtonSelected
                          : {}),
                      }}
                    >
                      {letter.letters}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={styles.librarySection}>
              <div style={styles.libraryLabel}>
                Categories & Subcategories
              </div>

              <p style={styles.libraryHelpText}>
                Select the subcategories where this module should appear.
                Categories organize the available subcategories and do not
                require a separate assignment.
              </p>

              <div style={styles.categoryList}>
                {categories.map((category) => {
                  const selectedCount =
                    category.subCategories.filter(
                      (subcategory) =>
                        selectedSubcategoryIds.includes(
                          subcategory.id
                        )
                    ).length;

                  return (
                    <details
                      key={category.id}
                      style={styles.categoryCard}
                      open={selectedCount > 0}
                    >
                      <summary style={styles.categorySummary}>
                        <span>{category.name}</span>

                        {selectedCount > 0 && (
                          <span style={styles.selectionCount}>
                            {selectedCount} selected
                          </span>
                        )}
                      </summary>

                      <div style={styles.subcategoryGrid}>
                        {category.subCategories.map(
                          (subcategory) => {
                            const selected =
                              selectedSubcategoryIds.includes(
                                subcategory.id
                              );

                            return (
                              <label
                                key={subcategory.id}
                                style={{
                                  ...styles.subcategoryOption,
                                  ...(selected
                                    ? styles.subcategoryOptionSelected
                                    : {}),
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selected}
                                  onChange={() =>
                                    handleSubcategoryToggle(
                                      subcategory.id
                                    )
                                  }
                                />

                                <span>
                                  {subcategory.name}
                                </span>
                              </label>
                            );
                          }
                        )}
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
            <div style={styles.librarySection}>
              <div style={styles.libraryLabel}>
                Keywords
              </div>

              <p style={styles.libraryHelpText}>
                Add search terms that can help users find this module.
              </p>

              {selectedKeywordIds.length > 0 && (
                <div style={styles.keywordTags}>
                  {keywords
                    .filter((keyword) =>
                      selectedKeywordIds.includes(keyword.id)
                    )
                    .map((keyword) => (
                      <button
                        key={keyword.id}
                        type="button"
                        style={styles.keywordTag}
                        onClick={() =>
                          handleKeywordToggle(keyword.id)
                        }
                        title={`Remove ${keyword.name}`}
                      >
                        {keyword.name}

                        <span style={styles.keywordRemove}>
                          ×
                        </span>
                      </button>
                    ))}
                </div>
              )}

              <div style={styles.keywordInputRow}>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(event) =>
                    setKeywordInput(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                  placeholder="Search or enter keyword"
                  style={styles.keywordInput}
                  list="new-module-keywords"
                />

                <datalist id="new-module-keywords">
                  {keywords
                    .filter(
                      (keyword) =>
                        !selectedKeywordIds.includes(keyword.id)
                    )
                    .map((keyword) => (
                      <option
                        key={keyword.id}
                        value={keyword.name}
                      />
                    ))}
                </datalist>

                <button
                  type="button"
                  onClick={handleAddKeyword}
                  disabled={
                    addingKeyword ||
                    !keywordInput.trim()
                  }
                  style={{
                    ...styles.addKeywordButton,
                    ...(addingKeyword ||
                    !keywordInput.trim()
                      ? styles.disabledButton
                      : {}),
                  }}
                >
                  {addingKeyword ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Training Assignments
        </h2>

        <p style={styles.sectionDescription}>
          Assign this module to training programs and, when applicable,
          specialization tracks.
        </p>

        <div style={styles.assignmentSection}>
          <div style={styles.libraryLabel}>
            Programs
          </div>

          <p style={styles.libraryHelpText}>
            Select each training program that includes this module.
          </p>

          <div style={styles.assignmentGrid}>
            {programs
              .filter((program) => program.active !== false)
              .map((program) => {
                const selected =
                  selectedProgramIds.includes(program.id);

                return (
                  <label
                    key={program.id}
                    style={{
                      ...styles.assignmentOption,
                      ...(selected
                        ? styles.assignmentOptionSelected
                        : {}),
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() =>
                        handleProgramToggle(program.id)
                      }
                    />

                    <div>
                      <div style={styles.assignmentName}>
                        {program.name}
                      </div>

                      {program.description && (
                        <div style={styles.assignmentDescription}>
                          {program.description}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
          </div>
        </div>

        <div style={styles.assignmentSection}>
          <div style={styles.libraryLabel}>
            Specialization Tracks
          </div>

          <p style={styles.libraryHelpText}>
            Select the Specialization program above to assign this module to specialization tracks.
          </p>

          <div style={styles.assignmentGrid}>
            {specializations.map((specialization) => {
              const selected =
                selectedSpecializationIds.includes(
                  specialization.id
                );

              return (
                <label
                  key={specialization.id}
                  style={{
                    ...styles.assignmentOption,
                    ...(selected
                      ? styles.assignmentOptionSelected
                      : {}),
                    ...(!specializationProgramSelected
                      ? styles.assignmentOptionDisabled
                      : {}),
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!specializationProgramSelected}
                    onChange={() =>
                      handleSpecializationToggle(
                        specialization.id
                      )
                    }
                  />

                  <div style={styles.assignmentName}>
                    {specialization.name}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      </div>
      <div style={styles.card}>
        <h2 style={styles.sectionHeading}>
          Assessment & CME Settings
        </h2>

        <p style={styles.sectionDescription}>
          Configure whether this module includes a quiz and whether it
          awards CME credits.
        </p>

        <div style={styles.detailsGrid}>
          <label style={styles.field}>
            <span style={styles.label}>
              Final Quiz
            </span>

            <select
              value={hasQuiz ? "yes" : "no"}
              onChange={(event) =>
                setHasQuiz(event.target.value === "yes")
              }
              style={styles.input}
            >
              <option value="yes">
                Has Quiz
              </option>

              <option value="no">
                No Quiz
              </option>
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              CME Status
            </span>

            <select
              value={creditType}
              onChange={(event) =>
                handleCreditTypeChange(
                  event.target.value as "none" | "cme"
                )
              }
              style={styles.input}
            >
              <option value="cme">
                CME
              </option>

              <option value="none">
                Not CME
              </option>
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>
              CME Credits
            </span>

            <input
              type="number"
              min="1"
              step="1"
              disabled={creditType !== "cme"}
              value={
                creditType === "cme"
                  ? cmeCredits ?? ""
                  : ""
              }
              onChange={(event) => {
                const value = event.target.value;
                const parsedValue = Number(value);

                setCmeCredits(
                  value === "" || Number.isNaN(parsedValue)
                    ? null
                    : parsedValue
                );
              }}
              style={{
                ...styles.input,
                ...(creditType !== "cme"
                  ? styles.inputDisabled
                  : {}),
              }}
            />
          </label>
        </div>
      </div>
      {createError && (
        <div style={styles.errorBox}>
          {createError}
        </div>
      )}

      <div style={styles.pageActions}>
        <button
          type="button"
          onClick={handleCreateModule}
          disabled={creating || uploading}
          style={{
            ...styles.createButton,
            ...(creating || uploading
              ? styles.disabledButton
              : {}),
          }}
        >
          {creating ? "Creating..." : "Create Module"}
        </button>
      </div>
    </div>
  );
}

const styles: {
  [key: string]: React.CSSProperties;
} = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "25px",
    paddingLeft: "20px",
    paddingRight: "20px",
    paddingTop: "15px",
    paddingBottom: "20px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  backButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    padding: "9px 14px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    whiteSpace: "nowrap",
  },

  card: {
    border: "1px solid #E5E7EB",
    borderRadius: "10px",
    backgroundColor: "#FFFFFF",
    padding: "20px",
  },

  sectionHeading: {
    marginTop: 0,
    marginBottom: "12px",
    fontSize: "18px",
    fontWeight: 600,
  },

  sectionDescription: {
    marginTop: "-4px",
    marginBottom: "20px",
    color: "#6B7280",
    fontSize: "14px",
  },

  uploadButton: {
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "9px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },

  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  errorBox: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "8px",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    fontSize: "14px",
  },

  successBox: {
    marginTop: "16px",
    padding: "12px 14px",
    borderRadius: "8px",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    fontSize: "14px",
  },

  dropZone: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "150px",
    padding: "20px",
    border: "2px dashed #CBD5E1",
    borderRadius: "10px",
    backgroundColor: "#F8FAFC",
    cursor: "pointer",
    textAlign: "center",
  },

  dropZoneTitle: {
    fontSize: "15px",
    fontWeight: 600,
    color: "#374151",
  },

  dropZoneHelp: {
    marginTop: "6px",
    fontSize: "13px",
    color: "#6B7280",
  },

  uploadActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "14px",
  },

  changeFileButton: {
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    padding: "9px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px 30px",
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  field: {
    display: "flex",
    flexDirection: "column",
  },

  label: {
    marginBottom: "5px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#6B7280",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    padding: "9px 10px",
    fontSize: "14px",
    backgroundColor: "#FFFFFF",
  },

  textarea: {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    padding: "9px 10px",
    fontSize: "14px",
    fontFamily: "inherit",
    resize: "vertical",
  },

  readOnlyValue: {
    minHeight: "38px",
    boxSizing: "border-box",
    padding: "9px 10px",
    border: "1px solid #E5E7EB",
    borderRadius: "6px",
    backgroundColor: "#F8FAFC",
    color: "#6B7280",
    fontSize: "13px",
    overflowWrap: "anywhere",
  },

  placeholder: {
    margin: 0,
    color: "#6B7280",
    fontSize: "14px",
  },

  librarySection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
  },

  libraryLabel: {
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
  },

  letterGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  letterButton: {
    width: "38px",
    height: "38px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    color: "#374151",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  letterButtonSelected: {
    border: "1px solid #2563EB",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
  },

  libraryHelpText: {
    margin: 0,
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  categoryList: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },

  categoryCard: {
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  categorySummary: {
    padding: "12px 14px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },

  selectionCount: {
    marginLeft: "10px",
    padding: "2px 7px",
    borderRadius: "999px",
    backgroundColor: "#DBEAFE",
    color: "#1D4ED8",
    fontSize: "11px",
    fontWeight: 600,
  },

  subcategoryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",
    gap: "8px",
    padding: "4px 14px 14px",
  },

  subcategoryOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    padding: "9px 10px",
    border: "1px solid #E5E7EB",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#374151",
    backgroundColor: "#FFFFFF",
  },

  subcategoryOptionSelected: {
    border: "1px solid #2563EB",
    backgroundColor: "#EFF6FF",
  },

  keywordTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
  },

  keywordTag: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 10px",
    border: "1px solid #BFDBFE",
    borderRadius: "999px",
    backgroundColor: "#EFF6FF",
    color: "#1D4ED8",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 500,
  },

  keywordRemove: {
    fontSize: "16px",
    lineHeight: 1,
  },

  keywordInputRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    maxWidth: "600px",
  },

  keywordInput: {
    flex: 1,
    minWidth: 0,
    padding: "9px 10px",
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    fontSize: "14px",
    boxSizing: "border-box",
  },

  addKeywordButton: {
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "9px 16px",
    cursor: "pointer",
    fontWeight: 600,
  },

  assignmentSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
  },

  assignmentGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "10px",
  },

  assignmentOption: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
  },

  assignmentOptionSelected: {
    border: "1px solid #2563EB",
    backgroundColor: "#EFF6FF",
  },

  assignmentName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#374151",
  },

  assignmentDescription: {
    marginTop: "3px",
    fontSize: "12px",
    lineHeight: 1.4,
    color: "#6B7280",
  },

  assignmentOptionDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
    cursor: "not-allowed",
    opacity: 0.6,
  },

  inputDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
    cursor: "not-allowed",
  },

  pageActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: "10px",
  },

  createButton: {
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "10px 18px",
    cursor: "pointer",
    fontWeight: 600,
  },

  fieldHelpText: {
    fontSize: "12px",
    color: "#6B7280",
    lineHeight: 1.4,
  },
};