import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchModuleById,
  fetchLetters,
  fetchCategories,
  fetchKeywords,
  createKeyword,
  updateModule,
  deleteModule,
  createReplacementModuleUploadUrl,
  uploadModuleZipToS3,
  confirmModuleReplacement,
  ModuleRecord,
  LetterOption,
  CategoryOption,
  KeywordOption,
  fetchPrograms,
  fetchSpecializations,
  ModuleProgram,
  ModuleSpecialization,
} from "../api/moduleApi";

export default function EditModulePage() {
  const navigate = useNavigate();
  const { moduleId } = useParams();
  const [module, setModule] = useState<ModuleRecord | null>(null);
  const [savedModule, setSavedModule] = useState<ModuleRecord | null>(null);
  const [letters, setLetters] = useState<LetterOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [keywords, setKeywords] = useState<KeywordOption[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [addingKeyword, setAddingKeyword] = useState(false);
  const [programs, setPrograms] = useState<ModuleProgram[]>([]);
  const [specializations, setSpecializations] = useState<
    ModuleSpecialization[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [replacementZip, setReplacementZip] = useState<File | null>(null);
  const [replacingZip, setReplacingZip] = useState(false);
  const [replacementError, setReplacementError] = useState<string | null>(null);
  const [replacementSuccess, setReplacementSuccess] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const successBannerRef = useRef<HTMLDivElement | null>(null);

  const specializationProgram = programs.find(
    (program) => program.training_type === "specialization"
  );

  const specializationProgramSelected =
    module && specializationProgram
      ? module.programs.some(
          (program) => program.id === specializationProgram.id
        )
      : false;

  useEffect(() => {
    const loadModule = async () => {
      if (!moduleId) {
        setError("Module ID is missing.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [
          moduleData,
          lettersData,
          categoriesData,
          keywordsData,
          programsData,
          specializationsData,
        ] = await Promise.all([
          fetchModuleById(moduleId),
          fetchLetters(),
          fetchCategories(),
          fetchKeywords(),
          fetchPrograms(),
          fetchSpecializations(),
        ]);

        setModule(moduleData);
        setSavedModule(structuredClone(moduleData));
        setLetters(lettersData);
        setCategories(categoriesData);
        setKeywords(keywordsData);
        setPrograms(programsData);
        setSpecializations(specializationsData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load module."
        );
      } finally {
        setLoading(false);
      }
    };

    loadModule();
  }, [moduleId]);

  const handleFieldChange = (
    field: keyof ModuleRecord,
    value: string
  ) => {
    if (!module) return;

    setModule({
      ...module,
      [field]: value,
    });

    setSuccessMessage(null);
  };

  const handleQuizChange = (hasQuiz: boolean) => {
    if (!module) return;

    setModule({
      ...module,
      has_quiz: hasQuiz,
    });

    setSuccessMessage(null);
  };

  const handleCreditTypeChange = (
    creditType: "none" | "cme"
  ) => {
    if (!module) return;

    setModule({
      ...module,
      credit_type: creditType,
      cme_credits:
        creditType === "none"
          ? null
          : module.cme_credits ?? 5,
    });

    setSuccessMessage(null);
  };

  const handleCmeCreditsChange = (value: string) => {
    if (!module) return;

    const parsedValue = Number(value);

    setModule({
      ...module,
      cme_credits:
        value === "" || Number.isNaN(parsedValue)
          ? null
          : parsedValue,
    });

    setSuccessMessage(null);
  };

  const handleLetterToggle = (letterId: number) => {
    if (!module) return;

    const selected = module.letters.some(
      (letter) => letter.id === letterId
    );

    const selectedLetter = letters.find(
      (letter) => letter.id === letterId
    );

    if (!selectedLetter) return;

    setModule({
      ...module,
      letters: selected
        ? module.letters.filter(
            (letter) => letter.id !== letterId
          )
        : [
            ...module.letters,
            {
              id: selectedLetter.id,
              letters: selectedLetter.letters,
            },
          ],
    });

    setSuccessMessage(null);
  };

  const handleSubcategoryToggle = (
    subcategoryId: number,
    subcategoryName: string
  ) => {
    if (!module) return;

    const selected = module.subCategories.some(
      (subcategory) => subcategory.id === subcategoryId
    );

    setModule({
      ...module,
      subCategories: selected
        ? module.subCategories.filter(
            (subcategory) =>
              subcategory.id !== subcategoryId
          )
        : [
            ...module.subCategories,
            {
              id: subcategoryId,
              name: subcategoryName,
            },
          ],
    });

    setSuccessMessage(null);
  };

  const handleKeywordToggle = (keyword: KeywordOption) => {
    if (!module) return;

    const selected = module.keywords.some(
      (item) => item.id === keyword.id
    );

    setModule({
      ...module,
      keywords: selected
        ? module.keywords.filter(
            (item) => item.id !== keyword.id
          )
        : [
            ...module.keywords,
            {
              id: keyword.id,
              name: keyword.name,
            },
          ],
    });

    setSuccessMessage(null);
  };

  const handleProgramToggle = (program: ModuleProgram) => {
    if (!module) return;

    const selected = module.programs.some(
      (item) => item.id === program.id
    );

    const isSpecialization =
      program.training_type === "specialization";

    setModule({
      ...module,
      programs: selected
        ? module.programs.filter(
            (item) => item.id !== program.id
          )
        : [
            ...module.programs,
            {
              id: program.id,
              name: program.name,
              training_type: program.training_type,
            },
          ],
      specializations:
        selected && isSpecialization
          ? []
          : module.specializations,
    });

    setSuccessMessage(null);
  };

  const handleSpecializationToggle = (
    specialization: ModuleSpecialization
  ) => {
    if (!module) return;

    const selected = module.specializations.some(
      (item) => item.id === specialization.id
    );

    setModule({
      ...module,
      specializations: selected
        ? module.specializations.filter(
            (item) => item.id !== specialization.id
          )
        : [
            ...module.specializations,
            specialization,
          ],
    });

    setSuccessMessage(null);
  };

  const handleAddKeyword = async () => {
    if (!module) return;

    const name = keywordInput.trim();

    if (!name) return;

    const existingKeyword = keywords.find(
      (keyword) =>
        keyword.name.toLowerCase() ===
        name.toLowerCase()
    );

    if (existingKeyword) {
      const alreadySelected = module.keywords.some(
        (keyword) =>
          keyword.id === existingKeyword.id
      );

      if (!alreadySelected) {
        handleKeywordToggle(existingKeyword);
      }

      setKeywordInput("");
      return;
    }

    try {
      setAddingKeyword(true);
      setError(null);

      const newKeyword = await createKeyword(name);

      setKeywords((current) => {
        const alreadyExists = current.some(
          (keyword) => keyword.id === newKeyword.id
        );

        return alreadyExists
          ? current
          : [...current, newKeyword].sort(
              (a, b) =>
                a.name.localeCompare(b.name)
            );
      });

      const alreadySelected = module.keywords.some(
        (keyword) => keyword.id === newKeyword.id
      );

      if (!alreadySelected) {
        setModule((currentModule) => {
          if (!currentModule) {
            return currentModule;
          }

          return {
            ...currentModule,
            keywords: [
              ...currentModule.keywords,
              newKeyword,
            ],
          };
        });
      }

      setKeywordInput("");
      setSuccessMessage(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add keyword."
      );
    } finally {
      setAddingKeyword(false);
    }
  };

    const handleReplaceZip = async () => {
      if (!moduleId || !replacementZip || replacingZip) return;

      if (module && savedModule) {
        const fieldsToCompare = [
          "module_id",
          "name",
          "version",
          "content_updated_at",
          "description",
          "downloadLink",
          "type",
          "has_quiz",
          "credit_type",
          "cme_credits",
        ] as const;

        const fieldsChanged = fieldsToCompare.some(
          (field) => module[field] !== savedModule[field]
        );

        const relationshipsChanged = (
          ["letters", "subCategories", "keywords", "programs", "specializations"] as const
        ).some((field) => {
          const currentIds = module[field].map((item) => item.id).sort((a, b) => a - b);
          const savedIds = savedModule[field].map((item) => item.id).sort((a, b) => a - b);

          return JSON.stringify(currentIds) !== JSON.stringify(savedIds);
        });

        if (fieldsChanged || relationshipsChanged) {
          const proceed = window.confirm(
            "You have unsaved module information changes.\n\n" +
            "Replacing the ZIP will NOT save those changes, and the page will " +
            "reload the module information afterward.\n\n" +
            "Click Cancel to save your changes first, or OK to replace the ZIP " +
            "and discard your unsaved edits."
          );

          if (!proceed) return;
        }
      }

      try {
        setReplacingZip(true);
        setReplacementError(null);
        setReplacementSuccess(null);

        if (!replacementZip.name.toLowerCase().endsWith(".zip")) {
          throw new Error("Please select a ZIP file.");
        }

        const upload = await createReplacementModuleUploadUrl(
          moduleId,
          replacementZip
        );

        await uploadModuleZipToS3(
          replacementZip,
          upload.uploadUrl,
          upload.uploadId
        );

        await confirmModuleReplacement(
          moduleId,
          upload.uploadId,
          upload.key
        );

        const refreshedModule = await fetchModuleById(moduleId);
        setModule(refreshedModule);
        setSavedModule(structuredClone(refreshedModule));

        setReplacementZip(null);
        setReplacementSuccess("Module ZIP replaced successfully.");
      } catch (err) {
        setReplacementError(
          err instanceof Error
            ? err.message
            : "Failed to replace module ZIP."
        );
      } finally {
        setReplacingZip(false);
      }
    };

  const handleDelete = async () => {
    if (!moduleId || !module || deleting) return;

    const confirmed = window.confirm(
      `Permanently delete "${module.name}"?\n\n` +
      "This will remove the module, its database associations, " +
      "and its ZIP file from S3.\n\n" +
      "Modules with historical CME awards or student quiz scores " +
      "cannot be deleted.\n\n" +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      setError(null);

      const result = await deleteModule(moduleId);

      if (result.message.includes("ZIP cleanup failed")) {
        window.alert(result.message);
      } else {
        window.alert("Module deleted successfully.");
      }

      navigate("/admin/modules");
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : "Failed to delete module."
      );
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!moduleId || !module) return;

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      await updateModule(moduleId, {
        module_id: module.module_id,
        name: module.name,
        version: module.version ?? null,
        content_updated_at: module.content_updated_at || null,
        description: module.description ?? null,
        downloadLink: module.downloadLink ?? null,
        type: module.type,
        has_quiz: module.has_quiz,
        credit_type: module.credit_type,
        cme_credits: module.cme_credits,
        letter_ids: module.letters.map(
          (letter) => letter.id
        ),
        subcategory_ids: module.subCategories.map(
          (subcategory) => subcategory.id
        ),
        keyword_ids: module.keywords.map(
          (keyword) => keyword.id
        ),
        program_ids: module.programs.map(
          (program) => program.id
        ),

        specialization_ids: module.specializations.map(
          (specialization) => specialization.id
        ),
      });

      const refreshedModule =
        await fetchModuleById(moduleId);

      setModule(refreshedModule);
      setSavedModule(structuredClone(refreshedModule));
      setSuccessMessage("Module changes saved successfully.");

      setTimeout(() => {
        successBannerRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save module."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.heading}>
            Edit Module
          </h1>

          <p style={styles.subheading}>
            Manage module information, library organization,
            training assignments, keywords, and assessment settings.
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
          Module Information
        </h2>

        {loading ? (
          <p style={styles.placeholder}>
            Loading module...
          </p>
        ) : error ? (
          <div style={styles.errorBox}>
            {error}
          </div>
        ) : module ? (
          <div>
            {successMessage && (
              <div
                ref={successBannerRef}
                style={styles.successBox}
              >
                {successMessage}
              </div>
            )}
            <div style={styles.detailsGrid}>
              <label style={styles.field}>
                <span style={styles.label}>
                  Module ID
                </span>

                <input
                  type="text"
                  value={module.module_id ?? ""}
                  onChange={(event) =>
                    handleFieldChange(
                      "module_id",
                      event.target.value
                    )
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
                  value={module.name}
                  onChange={(event) =>
                    handleFieldChange(
                      "name",
                      event.target.value
                    )
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
                  value={module.version ?? ""}
                  onChange={(event) =>
                    handleFieldChange(
                      "version",
                      event.target.value
                    )
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
                  value={module.content_updated_at ?? ""}
                  onChange={(event) =>
                    handleFieldChange(
                      "content_updated_at",
                      event.target.value
                    )
                  }
                  style={styles.input}
                />

                <span style={styles.fieldHelpText}>
                  Date the educational content was last revised.
                </span>
              </label>

              <label style={styles.field}>
                <span style={styles.label}>
                  Type
                </span>

                <select
                  value={module.type}
                  onChange={(event) =>
                    setModule({
                      ...module,
                      type: event.target.value as
                        | "module"
                        | "animation",
                    })
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
                  value={module.description ?? ""}
                  onChange={(event) =>
                    handleFieldChange(
                      "description",
                      event.target.value
                    )
                  }
                  style={styles.textarea}
                  rows={5}
                />
              </label>

              <label
                style={{
                  ...styles.field,
                  ...styles.fullWidth,
                }}
              >
                <span style={styles.label}>
                  Download Link
                </span>

                <input
                  type="text"
                  value={module.downloadLink ?? ""}
                  readOnly
                  style={{
                    ...styles.input,
                    backgroundColor: "#F3F4F6",
                    color: "#6B7280",
                  }}
                />
              </label>
              <div style={styles.field}>
                <span style={styles.label}>Package Size</span>
                <span style={styles.value}>
                  {module.packageSize
                    ? `${(Number(module.packageSize) / 1024).toFixed(2)} KB`
                    : "Not available"}
                </span>
              </div>

              <div style={styles.field}>
                <span style={styles.label}>Package Uploaded At</span>
                <span style={styles.value}>
                  {module.package_uploaded_at
                    ? new Date(module.package_uploaded_at).toLocaleString()
                    : "Not available"}
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      {!loading && module && (
        <>
          <div style={styles.card}>
              <h2 style={styles.sectionHeading}>
                Replace Module ZIP
              </h2>

              <p style={styles.sectionHelpText}>
                Select a replacement ZIP file. The new ZIP will be uploaded
                separately. Once the replacement is confirmed, the module
                will use the new ZIP, and the previous file will be removed
                if no other modules reference it.
              </p>

              <div
                style={{
                  padding: "12px 14px",
                  marginBottom: "18px",
                  backgroundColor: "#EFF6FF",
                  border: "1px solid #BFDBFE",
                  borderRadius: "8px",
                  color: "#1E40AF",
                  fontSize: "13px",
                  lineHeight: 1.5,
                }}
              >
                <strong>Reminder:</strong> If you have edited module information,
                including the Content Updated date, click <strong>Save Changes</strong>{" "}
                before replacing the ZIP. Replacing the ZIP does not save those edits.
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();

                  if (replacingZip) return;

                  const file = event.dataTransfer.files[0];

                  if (!file) return;

                  if (!file.name.toLowerCase().endsWith(".zip")) {
                    setReplacementError("Please select a ZIP file.");
                    return;
                  }

                  setReplacementZip(file);
                  setReplacementError(null);
                  setReplacementSuccess(null);
                }}
                style={{
                  border: "2px dashed #9CA3AF",
                  borderRadius: "10px",
                  padding: "30px",
                  textAlign: "center",
                  backgroundColor: "#F9FAFB",
                }}
              >
                <div
                  style={{
                    fontSize: "32px",
                    marginBottom: "10px",
                  }}
                >
                  📦
                </div>

                <p style={{ margin: "0 0 12px", color: "#374151" }}>
                  Drag and drop a ZIP file here
                </p>

                <label
                  style={{
                    display: "inline-block",
                    padding: "9px 16px",
                    backgroundColor: "#2563EB",
                    color: "#FFFFFF",
                    borderRadius: "6px",
                    cursor: replacingZip ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  Browse Files

                  <input
                    type="file"
                    accept=".zip,application/zip"
                    disabled={replacingZip}
                    onChange={(event) => {
                      const file = event.target.files?.[0] ?? null;

                      setReplacementZip(file);
                      setReplacementError(null);
                      setReplacementSuccess(null);

                      event.target.value = "";
                    }}
                    style={{ display: "none" }}
                  />
                </label>
              </div>

              {replacementZip && (
                <p style={styles.libraryHelpText}>
                  Selected: {replacementZip.name}
                </p>
              )}

              {replacementError && (
                <div style={styles.errorBox}>
                  {replacementError}
                </div>
              )}

              {replacementSuccess && (
                <div style={styles.successBox}>
                  {replacementSuccess}
                </div>
              )}

              <button
                type="button"
                disabled={!replacementZip || replacingZip}
                onClick={handleReplaceZip}
                style={{
                  ...styles.saveButton,
                  marginTop: "15px",
                  ...(!replacementZip || replacingZip
                    ? styles.disabledButton
                    : {}),
                }}
              >
                {replacingZip ? "Preparing..." : "Replace ZIP"}
              </button>
            </div>
          <div style={styles.card}>
            <h2 style={styles.sectionHeading}>
              Library Organization
          </h2>

          <p style={styles.sectionDescription}>
            Choose where this module appears in the HealthMAP library.
          </p>

          <div style={styles.librarySection}>
            <div style={styles.libraryLabel}>
              Letters
            </div>

            <div style={styles.letterGrid}>
              {letters.map((letter) => {
                const selected =
                  module.letters.some(
                    (item) => item.id === letter.id
                  );

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
                      module.subCategories.some(
                        (selected) =>
                          selected.id === subcategory.id
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
                            module.subCategories.some(
                              (item) =>
                                item.id === subcategory.id
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
                                    subcategory.id,
                                    subcategory.name
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

            {module.keywords.length > 0 && (
              <div style={styles.keywordTags}>
                {module.keywords.map((keyword) => (
                  <button
                    key={keyword.id}
                    type="button"
                    style={styles.keywordTag}
                    onClick={() =>
                      handleKeywordToggle(keyword)
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
                list="module-keywords"
              />

              <datalist id="module-keywords">
                {keywords
                  .filter(
                    (keyword) =>
                      !module.keywords.some(
                        (selected) =>
                          selected.id === keyword.id
                      )
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
                {addingKeyword
                  ? "Adding..."
                  : "Add"}
              </button>
            </div>
          </div>
        </div>
        <div style={styles.card}>
            <h2 style={styles.sectionHeading}>
              Training Assignments
            </h2>

            <p style={styles.sectionHelpText}>
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
                    const selected = module.programs.some(
                      (item) => item.id === program.id
                    );

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
                            handleProgramToggle(program)
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
                  const selected = module.specializations.some(
                    (item) => item.id === specialization.id
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
                          handleSpecializationToggle(specialization)
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

            <p style={styles.sectionHelpText}>
              Configure assessment requirements and continuing medical
              education credits for this module.
            </p>

            <div style={styles.assessmentSection}>
              <div style={styles.libraryLabel}>
                Assessment
              </div>

              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={module.has_quiz}
                  onChange={(event) =>
                    handleQuizChange(event.target.checked)
                  }
                />

                <div>
                  <div style={styles.assignmentName}>
                    Module has a quiz
                  </div>

                  <div style={styles.assignmentDescription}>
                    Enable this when the module includes an assessment.
                  </div>
                </div>
              </label>
            </div>

            <div style={styles.assessmentSection}>
              <div style={styles.libraryLabel}>
                Continuing Medical Education
              </div>

              <div style={styles.cmeGrid}>
                <div>
                  <label style={styles.label}>
                    CME Status
                  </label>

                  <select
                    value={module.credit_type}
                    onChange={(event) =>
                      handleCreditTypeChange(
                        event.target.value as "none" | "cme"
                      )
                    }
                    style={styles.input}
                  >
                    <option value="none">
                      Not CME Eligible
                    </option>

                    <option value="cme">
                      CME Eligible
                    </option>
                  </select>
                </div>

                <div>
                  <label style={styles.label}>
                    CME Credits
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={
                      module.credit_type === "cme"
                        ? module.cme_credits ?? ""
                        : ""
                    }
                    disabled={module.credit_type !== "cme"}
                    onChange={(event) =>
                      handleCmeCreditsChange(
                        event.target.value
                      )
                    }
                    style={{
                      ...styles.input,
                      ...(module.credit_type !== "cme"
                        ? styles.disabledInput
                        : {}),
                    }}
                  />

                  <div style={styles.fieldHelpText}>
                    Whole-number credits awarded after successfully
                    passing this module.
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div style={styles.pageActions}>
            <button
              type="button"
              disabled={deleting || saving || replacingZip}
              onClick={handleDelete}
              style={{
                ...styles.saveButton,
                backgroundColor: "#B91C1C",
                marginRight: "auto",
                ...(deleting || saving || replacingZip
                  ? styles.disabledButton
                  : {}),
              }}
            >
              {deleting ? "Deleting..." : "Delete Module"}
            </button>
            <button
              type="button"
              style={{
                ...styles.saveButton,
                ...(saving ? styles.disabledButton : {}),
              }}
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </>
      )}
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

  placeholder: {
    margin: 0,
    color: "#6B7280",
    fontSize: "14px",
  },

  errorBox: {
    padding: "12px 14px",
    borderRadius: "8px",
    backgroundColor: "#FEE2E2",
    color: "#991B1B",
    fontSize: "14px",
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "20px 30px",
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  label: {
    marginBottom: "5px",
    fontSize: "12px",
    fontWeight: 600,
    color: "#6B7280",
  },

  value: {
    fontSize: "14px",
    color: "#111827",
    overflowWrap: "anywhere",
  },

  field: {
    display: "flex",
    flexDirection: "column",
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

  actions: {
    gridColumn: "1 / -1",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "5px",
  },

  cancelButton: {
    border: "1px solid #D1D5DB",
    borderRadius: "6px",
    backgroundColor: "#FFFFFF",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 500,
  },

  saveButton: {
    border: "none",
    borderRadius: "6px",
    backgroundColor: "#2563EB",
    color: "#FFFFFF",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 600,
  },

  successBox: {
    padding: "12px 14px",
    marginBottom: "18px",
    borderRadius: "8px",
    backgroundColor: "#DCFCE7",
    color: "#166534",
    fontSize: "14px",
  },

  sectionDescription: {
    marginTop: "-4px",
    marginBottom: "20px",
    color: "#6B7280",
    fontSize: "14px",
  },

  librarySection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
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

  disabledButton: {
    opacity: 0.5,
    cursor: "not-allowed",
  },

  sectionHelpText: {
    marginTop: "-4px",
    marginBottom: "20px",
    color: "#6B7280",
    fontSize: "13px",
    lineHeight: 1.5,
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

  assignmentOptionDisabled: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
    cursor: "not-allowed",
    opacity: 0.6,
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

  assessmentSection: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginTop: "20px",
  },

  checkboxRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    padding: "12px",
    border: "1px solid #E5E7EB",
    borderRadius: "8px",
    backgroundColor: "#FFFFFF",
    cursor: "pointer",
  },

  cmeGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(2, minmax(0, 1fr))",
    gap: "20px",
  },

  disabledInput: {
    backgroundColor: "#F3F4F6",
    color: "#9CA3AF",
    cursor: "not-allowed",
  },

  fieldHelpText: {
    marginTop: "5px",
    fontSize: "12px",
    lineHeight: 1.4,
    color: "#6B7280",
  },

  pageActions: {
    display: "flex",
    justifyContent: "flex-end",
    paddingBottom: "10px",
  },

};