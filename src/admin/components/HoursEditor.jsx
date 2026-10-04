import PropTypes from 'prop-types';

const inputClass =
  'bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm transition-colors';

const HoursEditor = ({ title, startTime, endTime, error, busy, onChange, onSave, onCancel }) => (
  <div>
    {title && (
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">{title}</p>
    )}
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Opens</span>
        <input
          type="time"
          value={startTime}
          onChange={(e) => onChange({ startTime: e.target.value })}
          className={inputClass}
          required
        />
      </label>
      <span className="text-gray-400">–</span>
      <label className="flex items-center gap-2 text-sm text-gray-600">
        <span className="font-medium">Closes</span>
        <input
          type="time"
          value={endTime}
          onChange={(e) => onChange({ endTime: e.target.value })}
          className={inputClass}
          required
        />
      </label>
      <div className="flex items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="px-5 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-60 transition-colors"
        >
          {busy ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
    {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

HoursEditor.propTypes = {
  title: PropTypes.string,
  startTime: PropTypes.string.isRequired,
  endTime: PropTypes.string.isRequired,
  error: PropTypes.string,
  busy: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default HoursEditor;
