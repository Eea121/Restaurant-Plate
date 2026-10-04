import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getErrorMessage } from '../services/api';
import { formatPrice, formatDayDate, formatTimeSlot } from '../utils/formatters';

const PAGE_SIZE = 10;

const fieldInputValue = (field, row) => {
  const raw = row ? row[field.name] : undefined;
  if (raw === undefined || raw === null) return field.defaultValue ?? '';
  switch (field.type) {
    case 'time':
      return String(raw).slice(0, 5);
    case 'datetime-local':
      return String(raw).slice(0, 16);
    case 'checkbox':
      return !!raw;
    default:
      return raw;
  }
};

const buildPayload = (fields, values) => {
  const payload = {};
  fields.forEach((field) => {
    // Conditional Fields Are Nulled Out While Their Gate (enabledWhen) Is Off.
    if (field.enabledWhen && !values[field.enabledWhen]) {
      payload[field.name] = null;
      return;
    }
    let value = values[field.name];
    switch (field.type) {
      case 'number':
        // Required Numbers Fall Back To 0; Optional Ones Stay Null So The API
        // Can Tell "Not Provided" Apart From An Actual Zero Value.
        value =
          value === '' || value === undefined || value === null
            ? field.required
              ? 0
              : null
            : Number(value);
        break;
      case 'checkbox':
        value = value ?? field.defaultValue ?? false;
        break;
      case 'time':
        if (value) value = String(value).length === 5 ? `${value}:00` : String(value);
        break;
      case 'datetime-local':
        if (value) value = new Date(value).toISOString();
        break;
      case 'select':
        if (value !== '' && value !== undefined && value !== null) {
          const num = Number(value);
          value = Number.isNaN(num) ? value : num;
        }
        break;
      case 'file':
        // Strip The Origin From Absolute Image Urls So Only The Relative Path (/uploads/...)
        // Is Sent Back To The API (Prevents The Double-Prefixed PictureUrl Bug).
        if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
          try {
            value = new URL(value).pathname;
          } catch {
            break;
          }
        }
        break;
      default:
        break;
    }
    payload[field.name] = value;
  });
  return payload;
};

const validate = (fields, values, editing, disabledNames) => {
  const errors = {};
  const labelOf = (name) =>
    fields.find((f) => f.name === name)?.label || name;
  fields.forEach((field) => {
    if (editing && (field.disabledInEdit || disabledNames?.includes(field.name))) return;
    if (field.type === 'checkbox') return;
    // Skip Fields Whose Gate (enabledWhen) Is Currently Off.
    if (field.enabledWhen && !values[field.enabledWhen]) return;
    const value = values[field.name];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '');

    if (field.required && isEmpty) {
      errors[field.name] = `${field.label || field.name} is required.`;
      return;
    }
    // Required Only While The Gate Is Ticked (E.g. Discount % Needs Special Offer).
    if (field.requiredWhenEnabled && field.enabledWhen && isEmpty) {
      errors[field.name] =
        `${field.label || field.name} is required when ${labelOf(field.enabledWhen)} is ticked.`;
      return;
    }
    if (field.type === 'number' && !isEmpty) {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors[field.name] = `${field.label || field.name} must be a valid number.`;
      } else {
        if (field.min !== undefined && num < Number(field.min)) {
          errors[field.name] = `${field.label || field.name} must be at least ${field.min}.`;
        }
        if (field.max !== undefined && num > Number(field.max)) {
          errors[field.name] = `${field.label || field.name} must be at most ${field.max}.`;
        }
      }
    }
  });
  return errors;
};

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:border-amber-500 text-sm';
const inputErrorClass =
  'w-full bg-white border border-red-300 text-gray-900 px-4 py-2.5 rounded-md focus:outline-none focus:border-red-400 text-sm';
const readOnlyClass = 'bg-gray-100 text-gray-500 border-gray-100 cursor-not-allowed';

const actionBtnBase =
  'inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed';
const editBtnClass = `${actionBtnBase} border-amber-500 bg-amber-100 text-amber-600 hover:bg-amber-200 hover:border-amber-400 focus:ring-amber-300 focus:ring-offset-2`;
const deleteBtnClass = `${actionBtnBase} border-red-500 bg-red-100 text-red-600 hover:bg-red-100/90 hover:border-red-400 focus:ring-red-300 focus:ring-offset-2`;
const actionLinkClass = `${actionBtnBase} border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-300 focus:ring-gray-300 focus:ring-offset-2`;

