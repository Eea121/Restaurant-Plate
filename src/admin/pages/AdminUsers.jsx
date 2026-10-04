import { useCallback, useEffect, useState } from 'react';
import {
  getUsers,
  getRoles,
  lockUser,
  unlockUser,
  changeUserRole,
} from '../../services/adminService';
import { getErrorMessage } from '../../services/api';

const PAGE_SIZE = 10;

const inputClass =
  'w-full bg-white border border-gray-200 text-gray-900 px-3 py-2 rounded-md focus:outline-none focus:border-amber-500 text-sm';

const roleColor = (role) => {
  const r = (role || '').toLowerCase();
  if (r === 'admin') return 'bg-red-100 text-red-700';
  if (r === 'user' || r === '') return 'bg-gray-100 text-gray-600';
  return 'bg-blue-100 text-blue-700';
};

const AdminUsers = () => {
  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pageIndex, setPageIndex] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [lockedOnly, setLockedOnly] = useState(false);
  const [busy, setBusy] = useState(null);

  const loadRoles = useCallback(async () => {
    try {
      const res = await getRoles();
      setRoles(res.data || []);
    } catch {
      setRoles([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        lockedOnly: lockedOnly || undefined,
        pageIndex,
        pageSize: PAGE_SIZE,
      };
      const res = await getUsers(params);
      setRows(res.data.data || []);
      setTotalCount(res.data.count || 0);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, lockedOnly, pageIndex]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id, fn, successFn) => {
    setBusy(id);
    setError('');
    try {
      await fn(id);
      successFn();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const handleLock = (id) =>
    act(id, () => lockUser(id), () =>
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, isLocked: true } : u))),
    );

  const handleUnlock = (id) =>
    act(id, () => unlockUser(id), () =>
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, isLocked: false } : u))),
    );

  const handleRoleChange = (user, newRole) => {
    if (!newRole || newRole === (user.roles?.[0] || '')) return;
    act(
      user.id,
      () => changeUserRole(user.id, newRole),
      () =>
        setRows((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, roles: [newRole] } : u)),
        ),
    );
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="p-6 md:p-8">
      <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 mb-2">
        Users
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Manage user accounts, roles, and access.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPageIndex(1);
            }}
            className={`${inputClass} w-full sm:max-w-xs`}
          />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPageIndex(1);
            }}
            className={`${inputClass} w-full sm:w-[180px]`}
          >
            <option value="">All Roles</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer py-1">
            <input
              type="checkbox"
              checked={lockedOnly}
              onChange={(e) => {
                setLockedOnly(e.target.checked);
                setPageIndex(1);
              }}
              className="w-4 h-4 accent-amber-500"
            />
            Locked only
          </label>
        </div>

        {/* Desktop table (≥768px) — unchanged */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center text-gray-500 text-sm tracking-widest">
                    LOADING...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-16 text-center text-gray-500 text-sm">
                    No users found.
                  </td>
                </tr>
              ) : (
                rows.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
                          {(user.displayName || user.userName || user.email || '?').charAt(0)}
                        </span>
                        <p className="font-medium text-gray-800">
                          {user.displayName || user.userName}
                        </p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{user.email}</td>
                    <td className="px-5 py-3.5 text-gray-600">{user.phoneNumber || '—'}</td>
                    <td className="px-5 py-3.5">
                      <select
                        value={user.roles?.[0] || ''}
                        disabled={busy === user.id}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className={`border-0 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-shadow focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-60 ${roleColor(user.roles?.[0])}`}
                      >
                        {!user.roles?.[0] && (
                          <option value="" className="bg-white text-gray-500">
                            No Role
                          </option>
                        )}
                        {roles.map((role) => (
                          <option key={role} value={role} className="bg-white text-gray-900">
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.isLocked ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600">
                          <span className="w-2 h-2 rounded-full bg-red-500" /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500" /> Active
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {user.isLocked ? (
                          <button
                            onClick={() => handleUnlock(user.id)}
                            disabled={busy === user.id}
                            className="text-green-600 hover:text-green-700 font-medium disabled:opacity-40"
                          >
                            Unlock
                          </button>
                        ) : !(user.roles || []).some((r) => r.toLowerCase() === 'admin') ? (
                          <button
                            onClick={() => handleLock(user.id)}
                            disabled={busy === user.id}
                            className="text-red-600 hover:text-red-700 font-medium disabled:opacity-40"
                          >
                            Lock
                          </button>
                        ) : null}
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
                  <div className="flex items-center gap-3">
                    <div className="skeleton h-9 w-9 rounded-full" />
                    <div className="skeleton h-4 w-32" />
                  </div>
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="px-5 py-16 text-center text-gray-500 text-sm">No users found.</p>
          ) : (
            rows.map((user) => (
              <div key={user.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-bold uppercase shrink-0">
                    {(user.displayName || user.userName || user.email || '?').charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {user.displayName || user.userName}
                    </p>
                    <p className="text-xs text-gray-500 break-all">{user.email}</p>
                  </div>
                  <span
                    className={`ml-auto shrink-0 inline-flex items-center gap-1.5 text-xs font-medium ${
                      user.isLocked ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${user.isLocked ? 'bg-red-500' : 'bg-green-500'}`} />
                    {user.isLocked ? 'Locked' : 'Active'}
                  </span>
                </div>

                <dl className="space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs uppercase tracking-wider text-gray-400 shrink-0">Phone</dt>
                    <dd className="text-gray-700">{user.phoneNumber || '—'}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-xs uppercase tracking-wider text-gray-400 shrink-0">Role</dt>
                    <dd>
                      <select
                        value={user.roles?.[0] || ''}
                        disabled={busy === user.id}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className={`border-0 rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-shadow focus:ring-2 focus:ring-amber-400 disabled:opacity-60 focus:outline-none ${roleColor(user.roles?.[0])}`}
                      >
                        {!user.roles?.[0] && (
                          <option value="" className="bg-white text-gray-500">
                            No Role
                          </option>
                        )}
                        {roles.map((role) => (
                          <option key={role} value={role} className="bg-white text-gray-900">
                            {role}
                          </option>
                        ))}
                      </select>
                    </dd>
                  </div>
                </dl>

                <div className="pt-3 border-t border-gray-100 flex justify-end">
                  {user.isLocked ? (
                    <button
                      onClick={() => handleUnlock(user.id)}
                      disabled={busy === user.id}
                      className="px-3 py-2 rounded-md border border-green-500 bg-green-100 text-green-700 text-sm font-medium transition-all duration-200 hover:bg-green-200 disabled:opacity-40"
                    >
                      Unlock
                    </button>
                  ) : !(user.roles || []).some((r) => r.toLowerCase() === 'admin') ? (
                    <button
                      onClick={() => handleLock(user.id)}
                      disabled={busy === user.id}
                      className="px-3 py-2 rounded-md border border-red-500 bg-red-100 text-red-600 text-sm font-medium transition-all duration-200 hover:bg-red-100/90 disabled:opacity-40"
                    >
                      Lock
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {rows.length} of {totalCount}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setPageIndex((p) => Math.max(1, p - 1))}
                disabled={pageIndex === 1}
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                PREV
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                {pageIndex} / {totalPages}
              </span>
              <button
                onClick={() => setPageIndex((p) => Math.min(totalPages, p + 1))}
                disabled={pageIndex === totalPages}
                className="px-4 py-2 rounded-md text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:border-amber-500 hover:text-amber-500 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
