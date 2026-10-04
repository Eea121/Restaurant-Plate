import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getDays,
  createDay,
  updateDay,
  deleteDay,
  getDaySlots,
  createDaySlot,
  updateDaySlot,
  deleteDaySlot,
  getBranchOpenHours,
  createOpenHours,
  updateOpenHours,
  deleteOpenHours,
} from '../../services/restaurantService';
import { getErrorMessage } from '../../services/api';
import { formatDayName, formatDayDate, formatTimeSlot } from '../../utils/formatters';
import BranchModal from '../components/BranchModal';
import DayPanel from '../components/DayPanel';
import HoursEditor from '../components/HoursEditor';

const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold text-sm tracking-wide shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 disabled:opacity-60';
const editBtnClass =
  'inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:bg-amber-100 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200';
const deleteBtnClass =
  'inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100 hover:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-200';
const inputClass =
  'w-full bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm transition-colors';

const normalizeTime = (value) => {
  const str = String(value || '');
  return str.length === 5 ? str + ':00' : str;
};

const toInputTime = (value) => String(value || '').slice(0, 5);

const toInputDate = (date) => {
  const pad = (n) => String(n).padStart(2, '0');
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
};

const Switch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={
      'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 ' +
      (checked ? 'bg-emerald-500' : 'bg-gray-300') +
      (disabled ? ' opacity-60 cursor-not-allowed' : ' cursor-pointer')
    }
  >
    <span
      className={
        'inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ' +
        (checked ? 'translate-x-[22px]' : 'translate-x-[3px]')
      }
    />
  </button>
);