const CrudPage = ({ config }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [values, setValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [optionsCache, setOptionsCache] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingField, setUploadingField] = useState(null);
  const [busyAction, setBusyAction] = useState(null);

  const disabledNames = config.disabledInEdit || [];

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = config.paginated
        ? { search: search.trim() || undefined, pageIndex, pageSize: PAGE_SIZE }
        : undefined;
      if (config.paginated) {
        (config.filters || []).forEach((f) => {
          const val = filters[f.name];
          if (val !== '' && val !== undefined && val !== null) {
            params[f.paramName || f.name] = f.type === 'number' ? Number(val) : val;
          }
        });
      }
      const res = await config.service.list(params);
      setRows(res.data || []);
      setTotalCount(res.count || (res.data || []).length || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [config, search, filters, pageIndex]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    const init = {};
    config.fields.forEach((f) => {
      init[f.name] = fieldInputValue(f, null);
    });
    setValues(init);
    setFieldErrors({});
    setEditingRow(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    const init = {};
    config.fields.forEach((f) => {
      let val = fieldInputValue(f, row);
      // Select options use numeric values; coerce numeric strings so the
      // prefilled value always matches its option on first render.
      if (
        f.type === 'select' &&
        val !== '' &&
        val !== undefined &&
        val !== null &&
        !Number.isNaN(Number(val))
      ) {
        val = Number(val);
      }
      init[f.name] = val;
    });
    setValues(init);
    setFieldErrors({});
    setEditingRow(row);
    setModalOpen(true);
  };

  useEffect(() => {
    if (!modalOpen) return;
    config.fields.forEach((field) => {
      if (field.type !== 'select' || !field.options || optionsCache[field.name]) return;
      field
        .options()
        .then((opts) =>
          setOptionsCache((cache) => ({ ...cache, [field.name]: opts })),
        )
        .catch(() => {});
    });
  }, [modalOpen, config, optionsCache]);

  useEffect(() => {
    if (!modalOpen || editingRow) return;
    setValues((v) => {
      const next = { ...v };
      let changed = false;
      config.fields.forEach((field) => {
        if (field.type !== 'select' || !field.required) return;
        const opts = optionsCache[field.name] || [];
        if (
          opts.length > 0 &&
          (next[field.name] === '' ||
            next[field.name] === undefined ||
            next[field.name] === null)
        ) {
          next[field.name] = opts[0].value;
          changed = true;
        }
      });
      return changed ? next : v;
    });
  }, [modalOpen, editingRow, optionsCache, config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validate(config.fields, values, !!editingRow, disabledNames);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setSaving(true);
    setError('');
    setFieldErrors({});
    try {
      const payload = buildPayload(config.fields, values);
      if (editingRow) {
        payload.id = editingRow.id;
        await config.service.update(editingRow, payload);
      } else {
        await config.service.create(payload);
      }
      setModalOpen(false);
      setPageIndex(1);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await config.service.remove(deleteTarget);
      setDeleteTarget(null);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPageIndex(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPageIndex(1);
  };

  const handleFileUpload = async (field, file) => {
    if (!file || !field.upload) return;
    // Must Mirror The API's [RequestSizeLimit(5MB)] So Oversized Files Fail
    // With A Clear Message Instead Of An Opaque Transport Error.
    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please choose a file under 5 MB.');
      return;
    }
    setUploadingField(field.name);
    setError('');
    try {
      const res = await field.upload(file);
      const body = res.data;
      // Accepts A Plain Url String Or Common Wrapper Shapes Returned By APIs.
      const url =
        typeof body === 'string'
          ? body
          : body?.url || body?.pictureUrl || body?.pictureURL || body?.filePath;
      setValues((v) => ({ ...v, [field.name]: typeof url === 'string' ? url : '' }));
      if (typeof url !== 'string' || url === '') {
        setError(
          'Upload succeeded but the server returned no image URL. Check the API response.',
        );
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setUploadingField(null);
    }
  };

  const handleRowAction = async (action, row) => {
    const key = `${rowKey(row)}-${action.label}`;
    setBusyAction(key);
    setError('');
    try {
      await action.onClick(row);
      if (action.reload) await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleToggle = async (col, row) => {
    const key = `${rowKey(row)}-${col.key}`;
    setBusyAction(key);
    setError('');
    try {
      await col.toggle.onChange(row, !row?.[col.key]);
      if (col.toggle.reload !== false) await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const handleSelectChange = async (col, row, value) => {
    const key = `${rowKey(row)}-${col.key}`;
    setBusyAction(key);
    setError('');
    try {
      await col.select.onChange(row, value);
      if (col.select.reload !== false) await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  };

  const setFieldValue = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setFieldErrors((prev) => {
      // Clearing A Gate Also Clears Errors Of Fields It Disables, So No Stale Messages Linger.
      const disabledNames = !value
        ? config.fields.filter((f) => f.enabledWhen === name).map((f) => f.name)
        : [];
      if (!prev[name] && disabledNames.every((n) => !prev[n])) return prev;
      const next = { ...prev };
      delete next[name];
      for (const disabledName of disabledNames) delete next[disabledName];
      return next;
    });
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const rowKey = config.getRowKey || ((row) => row.id);

  const renderCell = (row, col) => {
    const value = row?.[col.key];
    if (col.render) return col.render(row);
    if (col.select) {
      const isBusy = busyAction === `${rowKey(row)}-${col.key}`;
      return (
        <select
          value={col.select.getValue(row)}
          disabled={isBusy}
          onChange={(e) => handleSelectChange(col, row, e.target.value)}
          className={`border-0 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 ${
            (col.select.style && col.select.style(row)) || 'bg-gray-100 text-gray-600'
          }`}
        >
          {col.select.options.map((o) => (
            <option key={o.value} value={o.value} className="bg-white text-gray-900">
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    if (col.toggle) {
      const isBusy = busyAction === `${rowKey(row)}-${col.key}`;
      const isOn = !!value;
      return (
        <button
          onClick={() => handleToggle(col, row)}
          disabled={isBusy}
          className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed ${
            isOn
              ? 'border-green-500 bg-green-100 text-green-700 hover:bg-green-200 hover:border-green-400 focus:ring-green-300'
              : 'border-gray-300 bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-400 focus:ring-gray-300'
          }`}
        >
          {isBusy ? 'Working...' : isOn ? 'Approved' : 'Approve'}
        </button>
      );
    }
    switch (col.type) {
      case 'currency':
        return formatPrice(value);
      case 'boolean':
        return value ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
            Yes
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
            No
          </span>
        );
      case 'date':
        return formatDayDate(value);
      case 'time':
        return formatTimeSlot(value);
      default:
        return value === undefined || value === null ? '' : String(value);
    }
  };

  const renderFieldError = (field) =>
    fieldErrors[field.name] ? (
      <p className="mt-1.5 text-xs text-red-600">{fieldErrors[field.name]}</p>
    ) : null;

  const renderFieldLabel = (field) => (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {field.label || field.name}
      {field.required && <span className="text-red-500"> *</span>}
    </label>
  );

  const renderField = (field) => {
    // Fields With enabledWhen Stay Locked Until Their Gate Value Is Ticked.
    const gatedOff = !!field.enabledWhen && !values[field.enabledWhen];
    const gateLabel = field.enabledWhen
      ? config.fields.find((f) => f.name === field.enabledWhen)?.label ||
        field.enabledWhen
      : '';
    const disabled =
      (!!editingRow && (field.disabledInEdit || disabledNames.includes(field.name))) ||
      gatedOff;
    const value = values[field.name];
    const hasError = !!fieldErrors[field.name];

    if (field.type === 'checkbox') {
      return (
        <div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={!!value}
              disabled={disabled}
              onChange={(e) => setFieldValue(field.name, e.target.checked)}
              className="w-4 h-4 accent-amber-500"
            />
            <span className="text-sm text-gray-700">{field.label}</span>
            {field.required && <span className="text-red-500"> *</span>}
          </label>
          {renderFieldError(field)}
        </div>
      );
    }

    const common = {
      className: `${hasError ? inputErrorClass : inputClass} ${
        disabled ? readOnlyClass : ''
      }`,
      disabled,
      onChange: (e) => setFieldValue(field.name, e.target.value),
    };

    let control;
    if (field.type === 'textarea') {
      control = (
        <textarea rows="3" placeholder={field.label} value={value ?? ''} {...common} />
      );
    } else if (field.type === 'select') {
      const opts = optionsCache[field.name] || [];
      control = (
        <select value={value ?? ''} {...common}>
          <option value="">Select {field.label}</option>
          {opts.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    } else if (field.type === 'file') {
      const uploading = uploadingField === field.name;
      if (value) {
        control = (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <img
                src={value}
                alt={field.label}
                className="w-14 h-14 rounded-md object-cover border border-gray-200"
              />
              <button
                type="button"
                onClick={() => setFieldValue(field.name, '')}
                disabled={disabled}
                className="text-xs text-red-500 hover:text-red-600 font-medium disabled:opacity-40"
              >
                Remove
              </button>
            </div>
            <label
              className={`flex items-center justify-center border border-dashed border-gray-300 rounded-md px-4 py-3 cursor-pointer hover:border-amber-500 text-sm text-gray-500 ${disabled ? readOnlyClass : ''}`}
            >
              {uploading ? 'Uploading...' : `Replace ${field.label}`}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={disabled || uploading}
                onChange={(e) => handleFileUpload(field, e.target.files?.[0])}
              />
            </label>
          </div>
        );
      } else {
        control = (
          <label
            className={`flex items-center justify-center border border-dashed border-gray-300 rounded-md px-4 py-4 cursor-pointer hover:border-amber-500 text-sm text-gray-500 ${disabled ? readOnlyClass : ''}`}
          >
            {uploading ? 'Uploading...' : `Upload ${field.label}`}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={disabled || uploading}
              onChange={(e) => handleFileUpload(field, e.target.files?.[0])}
            />
          </label>
        );
      }
    } else {
      const inputType =
        field.type === 'number'
          ? 'number'
          : field.type === 'time'
            ? 'time'
            : field.type === 'datetime-local'
              ? 'datetime-local'
              : 'text';
      control = (
        <input
          type={inputType}
          placeholder={field.label}
          value={value ?? ''}
          step={field.step}
          min={field.min}
          max={field.max}
          {...common}
        />
      );
    }

    return (
      <div>
        {renderFieldLabel(field)}
        {control}
        {gatedOff && (
          <p className="mt-1 text-xs text-gray-400 italic">
            Tick &quot;{gateLabel}&quot; to enable this field.
          </p>
        )}
        {disabled && !gatedOff && (
          <p className="mt-1 text-xs text-gray-400 italic">
            This field is read-only in edit mode.
          </p>
        )}
        {renderFieldError(field)}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900">
          {config.title}
        </h1>
        {!config.createDisabled && (
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-md font-medium text-sm tracking-wide shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add {config.title.slice(0, -1)}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {config.paginated && (
          <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-3">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={handleSearchChange}
              className={`${inputClass} w-full sm:max-w-xs`}
            />
            {(config.filters || []).map((filter) => (
              <select
                key={filter.name}
                value={filters[filter.name] ?? ''}
                onChange={(e) => handleFilterChange(filter.name, e.target.value)}
                className={`${inputClass} w-full sm:w-[190px]`}
              >
                <option value="">{filter.label}</option>
                {(filter.options || []).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ))}
          </div>
        )}

        {/* Desktop table (≥768px) — unchanged */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                {config.columns.map((col) => (
                  <th key={col.key} className="px-5 py-3 font-medium">
                    {col.label}
                  </th>
                ))}
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={config.columns.length + 1}
                    className="px-5 py-16 text-center text-gray-500 text-sm tracking-widest"
                  >
                    LOADING...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={config.columns.length + 1}
                    className="px-5 py-16 text-center text-gray-500 text-sm"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={rowKey(row)} className="hover:bg-gray-50 transition-colors">
                    {config.columns.map((col) => (
                      <td key={col.key} className="px-5 py-3.5 text-gray-700">
                        {renderCell(row, col)}
                      </td>
                    ))}
                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {(config.rowActions || [])
                          .filter((action) => (action.show ? action.show(row) : true))
                          .map((action) => {
                            const busyKey = `${rowKey(row)}-${action.label}`;
                            const isBusy = busyAction === busyKey;
                            return (
                              <button
                                key={action.label}
                                onClick={() => handleRowAction(action, row)}
                                disabled={isBusy}
                                className={actionLinkClass}
                              >
                                {isBusy ? 'Working...' : action.label}
                              </button>
                            );
                          })}
                        {!config.editDisabled && (
                          <button
                            onClick={() => openEdit(row)}
                            className={editBtnClass}
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget(row)}
                          className={deleteBtnClass}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards (<768px) */}
        <div className="md:hidden divide-y divide-gray-100">
          {loading ? (
            <div className="p-4 space-y-4" aria-hidden="true">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-5 py-16 text-center text-gray-500 text-sm">
              No records found.
            </p>
          ) : (
            rows.map((row) => {
              const rk = rowKey(row);
              return (
                <div key={rk} className="p-4 space-y-3">
                  <dl className="space-y-2.5">
                    {config.columns.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <dt className="text-xs uppercase tracking-wider text-gray-400 pt-0.5 shrink-0">
                          {col.label}
                        </dt>
                        <dd className="text-gray-700 text-right break-words min-w-0">
                          {renderCell(row, col)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100">
                    {(config.rowActions || [])
                      .filter((action) => (action.show ? action.show(row) : true))
                      .map((action) => {
                        const busyKey = `${rk}-${action.label}`;
                        const isBusy = busyAction === busyKey;
                        return (
                          <button
                            key={action.label}
                            onClick={() => handleRowAction(action, row)}
                            disabled={isBusy}
                            className={actionLinkClass}
                          >
                            {isBusy ? 'Working...' : action.label}
                          </button>
                        );
                      })}
                    {!config.editDisabled && (
                      <button
                        onClick={() => openEdit(row)}
                        className={editBtnClass}
                      >
                        Edit
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget(row)}
                      className={deleteBtnClass}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {config.paginated && !loading && rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {rows.length} of {totalCount}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex === 1}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                PREV
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex === totalPages}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 transition-all duration-200 hover:border-amber-400 hover:text-amber-600 hover:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-gray-900">
                {editingRow ? `Edit ${config.title.slice(0, -1)}` : `Add ${config.title.slice(0, -1)}`}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 -mr-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6 space-y-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
              {config.fields.map((field) => (
                <div key={field.name}>{renderField(field)}</div>
              ))}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-md text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-md text-sm font-medium tracking-wide disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-sm p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-3">
              Delete record
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete this record? This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-5 py-2.5 rounded-md text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-md text-sm font-medium disabled:opacity-60"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

CrudPage.propTypes = {
  config: PropTypes.shape({
    title: PropTypes.string.isRequired,
    paginated: PropTypes.bool,
    createDisabled: PropTypes.bool,
    editDisabled: PropTypes.bool,
    disabledInEdit: PropTypes.arrayOf(PropTypes.string),
    getRowKey: PropTypes.func,
    columns: PropTypes.arrayOf(
      PropTypes.shape({
        key: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        type: PropTypes.string,
        render: PropTypes.func,
        toggle: PropTypes.shape({
          onChange: PropTypes.func.isRequired,
          reload: PropTypes.bool,
        }),
        select: PropTypes.shape({
          options: PropTypes.arrayOf(
            PropTypes.shape({
              value: PropTypes.any.isRequired,
              label: PropTypes.string.isRequired,
            }),
          ).isRequired,
          getValue: PropTypes.func.isRequired,
          style: PropTypes.func,
          onChange: PropTypes.func.isRequired,
          reload: PropTypes.bool,
        }),
      }),
    ).isRequired,
    fields: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string,
        type: PropTypes.string,
        required: PropTypes.bool,
        step: PropTypes.string,
        min: PropTypes.string,
        max: PropTypes.string,
        defaultValue: PropTypes.any,
        disabledInEdit: PropTypes.bool,
        enabledWhen: PropTypes.string,
        requiredWhenEnabled: PropTypes.bool,
        options: PropTypes.func,
        upload: PropTypes.func,
      }),
    ).isRequired,
    service: PropTypes.object.isRequired,
    filters: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        paramName: PropTypes.string,
        type: PropTypes.string,
        options: PropTypes.arrayOf(
          PropTypes.shape({
            value: PropTypes.any.isRequired,
            label: PropTypes.string.isRequired,
          }),
        ),
      }),
    ),
    rowActions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        onClick: PropTypes.func.isRequired,
        show: PropTypes.func,
        reload: PropTypes.bool,
      }),
    ),
  }).isRequired,
};

export default CrudPage;
