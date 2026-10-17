'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert, Search, Filter, RefreshCw, FileText,
  User, CheckCircle2, AlertTriangle, XCircle, Clock,
  Eye, Code2, Globe, Laptop, ArrowRight, X, Copy, Check
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { formatDate } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AuditLogItem {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  metadata: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  // Metadata Inspector Modal
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getAuditLogs({
        targetType: targetTypeFilter || undefined,
        action: actionFilter || undefined,
        limit,
        offset,
      });

      let items: AuditLogItem[] = Array.isArray(data.logs) ? data.logs : [];

      // Client-side actor / target ID search filtering if user typed in search bar
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        items = items.filter(
          (l) =>
            l.actorEmail?.toLowerCase().includes(q) ||
            l.targetId?.toLowerCase().includes(q) ||
            l.reason?.toLowerCase().includes(q)
        );
      }

      setLogs(items);
      setTotal(data.total || items.length);
    } catch (err: any) {
      setError(err?.message || 'Failed to load audit logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [targetTypeFilter, actionFilter, limit, offset, search]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyMetadata = (meta: any) => {
    navigator.clipboard.writeText(JSON.stringify(meta, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderActionBadge = (action: string) => {
    const a = action.toUpperCase();
    if (a.includes('APPROVE') || a.includes('ACTIVATE') || a.includes('VERIF') || a.includes('CREATE')) {
      return <Badge variant="success" size="sm">{action}</Badge>;
    }
    if (a.includes('SUSPEND') || a.includes('ARCHIVE') || a.includes('UPDATE')) {
      return <Badge variant="warning" size="sm">{action}</Badge>;
    }
    if (a.includes('DELETE') || a.includes('REJECT') || a.includes('FAIL') || a.includes('ANONYMIZ')) {
      return <Badge variant="error" size="sm">{action}</Badge>;
    }
    return <Badge variant="neutral" size="sm">{action}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-teal-700" /> System Audit Trail & Compliance Ledger
          </h1>
          <p className="text-xs text-slate-500">
            Immutable legal ledger tracking administrative actions, KYC decisions, user status changes, and financial mutations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchLogs} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Refresh
          </Button>
          <Badge variant="brand">{total} Total Events</Badge>
        </div>
      </div>

      {/* Explanatory Banner */}
      <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider">
            <Clock className="w-4 h-4" /> Non-repudiation & Audit Enforcement
          </div>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Every privileged operation captures the admin user ID, email, IP address, user agent, before/after parameters, and mandatory compliance justification. Records are permanent and cannot be modified or deleted.
          </p>
        </div>
        <div className="shrink-0 bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 text-right">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Retention Policy</div>
          <div className="text-xs font-bold text-teal-400">7 Years Legal Retention</div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="md:col-span-6">
          <Input
            placeholder="Search by actor email, target ID, or reason..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={targetTypeFilter}
            onChange={(e) => {
              setTargetTypeFilter(e.target.value);
              setOffset(0);
            }}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="">All Target Types</option>
            <option value="USER">USER</option>
            <option value="PACKAGE">PACKAGE</option>
            <option value="PROVIDER_DOCUMENT">PROVIDER_DOCUMENT</option>
            <option value="PROVIDER">PROVIDER</option>
            <option value="SETTLEMENT">SETTLEMENT</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="BOOKING">BOOKING</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setOffset(0);
            }}
            className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus:border-teal-600 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="USER_SUSPEND">USER_SUSPEND</option>
            <option value="USER_ACTIVATE">USER_ACTIVATE</option>
            <option value="USER_ANONYMIZED_DELETE">USER_ANONYMIZED_DELETE</option>
            <option value="USER_PERMANENT_DELETE">USER_PERMANENT_DELETE</option>
            <option value="PACKAGE_APPROVE">PACKAGE_APPROVE</option>
            <option value="PACKAGE_REJECT">PACKAGE_REJECT</option>
            <option value="PACKAGE_SUSPEND">PACKAGE_SUSPEND</option>
            <option value="PACKAGE_REACTIVATE">PACKAGE_REACTIVATE</option>
            <option value="PACKAGE_UPDATE">PACKAGE_UPDATE</option>
            <option value="PACKAGE_ARCHIVE_DELETE">PACKAGE_ARCHIVE_DELETE</option>
            <option value="PACKAGE_PERMANENT_DELETE">PACKAGE_PERMANENT_DELETE</option>
            <option value="SETTLEMENT_UPDATE">SETTLEMENT_UPDATE</option>
            <option value="DOCUMENT_VERIFY">DOCUMENT_VERIFY</option>
            <option value="DOCUMENT_REJECT">DOCUMENT_REJECT</option>
            <option value="CATEGORY_CREATE">CATEGORY_CREATE</option>
            <option value="CATEGORY_UPDATE">CATEGORY_UPDATE</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading immutable audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No audit log entries found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target</th>
                  <th className="py-3 px-4">Justification / Reason</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      <div>{formatDate(log.createdAt)}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{log.actorEmail}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        {log.ipAddress || 'Internal System'}
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-700">{log.targetType}:</span>{' '}
                      <span className="font-mono text-slate-500 text-[11px]">
                        {log.targetId ? log.targetId.slice(0, 12) + '...' : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={log.reason}>
                      {log.reason}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectLog(log)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing {logs.length} entries of {total} total
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset((o) => Math.max(0, o - limit))}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => setOffset((o) => o + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* ── Metadata Inspection Modal ── */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Audit Record Inspector</span>
                <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                  {inspectLog.action}
                </h3>
              </div>
              <button onClick={() => setInspectLog(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Overview Details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500">Event ID:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{inspectLog.id}</span>
              </div>
              <div>
                <span className="text-slate-500">Timestamp:</span>{' '}
                <span className="font-medium text-slate-800">{formatDate(inspectLog.createdAt)} {new Date(inspectLog.createdAt).toLocaleTimeString()}</span>
              </div>
              <div>
                <span className="text-slate-500">Actor Email:</span>{' '}
                <span className="font-bold text-slate-800">{inspectLog.actorEmail}</span>
              </div>
              <div>
                <span className="text-slate-500">Actor Role:</span>{' '}
                <span className="font-semibold text-teal-700">{inspectLog.actorRole}</span>
              </div>
              <div>
                <span className="text-slate-500">Target Type:</span>{' '}
                <span className="font-bold text-slate-800">{inspectLog.targetType}</span>
              </div>
              <div>
                <span className="text-slate-500">Target ID:</span>{' '}
                <span className="font-mono text-slate-800 text-[11px]">{inspectLog.targetId}</span>
              </div>
              {inspectLog.ipAddress && (
                <div>
                  <span className="text-slate-500">IP Address:</span>{' '}
                  <span className="font-mono text-slate-800">{inspectLog.ipAddress}</span>
                </div>
              )}
              {inspectLog.userAgent && (
                <div className="col-span-2 text-[11px] truncate">
                  <span className="text-slate-500">User Agent:</span>{' '}
                  <span className="text-slate-700">{inspectLog.userAgent}</span>
                </div>
              )}
            </div>

            {/* Justification */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 uppercase">
                Recorded Justification / Audit Reason
              </label>
              <div className="p-3 bg-amber-50/60 border border-amber-200 text-amber-950 text-xs rounded-xl">
                {inspectLog.reason}
              </div>
            </div>

            {/* Metadata Payload */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5 text-slate-500" /> Context Metadata Snapshot
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyMetadata(inspectLog.metadata)}
                  leftIcon={copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  className="text-xs h-7 px-2"
                >
                  {copied ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-48 border border-slate-800">
                {JSON.stringify(inspectLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <Button variant="ghost" size="sm" onClick={() => setInspectLog(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