const AdminBranches = () => {
  const [branches, setBranches] = useState([]);
  const [days, setDays] = useState([]);
  const [daySlots, setDaySlots] = useState([]);
  const [openHoursByBranch, setOpenHoursByBranch] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoursLoading, setHoursLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});

  const [branchModal, setBranchModal] = useState(null);
  const [branchErrors, setBranchErrors] = useState({});
  const [dayModal, setDayModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [hoursEditor, setHoursEditor] = useState(null);
  const [slotEditor, setSlotEditor] = useState(null);

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedId) || null,
    [branches, selectedId],
  );

  const load = useCallback(async ({ silent } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [branchesRes, daysRes, slotsRes] = await Promise.all([
        getBranches(),
        getDays(),
        getDaySlots(),
      ]);
      const nextBranches = branchesRes.data || [];
      setBranches(nextBranches);
      setDays(daysRes.data || []);
      setDaySlots(slotsRes.data || []);
      setSelectedId((prev) =>
        prev && nextBranches.some((b) => b.id === prev)
          ? prev
          : (nextBranches[0] && nextBranches[0].id) || null,
      );
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    setHoursLoading(true);
    getBranchOpenHours(selectedId)
      .then((res) => {
        if (!cancelled)
          setOpenHoursByBranch((prev) => ({ ...prev, [selectedId]: res.data || [] }));
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setHoursLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const reloadHours = useCallback(async () => {
    if (!selectedId) return;
    try {
      const res = await getBranchOpenHours(selectedId);
      setOpenHoursByBranch((prev) => ({ ...prev, [selectedId]: res.data || [] }));
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [selectedId]);

  const runAction = async (action) => {
    setBusy(true);
    try {
      await action();
      await Promise.all([load({ silent: true }), reloadHours()]);
      return true;
    } catch (err) {
      setError(getErrorMessage(err));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const branchDays = useMemo(
    () =>
      days
        .filter((d) => d.branchId === selectedId)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [days, selectedId],
  );

  const hoursForDay = useCallback(
    (dayId) =>
      (openHoursByBranch[selectedId] || [])
        .filter((h) => h.dayId === dayId)
        .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime))),
    [openHoursByBranch, selectedId],
  );

  const slotsForDay = useCallback(
    (dayId) =>
      daySlots
        .filter((s) => s.dayId === dayId)
        .sort((a, b) => String(a.time).localeCompare(String(b.time))),
    [daySlots],
  );

  /* -------------------------- Branch CRUD -------------------------- */

  const validateBranch = (values) => {
    const errs = {};
    if (!String(values.location || '').trim()) errs.location = 'Location is required.';
    if (!String(values.phone || '').trim()) errs.phone = 'Phone number is required.';
    const lat = Number(values.latitude);
    const lng = Number(values.longitude);
    if (
      values.latitude === '' ||
      values.latitude === null ||
      Number.isNaN(lat) ||
      lat < -90 ||
      lat > 90
    )
      errs.latitude = 'Enter a number between -90 and 90.';
    if (
      values.longitude === '' ||
      values.longitude === null ||
      Number.isNaN(lng) ||
      lng < -180 ||
      lng > 180
    )
      errs.longitude = 'Enter a number between -180 and 180.';
    return errs;
  };

  const handleBranchSubmit = async () => {
    if (!branchModal) return;
    const errs = validateBranch(branchModal.values);
    setBranchErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      location: branchModal.values.location.trim(),
      phone: branchModal.values.phone.trim(),
      latitude: Number(branchModal.values.latitude),
      longitude: Number(branchModal.values.longitude),
    };
    const ok = await runAction(async () => {
      if (branchModal.mode === 'edit') {
        await updateBranch(branchModal.row.id, payload);
      } else {
        const res = await createBranch(payload);
        const newId = res.data?.id ?? res.data?.Id;
        if (newId != null) setSelectedId(newId);
      }
    });
    if (ok) {
      setBranchModal(null);
      setBranchErrors({});
    }
  };

  /* --------------------------- Day CRUD ---------------------------- */

  const handleDaySubmit = async () => {
    if (!dayModal || !selectedBranch || !dayModal.values.date) return;
    const ok = await runAction(() =>
      createDay({
        date: dayModal.values.date,
        isReserved: false,
        branchId: selectedBranch.id,
      }),
    );
    if (ok) setDayModal(null);
  };

  const handleToggleDay = async (day, nextOpen) => {
    const nextReserved = !nextOpen;
    setDays((prev) =>
      prev.map((d) => (d.id === day.id ? { ...d, isReserved: nextReserved } : d)),
    );
    try {
      await updateDay(day.id, {
        id: day.id,
        date: day.date,
        isReserved: nextReserved,
        branchId: day.branchId,
      });
    } catch (err) {
      setDays((prev) =>
        prev.map((d) => (d.id === day.id ? { ...d, isReserved: day.isReserved } : d)),
      );
      setError(getErrorMessage(err));
    }
  };

  /* ------------------------ Opening hours -------------------------- */

  const openHoursAdd = (dayId) =>
    setHoursEditor({ mode: 'add', dayId, startTime: '', endTime: '', error: '' });

  const openHoursEdit = (entry) =>
    setHoursEditor({
      mode: 'edit',
      dayId: entry.dayId,
      origStart: normalizeTime(entry.startTime),
      origEnd: normalizeTime(entry.endTime),
      startTime: toInputTime(entry.startTime),
      endTime: toInputTime(entry.endTime),
      error: '',
    });

  const handleHoursSave = async () => {
    if (!hoursEditor) return;
    const { mode, dayId, startTime, endTime } = hoursEditor;
    const start = normalizeTime(startTime);
    const end = normalizeTime(endTime);

    let validationError = '';
    if (!startTime || !endTime) validationError = 'Both opening and closing times are required.';
    else if (start >= end) validationError = 'Closing time must be after opening time.';
    else {
      const overlaps = hoursForDay(dayId).some((h) => {
        const hs = normalizeTime(h.startTime);
        const he = normalizeTime(h.endTime);
        if (mode === 'edit' && hs === hoursEditor.origStart && he === hoursEditor.origEnd)
          return false;
        return start < he && end > hs;
      });
      if (overlaps) validationError = 'These hours overlap an existing opening window.';
    }
    if (validationError) {
      setHoursEditor((prev) => ({ ...prev, error: validationError }));
      return;
    }

    const ok = await runAction(() =>
      mode === 'add'
        ? createOpenHours({ dayId, startTime: start, endTime: end })
        : updateOpenHours(dayId, hoursEditor.origStart, hoursEditor.origEnd, {
            startTime: start,
            endTime: end,
          }),
    );
    if (ok) setHoursEditor(null);
  };

  const handleHoursDelete = (entry) =>
    runAction(() =>
      deleteOpenHours(
        entry.dayId,
        normalizeTime(entry.startTime),
        normalizeTime(entry.endTime),
      ),
    );

  /* ----------------------------- Slots ------------------------------ */

  const openSlotAdd = (dayId) =>
    setSlotEditor({ mode: 'add', dayId, time: '', isAvailable: true, error: '' });

  const openSlotEdit = (slot) =>
    setSlotEditor({
      mode: 'edit',
      slot,
      time: toInputTime(slot.time),
      isAvailable: slot.isAvailable === undefined ? true : !!slot.isAvailable,
      error: '',
    });

  const handleSlotSave = async () => {
    if (!slotEditor || !slotEditor.time) {
      if (slotEditor) setSlotEditor((prev) => ({ ...prev, error: 'Please pick a time.' }));
      return;
    }
    const normalized = normalizeTime(slotEditor.time);
    const ok = await runAction(() =>
      slotEditor.mode === 'add'
        ? createDaySlot({
            dayId: slotEditor.dayId,
            time: normalized,
            isAvailable: !!slotEditor.isAvailable,
          })
        : updateDaySlot(slotEditor.slot.id, {
            id: slotEditor.slot.id,
            time: normalized,
            isAvailable: !!slotEditor.isAvailable,
            dayId: slotEditor.slot.dayId,
          }),
    );
    if (ok) setSlotEditor(null);
  };

  const handleSlotDelete = (slot) => runAction(() => deleteDaySlot(slot.id));

  /* ----------------------------- Delete ----------------------------- */

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { type, row } = deleteTarget;
    const ok = await runAction(async () => {
      if (type === 'branch') await deleteBranch(row.id);
      else if (type === 'day') await deleteDay(row.id);
    });
    setDeleting(false);
    if (ok) setDeleteTarget(null);
  };

  /* ---------------------------- Rendering ---------------------------- */

  if (loading) {
    return (
      <div className="p-4 md:p-8 lg:p-10 max-w-7xl">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-20 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-gray-200 border-t-amber-500 rounded-full mx-auto mb-4" />
          <p className="text-sm text-gray-500 tracking-widest">LOADING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 lg:p-10 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900">
            Branches &amp; Opening Hours
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage branch details, daily opening hours, and reservation slots in one place.
          </p>
        </div>
        <button onClick={() => { setBranchErrors({}); setBranchModal({ mode: 'create', values: { location: '', phone: '', latitude: '', longitude: '' } }); }} className={primaryBtnClass}>
          Add Branch
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg flex items-center justify-between gap-4">
          <span>{error}</span>
          <button
            onClick={() => load()}
            className="shrink-0 underline underline-offset-2 hover:text-red-700 font-medium"
          >
            Retry
          </button>
        </div>
      )}

      {branches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm py-20 text-center">
          <p className="text-gray-500 font-medium">No branches yet.</p>
          <p className="text-sm text-gray-400 mt-1">
            Create your first branch to start managing opening hours.
          </p>
          <button
            onClick={() => { setBranchErrors({}); setBranchModal({ mode: 'create', values: { location: '', phone: '', latitude: '', longitude: '' } }); }}
            className={'mt-4 ' + primaryBtnClass}
          >
            Add Branch
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          <section aria-label="All branches">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs uppercase tracking-wider text-gray-400 font-semibold">
                All Branches
              </h2>
              <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-0.5 font-medium">
                {branches.length}
              </span>
            </div>
            <div className="flex lg:flex-col gap-3 overflow-x-auto pb-2 lg:pb-0 lg:overflow-visible">
              {branches.map((branch) => {
                const active = branch.id === selectedId;
                const count = days.filter((d) => d.branchId === branch.id).length;
                return (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedId(branch.id)}
                    className={
                      'shrink-0 w-64 lg:w-full text-left rounded-xl border p-4 transition-all focus:outline-none focus:ring-2 focus:ring-amber-200 ' +
                      (active
                        ? 'border-amber-400 bg-amber-50/70 shadow-sm ring-1 ring-amber-300'
                        : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/30')
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' +
                          (active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-500')
                        }
                      >
                        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className={'text-sm font-semibold truncate ' + (active ? 'text-amber-800' : 'text-gray-900')}>
                          {branch.location}
                        </p>
                        <p className="text-xs text-gray-400 truncate">{branch.phone || 'No phone'}</p>
                      </div>
                    </div>
                    <p className="mt-2 text-[11px] text-gray-400">
                      {count} scheduled day{count === 1 ? '' : 's'}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {!selectedBranch ? (
            <section className="bg-white rounded-2xl border border-dashed border-gray-200 py-20 text-center">
              <p className="text-sm text-gray-400">Select a branch to manage its details.</p>
            </section>
          ) : (
            <section className="space-y-6 min-w-0">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-serif text-lg font-bold text-gray-900 truncate">
                        {selectedBranch.location}
                      </h2>
                      <p className="text-xs text-gray-400 uppercase tracking-wider">Branch information</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setBranchErrors({});
                        setBranchModal({
                          mode: 'edit',
                          row: selectedBranch,
                          values: {
                            location: selectedBranch.location || '',
                            phone: selectedBranch.phone || '',
                            latitude: selectedBranch.latitude ?? '',
                            longitude: selectedBranch.longitude ?? '',
                          },
                        });
                      }}
                      className={editBtnClass}
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ type: 'branch', row: selectedBranch })}
                      className={deleteBtnClass}
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                  <div className="px-5 md:px-6 py-4">
                    <dt className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Phone</dt>
                    <dd className="mt-1 text-sm text-gray-800 font-medium">{selectedBranch.phone || '-'}</dd>
                  </div>
                  <div className="px-5 md:px-6 py-4">
                    <dt className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Latitude</dt>
                    <dd className="mt-1 text-sm text-gray-800 font-medium">{selectedBranch.latitude}</dd>
                  </div>
                  <div className="px-5 md:px-6 py-4">
                    <dt className="text-[11px] uppercase tracking-wider text-gray-400 font-semibold">Longitude</dt>
                    <dd className="mt-1 text-sm text-gray-800 font-medium">{selectedBranch.longitude}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 md:px-6 py-4 border-b border-gray-100">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-gray-900">Working Hours</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Turn a day off to stop taking reservations. Click a chip to edit its hours.
                    </p>
                  </div>
                  <button onClick={() => setDayModal({ values: { date: toInputDate(new Date()) } })} className={editBtnClass}>
                    Add Day
                  </button>
                </div>

                {hoursLoading && !openHoursByBranch[selectedId] ? (
                  <div className="py-16 text-center">
                    <div className="animate-spin w-7 h-7 border-4 border-gray-200 border-t-amber-500 rounded-full mx-auto mb-3" />
                    <p className="text-xs text-gray-400 tracking-widest">LOADING HOURS...</p>
                  </div>
                ) : branchDays.length === 0 ? (
                  <div className="py-16 text-center px-6">
                    <p className="text-sm text-gray-500 font-medium">No scheduled days for this branch.</p>
                    <button onClick={() => setDayModal({ values: { date: toInputDate(new Date()) } })} className={'mt-4 ' + primaryBtnClass}>
                      Add Day
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {branchDays.map((day) => {
                      const hours = hoursForDay(day.id);
                      const slots = slotsForDay(day.id);
                      const isOpen = !day.isReserved;
                      const expanded = !!expandedDays[day.id];
                      const hasInlineEditor =
                        hoursEditor && hoursEditor.dayId === day.id && !expanded;
                      return (
                        <li key={day.id} className="hover:bg-gray-50/40 transition-colors">
                          <div className="px-4 sm:px-6 py-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                            <div className="w-32 shrink-0">
                              <p className="text-sm font-semibold text-gray-900">
                                {formatDayName(day.date) || formatDayDate(day.date)}
                              </p>
                              <p className="text-xs text-gray-400">{formatDayDate(day.date)}</p>
                            </div>

                            <div className="flex items-center gap-2.5">
                              <Switch checked={isOpen} onChange={(val) => handleToggleDay(day, val)} disabled={busy} />
                              <span className={'text-xs font-semibold ' + (isOpen ? 'text-emerald-600' : 'text-gray-400')}>
                                {isOpen ? 'Open' : 'Closed'}
                              </span>
                            </div>

                            <div className="flex-1 min-w-[150px] flex flex-wrap items-center gap-2">
                              {hours.length === 0 ? (
                                <span className="text-xs text-gray-400 italic">No hours set</span>
                              ) : (
                                hours.map((h) => (
                                  <span
                                    key={h.startTime + '-' + h.endTime}
                                    className={
                                      'group inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border transition-colors ' +
                                      (hoursEditor &&
                                      hoursEditor.mode === 'edit' &&
                                      hoursEditor.dayId === day.id &&
                                      hoursEditor.origStart === normalizeTime(h.startTime) &&
                                      hoursEditor.origEnd === normalizeTime(h.endTime)
                                        ? 'hidden'
                                        : 'bg-amber-50 border-amber-100 text-amber-800')
                                    }
                                  >
                                    {formatTimeSlot(h.startTime)} - {formatTimeSlot(h.endTime)}
                                    <button
                                      onClick={() => openHoursEdit(h)}
                                      disabled={!!hoursEditor || busy}
                                      className="text-amber-500 hover:text-amber-700 disabled:opacity-40"
                                      aria-label="Edit hours"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => handleHoursDelete(h)}
                                      disabled={busy}
                                      className="text-amber-400 hover:text-red-500 disabled:opacity-40"
                                      aria-label="Delete hours"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                              {!hasInlineEditor && (
                                <button
                                  onClick={() => openHoursAdd(day.id)}
                                  disabled={!!hoursEditor}
                                  className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:border-amber-300 hover:text-amber-700 transition-colors disabled:opacity-40"
                                >
                                  + Hours
                                </button>
                              )}
                              <span className="hidden sm:inline-flex items-center rounded-full bg-gray-100 text-gray-500 px-2.5 py-1 text-[11px] font-medium">
                                {slots.length} slot{slots.length === 1 ? '' : 's'}
                              </span>
                              <button
                                onClick={() => setExpandedDays((prev) => ({ ...prev, [day.id]: !prev[day.id] }))}
                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                aria-expanded={expanded}
                                aria-label="Manage day"
                              >
                                <svg className={'w-4 h-4 transition-transform ' + (expanded ? 'rotate-90' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {hasInlineEditor && (
                            <div className="mx-4 sm:mx-6 mb-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                              <HoursEditor
                                title={hoursEditor.mode === 'add' ? 'New opening hours' : 'Edit opening hours'}
                                startTime={hoursEditor.startTime}
                                endTime={hoursEditor.endTime}
                                error={hoursEditor.error}
                                busy={busy}
                                onChange={(patch) => setHoursEditor((prev) => ({ ...prev, ...patch }))}
                                onSave={handleHoursSave}
                                onCancel={() => setHoursEditor(null)}
                              />
                            </div>
                          )}

                          {expanded && (
                            <DayPanel
                              day={day}
                              hours={hours}
                              slots={slots}
                              hoursEditor={hoursEditor}
                              slotEditor={slotEditor}
                              busy={busy}
                              onHoursAdd={openHoursAdd}
                              onHoursEdit={openHoursEdit}
                              onHoursDelete={handleHoursDelete}
                              onHoursChange={(patch) => setHoursEditor((prev) => ({ ...prev, ...patch }))}
                              onHoursSave={handleHoursSave}
                              onHoursCancel={() => setHoursEditor(null)}
                              onSlotAdd={openSlotAdd}
                              onSlotEdit={openSlotEdit}
                              onSlotDelete={handleSlotDelete}
                              onSlotEditorChange={(patch) => setSlotEditor((prev) => ({ ...prev, ...patch }))}
                              onSlotEditorSave={handleSlotSave}
                              onSlotEditorCancel={() => setSlotEditor(null)}
                              onDeleteDay={(d) => setDeleteTarget({ type: 'day', row: d })}
                            />
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {branchModal && (
        <BranchModal
          mode={branchModal.mode}
          values={branchModal.values}
          errors={branchErrors}
          saving={busy}
          onChange={(name, value) =>
            setBranchModal((prev) => ({
              ...prev,
              values: { ...prev.values, [name]: value },
            }))
          }
          onSubmit={handleBranchSubmit}
          onClose={() => setBranchModal(null)}
        />
      )}

      {dayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-serif text-xl font-bold text-gray-900">Add Day</h2>
              <button onClick={() => setDayModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" aria-label="Close">
                &times;
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleDaySubmit(); }} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                <input
                  type="date"
                  value={dayModal.values.date}
                  onChange={(e) => setDayModal((prev) => ({ ...prev, values: { ...prev.values, date: e.target.value } }))}
                  required
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-400">
                  The day starts open for reservations. Use the switch to close it later.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setDayModal(null)} className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={busy} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
                  {busy ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">
              Delete {deleteTarget.type === 'branch' ? 'branch' : 'day'}?
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {deleteTarget.type === 'branch'
                ? 'This removes the branch along with all of its days, hours, and slots. This action cannot be undone.'
                : 'This removes the day with all of its opening hours and reservation slots. This action cannot be undone.'}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={confirmDelete} disabled={deleting} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranches;
