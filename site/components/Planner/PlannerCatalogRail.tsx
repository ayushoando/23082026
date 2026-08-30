"use client";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { PhIcon } from "@planner/components/ui/PlannerPhIcon";
import { useCatalogStore } from "@planner/store/plannerCatalogStore";
import { fileUrl, uploadFurniture } from "@planner/lib/plannerApi";
import { usePlannerUIStore } from "@planner/store/plannerUiStore";
import { usePlannerFocusManager } from "@planner/hooks/usePlannerFocusManager";
import type { FurnitureDimensions, FurnitureItem } from "@planner/lib/plannerTypes";
import { DEFAULT_CATALOG_FURNITURE_DIMS_MM } from "@planner/lib/plannerTokens";

const formatDims = (d: FurnitureDimensions): string => `${d.width_mm}×${d.depth_mm}×${d.height_mm} mm`;

interface CatalogRailProps {
  onDragStart?: (item: FurnitureItem) => void;
  onItemClick?: (item: FurnitureItem) => void;
}

type UploadForm = {
  name: string;
  category: string;
  width_mm: number;
  depth_mm: number;
  height_mm: number;
  tags: string;
  file: File | null;
};

type UploadErrors = Partial<Record<keyof UploadForm | "form", string>>;

const CatalogRail = ({ onDragStart, onItemClick }: CatalogRailProps) => {
  const items = useCatalogStore((s) => s.items);
  const categories = useCatalogStore((s) => s.categories);
  const loading = useCatalogStore((s) => s.loading);
  const catalogError = useCatalogStore((s) => s.error);
  const refresh = useCatalogStore((s) => s.refresh);
  const selectedItem = useCatalogStore((s) => s.selectedItem);
  const selectItem = useCatalogStore((s) => s.selectItem);
  const showToast = usePlannerUIStore((s) => s.showToast);
  const accessMode = usePlannerUIStore((s) => s.accessMode);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<UploadErrors>({});
  const [upload, setUpload] = useState<UploadForm>({
    name: "",
    category: "Custom",
    ...DEFAULT_CATALOG_FURNITURE_DIMS_MM,
    tags: "",
    file: null,
  });
  const uploadDialogRef = useRef<HTMLDivElement>(null);
  const uploadNameRef = useRef<HTMLInputElement>(null);
  const uploadFormErrorRef = useRef<HTMLParagraphElement>(null);
  const uploadDialogId = useId();
  const uploadTitleId = useId();
  const uploadDescriptionId = useId();
  const closeUpload = useCallback(() => {
    setUploadOpen(false);
    setUploadErrors({});
  }, []);

  usePlannerFocusManager({
    open: uploadOpen,
    containerRef: uploadDialogRef,
    modal: true,
    initialFocusRef: uploadNameRef,
    onClose: closeUpload,
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!uploadErrors.form) return;
    queueMicrotask(() => uploadFormErrorRef.current?.focus());
  }, [uploadErrors.form]);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase().trim();
    return items.filter((i) => {
      if (cat !== "all" && i.category !== cat) return false;
      if (needle && !i.name.toLowerCase().includes(needle) && !(i.tags || []).join(" ").toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [items, q, cat]);

  const thumbUrl = (item: FurnitureItem): string | null | undefined =>
    item.thumbnail_url ?? item.thumb_url;

  function updateUpload<K extends keyof UploadForm>(field: K, value: UploadForm[K]) {
    setUpload((current) => ({ ...current, [field]: value }));
    setUploadErrors((current) => ({ ...current, [field]: undefined, form: undefined }));
  }

  const doUpload = async () => {
    if (accessMode === "guest") {
      showToast("Sign in to upload custom furniture", "error");
      return;
    }

    const nextErrors: UploadErrors = {};
    if (!upload.name.trim()) nextErrors.name = "Enter a furniture name.";
    if (!upload.file) nextErrors.file = "Choose a PNG or SVG symbol.";
    for (const [field, label] of [
      ["width_mm", "Width"],
      ["depth_mm", "Depth"],
      ["height_mm", "Height"],
    ] as const) {
      const value = upload[field];
      if (!Number.isFinite(value) || value <= 0) {
        nextErrors[field] = `${label} must be greater than 0 mm.`;
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setUploadErrors(nextErrors);
      showToast("Check the highlighted upload fields", "error");
      queueMicrotask(() => {
        uploadDialogRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus();
      });
      return;
    }

    setUploadBusy(true);
    setUploadErrors({});
    try {
      const fd = new FormData();
      fd.append("file", upload.file as File);
      fd.append("name", upload.name.trim());
      fd.append("category", upload.category);
      fd.append("width_mm", String(upload.width_mm));
      fd.append("depth_mm", String(upload.depth_mm));
      fd.append("height_mm", String(upload.height_mm));
      fd.append("tags", upload.tags);
      await uploadFurniture(fd);
      showToast(`Uploaded "${upload.name}"`, "ok");
      closeUpload();
      setUpload({ name: "", category: "Custom", ...DEFAULT_CATALOG_FURNITURE_DIMS_MM, tags: "", file: null });
      refresh();
    } catch (e: unknown) {
      const message = `Upload failed: ${e instanceof Error ? e.message : String(e)}`;
      setUploadErrors({ form: message });
      showToast(message, "error");
    } finally {
      setUploadBusy(false);
    }
  };

  const dimensionError = uploadErrors.width_mm ?? uploadErrors.depth_mm ?? uploadErrors.height_mm;

  return (
    <>
      <div className="side-panel__section">
        <h3 className="side-panel__title">Catalog</h3>
        <div className="catalog-search-wrap" style={{ marginBottom: 10 }}>
          <span className="catalog-search-icon"><PhIcon name="search" size={18} /></span>
          <input
            className="catalog-search"
            placeholder="Search furniture…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            data-testid="catalog-search"
            aria-label="Search furniture"
          />
        </div>
        <div className="catalog-categories" role="group" aria-label="Filter catalog by category">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className="chip"
              data-active={cat === c}
              aria-pressed={cat === c}
              onClick={() => setCat(c)}
              data-testid={`cat-${c}`}
            >
              {c === "all" ? "All" : c}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--sm catalog-upload-trigger"
          onClick={() => {
            setUploadErrors({});
            setUploadOpen(true);
          }}
          data-testid="btn-upload"
          disabled={accessMode === "guest"}
          aria-haspopup="dialog"
          aria-expanded={uploadOpen}
          aria-controls={uploadDialogId}
          aria-describedby={accessMode === "guest" ? "planner-catalog-guest-note" : undefined}
        >
          <PhIcon name="upload" size={18} /> Upload custom
        </button>
        {accessMode === "guest" ? (
          <p id="planner-catalog-guest-note" className="catalog-guest-note">
            Guest browsing is read-only. Sign in to upload custom furniture.
          </p>
        ) : null}
      </div>

      <div className="side-panel__section" style={{ flex: 1, overflow: "auto", padding: "10px 12px 20px" }}>
        {loading ? (
          <div className="empty-state" data-state="loading" role="status" aria-busy="true">
            <PhIcon name="spinner" size={20} weight="bold" />
            <span>Loading catalog…</span>
          </div>
        ) : catalogError ? (
          <div className="catalog-state" data-state="server-error" role="alert">
            <div className="catalog-state__icon" aria-hidden="true">
              <PhIcon name="x" size={20} weight="duotone" />
            </div>
            <p>Catalog unavailable. Your current selection is preserved.</p>
            <button type="button" className="btn btn--sm" onClick={() => void refresh()}>Try again</button>
          </div>
        ) : (
          <div className="catalog-grid" role="region" aria-label="Furniture catalog results">
            {filtered.map((item) => {
              const thumb = thumbUrl(item);
              const thumbSrc = thumb ? fileUrl(thumb) : null;
              return (
                <button
                  key={item.id}
                  type="button"
                  className="catalog-item"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/furniture-id", item.id);
                    onDragStart?.(item);
                  }}
                  data-selected={selectedItem?.id === item.id ? "true" : "false"}
                  aria-pressed={selectedItem?.id === item.id}
                  onClick={() => {
                    selectItem(item);
                    onItemClick?.(item);
                  }}
                  data-testid={`catalog-item-${item.id}`}
                  title={`${item.name} — ${formatDims(item.dimensions)}`}
                  aria-label={`Place ${item.name}, ${formatDims(item.dimensions)}`}
                >
                  <div className="catalog-item__thumb">
                    {thumbSrc
                      ? <img src={thumbSrc} alt="" loading="lazy" />
                      : <PhIcon name="rect" size={32} aria-hidden="true" />}
                  </div>
                  <div className="catalog-item__name">{item.name}</div>
                  <div className="catalog-item__dim">{item.dimensions.width_mm}×{item.dimensions.depth_mm}</div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="empty-state" data-state="empty" style={{ gridColumn: "1/-1" }} role="status">
                <PhIcon name="folder" size={20} />
                <span>No items match</span>
              </div>
            )}
          </div>
        )}
      </div>

      {uploadOpen ? (
        <div
          className="dialog-scrim"
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeUpload();
          }}
        >
          <div
            ref={uploadDialogRef}
            id={uploadDialogId}
            className="dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={uploadTitleId}
            aria-describedby={uploadDescriptionId}
            aria-busy={uploadBusy}
          >
            <h2 id={uploadTitleId} className="dialog__title">Upload custom furniture</h2>
            <p id={uploadDescriptionId} className="dialog__sub">Add a PNG or SVG symbol with its real-world dimensions in millimetres.</p>
            <form
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                void doUpload();
              }}
            >
              <div className="prop-row">
                <label className="prop-row__label" htmlFor="planner-upload-name">Name</label>
                <div className="prop-row__inputs">
                  <input
                    ref={uploadNameRef}
                    id="planner-upload-name"
                    className="input"
                    value={upload.name}
                    onChange={(e) => updateUpload("name", e.target.value)}
                    placeholder="e.g. Custom Cabinet"
                    data-testid="upload-name"
                    aria-required="true"
                    aria-invalid={Boolean(uploadErrors.name)}
                    aria-describedby={uploadErrors.name ? "planner-upload-name-error" : undefined}
                  />
                  {uploadErrors.name ? <p id="planner-upload-name-error" className="planner-field-error" role="alert">{uploadErrors.name}</p> : null}
                </div>
              </div>
              <div className="prop-row">
                <label className="prop-row__label" htmlFor="planner-upload-category">Category</label>
                <select
                  id="planner-upload-category"
                  className="select"
                  value={upload.category}
                  onChange={(e) => updateUpload("category", e.target.value)}
                  aria-label="Category"
                >
                  {["Seating", "Desks", "Tables", "Storage", "Workstations", "Accessories", "Openings", "Custom"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="prop-row">
                <div className="prop-row__label" id="planner-upload-dims-label">W × D × H</div>
                <div className="prop-row__inputs" role="group" aria-labelledby="planner-upload-dims-label" aria-describedby="planner-upload-dims-help">
                  <input
                    id="planner-upload-width"
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={upload.width_mm}
                    onChange={(e) => updateUpload("width_mm", parseFloat(e.target.value) || 0)}
                    aria-label="Width in millimetres"
                    aria-invalid={Boolean(uploadErrors.width_mm)}
                    aria-describedby={dimensionError ? "planner-upload-dims-help planner-upload-dims-error" : "planner-upload-dims-help"}
                  />
                  <input
                    id="planner-upload-depth"
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={upload.depth_mm}
                    onChange={(e) => updateUpload("depth_mm", parseFloat(e.target.value) || 0)}
                    aria-label="Depth in millimetres"
                    aria-invalid={Boolean(uploadErrors.depth_mm)}
                    aria-describedby={dimensionError ? "planner-upload-dims-help planner-upload-dims-error" : "planner-upload-dims-help"}
                  />
                  <input
                    id="planner-upload-height"
                    className="input"
                    type="number"
                    min="1"
                    step="1"
                    value={upload.height_mm}
                    onChange={(e) => updateUpload("height_mm", parseFloat(e.target.value) || 0)}
                    aria-label="Height in millimetres"
                    aria-invalid={Boolean(uploadErrors.height_mm)}
                    aria-describedby={dimensionError ? "planner-upload-dims-help planner-upload-dims-error" : "planner-upload-dims-help"}
                  />
                </div>
                <p id="planner-upload-dims-help" className="ai-hint">Width, depth, and height must be greater than 0 mm.</p>
                {dimensionError ? <p id="planner-upload-dims-error" className="planner-field-error" role="alert">{dimensionError}</p> : null}
              </div>
              <div className="prop-row">
                <label className="prop-row__label" htmlFor="planner-upload-tags">Tags</label>
                <input id="planner-upload-tags" className="input" value={upload.tags} onChange={(e) => updateUpload("tags", e.target.value)} placeholder="comma, separated" />
              </div>
              <div className="prop-row">
                <label className="prop-row__label" htmlFor="planner-upload-file">File</label>
                <div className="prop-row__inputs">
                  <input
                    id="planner-upload-file"
                    type="file"
                    accept="image/png,image/svg+xml"
                    onChange={(e) => updateUpload("file", e.target.files?.[0] ?? null)}
                    data-testid="upload-file"
                    aria-label="Furniture image file"
                    aria-required="true"
                    aria-invalid={Boolean(uploadErrors.file)}
                    aria-describedby={uploadErrors.file ? "planner-upload-file-error" : undefined}
                  />
                  {uploadErrors.file ? <p id="planner-upload-file-error" className="planner-field-error" role="alert">{uploadErrors.file}</p> : null}
                </div>
              </div>
              {uploadErrors.form ? (
                <p ref={uploadFormErrorRef} className="planner-handoff__error" role="alert" tabIndex={-1} data-testid="upload-error">
                  {uploadErrors.form}
                </p>
              ) : null}
              <div className="dialog__actions">
                <button type="button" className="btn btn--ghost" onClick={closeUpload} disabled={uploadBusy}>Cancel</button>
                <button type="submit" className="btn btn--primary" disabled={uploadBusy} data-testid="upload-confirm">
                  {uploadBusy ? "Uploading…" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default CatalogRail;
