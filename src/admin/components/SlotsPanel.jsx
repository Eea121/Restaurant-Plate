import PropTypes from 'prop-types';
import { formatTimeSlot } from '../../utils/formatters';

const inputClass =
  'bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm transition-colors';

const SlotsPanel = ({
  slots,
  editor,
  busy,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onEditorChange,
  onEditorSave,
  onEditorCancel,
}) => (
  <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
        Reservation slots
      </p>
      <button
        type="button"
        onClick={onAddClick}
        disabled={!!editor}
        className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40"
      >
        + Add slot
      </button>
    </div>

    {editor && (
      <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Time</span>
            <input
              type="time"
              value={editor.time}
              onChange={(e) => onEditorChange({ time: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={!!editor.isAvailable}
              onChange={(e) => onEditorChange({ isAvailable: e.target.checked })}
              className="w-4 h-4 accent-amber-500"
            />
            Available
          </label>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onEditorCancel}
              className="px-3 py-1.5 rounded-md text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onEditorSave}
              disabled={busy}
              className="px-4 py-1.5 rounded-md text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-60"
            >
              Save
            </button>
          </div>
        </div>
        {editor.error && (
          <p className="mt-2 text-xs text-red-500 font-medium">{editor.error}</p>
        )}
      </div>
    )}

    {slots.length === 0 ? (
      <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg px-3 py-4 text-center bg-white">
        No reservation slots for this day yet.
      </p>
    ) : (
      <ul className="space-y-1.5">
        {slots.map((slot) => {
          const isEditing =
            editor && editor.mode === 'edit' && editor.slot && editor.slot.id === slot.id;
          if (isEditing) return null;
          return (
            <li
              key={slot.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
            >
              <span className="text-sm font-medium text-gray-800 w-24">
                {formatTimeSlot(slot.time)}
              </span>
              {slot.isAvailable ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-500">
                  Unavailable
                </span>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onEditClick(slot)}
                  disabled={!!editor || busy}
                  className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40"
                >
                  Edit
                </button>
                <span className="text-gray-200">|</span>
                <button
                  type="button"
                  onClick={() => onDeleteClick(slot)}
                  disabled={busy}
                  className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    )}
  </div>
);

SlotsPanel.propTypes = {
  slots: PropTypes.array.isRequired,
  editor: PropTypes.object,
  busy: PropTypes.bool,
  onAddClick: PropTypes.func.isRequired,
  onEditClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  onEditorChange: PropTypes.func.isRequired,
  onEditorSave: PropTypes.func.isRequired,
  onEditorCancel: PropTypes.func.isRequired,
};

export default SlotsPanel;
