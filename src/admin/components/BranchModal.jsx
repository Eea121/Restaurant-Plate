import PropTypes from 'prop-types';

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-900 px-4 py-2.5 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 text-sm transition-colors';
const labelClass = 'block text-sm font-medium text-gray-700 mb-1.5';
const errorClass = 'mt-1 text-xs text-red-500';

const Field = ({ label, name, type = 'text', step, values, errors, onChange }) => (
  <div>
    <label className={labelClass}>{label} *</label>
    <input
      type={type}
      step={step}
      value={values[name] ?? ''}
      onChange={(e) => onChange(name, e.target.value)}
      className={inputClass}
    />
    {errors[name] && <p className={errorClass}>{errors[name]}</p>}
  </div>
);

Field.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  step: PropTypes.string,
  values: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};

const BranchModal = ({ mode, values, errors, saving, onChange, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="font-serif text-xl font-bold text-gray-900">
          {mode === 'edit' ? 'Edit Branch' : 'Add Branch'}
        </h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        noValidate
        className="p-6 space-y-5"
      >
        <Field label="Location" name="location" values={values} errors={errors} onChange={onChange} />
        <Field label="Phone" name="phone" values={values} errors={errors} onChange={onChange} />
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Latitude"
            name="latitude"
            type="number"
            step="any"
            values={values}
            errors={errors}
            onChange={onChange}
          />
          <Field
            label="Longitude"
            name="longitude"
            type="number"
            step="any"
            values={values}
            errors={errors}
            onChange={onChange}
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold tracking-wide disabled:opacity-60 transition-colors"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  </div>
);

BranchModal.propTypes = {
  mode: PropTypes.oneOf(['create', 'edit']).isRequired,
  values: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  saving: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default BranchModal;
