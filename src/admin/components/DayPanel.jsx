import PropTypes from 'prop-types';
import HoursEditor from './HoursEditor';
import SlotsPanel from './SlotsPanel';
import { formatTimeSlot } from '../../utils/formatters';

const normalizeTime = (value) => {
  const str = String(value || '');
  return str.length === 5 ? str + ':00' : str;
};

const DayPanel = ({
  day,
  hours,
  slots,
  hoursEditor,
  slotEditor,
  busy,
  onHoursAdd,
  onHoursEdit,
  onHoursDelete,
  onHoursChange,
  onHoursSave,
  onHoursCancel,
  onSlotAdd,
  onSlotEdit,
  onSlotDelete,
  onSlotEditorChange,
  onSlotEditorSave,
  onSlotEditorCancel,
  onDeleteDay,
}) => (
  <div className="mx-4 sm:mx-6 mb-4 grid gap-4 xl:grid-cols-2">
    <section className="rounded-xl border border-gray-200 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
        Opening hours
      </p>

      {hours.length === 0 && !hoursEditor && (
        <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg px-3 py-4 text-center bg-white mb-3">
          No opening hours set for this day yet.
        </p>
      )}

      {hours.length > 0 && (
        <ul className="space-y-1.5 mb-3">
          {hours.map((h) => {
            const isEditing =
              hoursEditor &&
              hoursEditor.mode === 'edit' &&
              hoursEditor.dayId === day.id &&
              hoursEditor.origStart === normalizeTime(h.startTime) &&
              hoursEditor.origEnd === normalizeTime(h.endTime);
            if (isEditing) return null;
            return (
              <li
                key={h.startTime + '-' + h.endTime}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <span className="text-sm font-medium text-gray-800">
                  {formatTimeSlot(h.startTime)} - {formatTimeSlot(h.endTime)}
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onHoursEdit(h)}
                    disabled={!!hoursEditor || busy}
                    className="text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40"
                  >
                    Edit
                  </button>
                  <span className="text-gray-200">|</span>
                  <button
                    type="button"
                    onClick={() => onHoursDelete(h)}
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

      {hoursEditor && hoursEditor.dayId === day.id && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <HoursEditor
            title={hoursEditor.mode === 'add' ? 'New opening hours' : 'Edit opening hours'}
            startTime={hoursEditor.startTime}
            endTime={hoursEditor.endTime}
            error={hoursEditor.error}
            busy={busy}
            onChange={(patch) => onHoursChange(patch)}
            onSave={onHoursSave}
            onCancel={onHoursCancel}
          />
        </div>
      )}

      {!hoursEditor && (
        <button
          type="button"
          onClick={() => onHoursAdd(day.id)}
          disabled={busy}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-amber-700 disabled:opacity-40"
        >
          + Add opening hours
        </button>
      )}
    </section>

    <SlotsPanel
      slots={slots}
      editor={
        slotEditor &&
        (slotEditor.dayId === day.id || slotEditor.slot?.dayId === day.id)
          ? slotEditor
          : null
      }
      busy={busy}
      onAddClick={() => onSlotAdd(day.id)}
      onEditClick={onSlotEdit}
      onDeleteClick={onSlotDelete}
      onEditorChange={onSlotEditorChange}
      onEditorSave={onSlotEditorSave}
      onEditorCancel={onSlotEditorCancel}
    />

    <div className="xl:col-span-2 flex justify-end pt-1 border-t border-gray-100">
      <button
        type="button"
        onClick={() => onDeleteDay(day)}
        disabled={busy}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-40"
      >
        Delete this day
      </button>
    </div>
  </div>
);

DayPanel.propTypes = {
  day: PropTypes.object.isRequired,
  hours: PropTypes.array.isRequired,
  slots: PropTypes.array.isRequired,
  hoursEditor: PropTypes.object,
  slotEditor: PropTypes.object,
  busy: PropTypes.bool,
  onHoursAdd: PropTypes.func.isRequired,
  onHoursEdit: PropTypes.func.isRequired,
  onHoursDelete: PropTypes.func.isRequired,
  onHoursChange: PropTypes.func.isRequired,
  onHoursSave: PropTypes.func.isRequired,
  onHoursCancel: PropTypes.func.isRequired,
  onSlotAdd: PropTypes.func.isRequired,
  onSlotEdit: PropTypes.func.isRequired,
  onSlotDelete: PropTypes.func.isRequired,
  onSlotEditorChange: PropTypes.func.isRequired,
  onSlotEditorSave: PropTypes.func.isRequired,
  onSlotEditorCancel: PropTypes.func.isRequired,
  onDeleteDay: PropTypes.func.isRequired,
};

export default DayPanel;
