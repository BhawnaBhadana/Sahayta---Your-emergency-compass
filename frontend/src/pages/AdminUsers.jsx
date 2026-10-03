import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import * as userService from '../services/userService';
import { LoadingState, ErrorState } from '../components/DataState';
import { ROLE_LABELS } from '../utils/constants';

const ROLES = Object.keys(ROLE_LABELS);

export default function AdminUsers() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await userService.listUsers(roleFilter || undefined);
      setUsers(data.users);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [roleFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleRoleChange(id, role) {
    try {
      await userService.updateUserRole(id, role);
      toast.success('Role updated.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleToggleActive(id, isActive) {
    try {
      await userService.setUserActive(id, !isActive);
      toast.success(!isActive ? 'User activated.' : 'User deactivated.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleVerifyOrg(id) {
    try {
      await userService.verifyOrganization(id);
      toast.success('Organization verified.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <LoadingState label="Loading users..." />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-text-primary">Manage Users</h1>

      <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input-field mb-4 max-w-xs">
        <option value="">All roles</option>
        {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
      </select>

      <div className="overflow-x-auto rounded-xl border border-surface bg-white shadow-minimal">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-surface bg-surface/40 text-xs uppercase text-text-tertiary">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Org Verified</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-surface last:border-0">
                <td className="px-4 py-3 font-medium text-text-primary">{u.name}</td>
                <td className="px-4 py-3 text-text-secondary">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="input-field !w-auto !py-1 text-xs">
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge border ${u.is_active ? 'border-secondary-200 bg-secondary-100 text-secondary-800' : 'border-accent-200 bg-accent-100 text-accent-700'}`}>
                    {u.is_active ? 'Active' : 'Deactivated'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {['ngo', 'hospital'].includes(u.role) ? (u.is_org_verified ? '✓' : '—') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleToggleActive(u.id, u.is_active)} className="text-xs font-medium text-primary-600 hover:underline">
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    {['ngo', 'hospital'].includes(u.role) && !u.is_org_verified && (
                      <button onClick={() => handleVerifyOrg(u.id)} className="text-xs font-medium text-secondary-700 hover:underline">Verify org</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
