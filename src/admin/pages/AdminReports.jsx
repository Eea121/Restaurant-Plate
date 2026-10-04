import { useState } from 'react';
import { downloadReport } from '../../services/adminService';
import { getErrorMessage } from '../../services/api';

const reportTypes = [
  { type: 'orders', label: 'Orders Report', desc: 'All orders with items, totals, and statuses.' },
  { type: 'reservations', label: 'Reservations Report', desc: 'All reservations with customer and slot details.' },
  { type: 'feedbacks', label: 'Feedbacks Report', desc: 'Customer feedback with ratings and approval status.' },
  { type: 'users', label: 'Users Report', desc: 'Registered users with roles and account status.' },
  { type: 'revenue', label: 'Revenue Report', desc: 'Revenue breakdown by day for the last 30 days.' },
];

const formats = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
  { value: 'csv', label: 'CSV (.csv)' },
];

const AdminReports = () => {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');

  const handleDownload = async (type, format) => {
    setBusy(`${type}-${format}`);
    setError('');
    try {
      await downloadReport(type, format);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Reports
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Export restaurant data in Excel, PDF, or CSV format.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => (
          <div
            key={report.type}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-between gap-5"
          >
            <div>
              <h2 className="font-serif text-lg font-bold text-gray-900">
                {report.label}
              </h2>
              <p className="text-sm text-gray-500 mt-1">{report.desc}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {formats.map((format) => (
                <button
                  key={format.value}
                  onClick={() => handleDownload(report.type, format.value)}
                  disabled={busy === `${report.type}-${format.value}`}
                  className="px-4 py-2 rounded-md text-sm font-medium border border-gray-200 text-gray-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy === `${report.type}-${format.value}`
                    ? 'Downloading...'
                    : format.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
