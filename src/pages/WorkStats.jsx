import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { apiBaseUrl } from '../config/api';
import { Activity, Clock, CheckCircle, ClipboardList, AlertCircle, Calendar, User, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

const WorkStats = () => {
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [selectedUser, setSelectedUser] = useState('all');
    const [dateRange, setDateRange] = useState([new Date(new Date().setDate(new Date().getDate() - 30)), new Date()]);
    const [startDate, endDate] = dateRange;
    const [activeDateFilter, setActiveDateFilter] = useState('last_30_days');
    const [expandedUser, setExpandedUser] = useState(null);
    const [activityFilter, setActivityFilter] = useState('all');

    const isAdmin = user?.role === 'admin' || user?.role === 'sub_admin';

    useEffect(() => {
        let isMounted = true;
        const fetchWorkStats = async () => {
            if (!user?.token) return;
            try {
                setLoading(true);
                const config = { headers: { Authorization: `Bearer ${user.token}` } };
                const params = {
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: endDate.toISOString().split('T')[0],
                };
                if (isAdmin && selectedUser !== 'all') {
                    params.user_id = selectedUser;
                }

                const { data: res } = await axios.get(`${apiBaseUrl}/dashboard/work-stats`, { ...config, params });
                if (isMounted) {
                    setData(res);
                    setLoading(false);
                }
            } catch (error) {
                if (isMounted) {
                    console.error(error);
                    if (error.response?.status !== 429) {
                        toast.error('Failed to load work stats');
                    }
                    setLoading(false);
                }
            }
        };
        fetchWorkStats();
        return () => { isMounted = false; };
    }, [user, startDate, endDate, selectedUser, isAdmin]);

    const setDateRangeFilter = (filterType) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let start;
        let end = new Date();
        end.setHours(23, 59, 59, 999);

        switch (filterType) {
            case 'today':
                start = new Date(today);
                break;
            case 'this_week': {
                const dayOfWeek = today.getDay();
                const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
                start = new Date(today);
                start.setDate(diff);
                break;
            }
            case 'this_month':
                start = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case 'last_30_days':
                start = new Date(today);
                start.setDate(start.getDate() - 30);
                break;
            case 'last_60_days':
                start = new Date(today);
                start.setDate(start.getDate() - 60);
                break;
            default:
                return;
        }

        setDateRange([start, end]);
        setActiveDateFilter(filterType);
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
        });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const formatHours = (hours) => {
        if (hours === null || hours === undefined) return '—';
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        if (hours < 24) return `${hours}h`;
        const days = Math.floor(hours / 24);
        const remaining = Math.round(hours % 24);
        return remaining > 0 ? `${days}d ${remaining}h` : `${days}d`;
    };

    const filteredActivity = data?.activity?.filter(a => {
        if (activityFilter === 'all') return true;
        return a.type === activityFilter;
    }) || [];

    if (loading) return <LoadingSpinner message="Loading work stats..." type="three-dots" color="#3b82f6" height={60} width={60} />;

    const { summary, userStats, supervisors } = data || {};

    return (
        <div className="ws-container">
            <div className="ws-header">
                <div>
                    <h1>Work Stats</h1>
                    <p className="ws-subtitle">Track work activity, completion times, and performance</p>
                </div>
                <div className="ws-date-display">
                    <Calendar size={16} />
                    {formatDate(startDate)} — {formatDate(endDate)}
                </div>
            </div>

            {/* Filters */}
            <div className="ws-filters">
                {isAdmin && supervisors?.length > 0 && (
                    <div className="ws-filter-group">
                        <label className="ws-filter-label"><User size={14} /> Person</label>
                        <select
                            className="ws-select"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="all">All Users</option>
                            {supervisors.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.role.replace('_', ' ')})</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="ws-filter-group">
                    <label className="ws-filter-label"><Calendar size={14} /> Period</label>
                    <div className="ws-date-btns">
                        {['today', 'this_week', 'this_month', 'last_30_days', 'last_60_days'].map(f => (
                            <button
                                key={f}
                                className={`ws-date-btn ${activeDateFilter === f ? 'active' : ''}`}
                                onClick={() => setDateRangeFilter(f)}
                            >
                                {f.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="ws-summary-grid">
                <div className="ws-card">
                    <div className="ws-card-icon bg-blue">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <p className="ws-card-label">Total Tickets</p>
                        <h3 className="ws-card-value">{summary?.totalTickets || 0}</h3>
                    </div>
                </div>
                <div className="ws-card">
                    <div className="ws-card-icon bg-green">
                        <CheckCircle size={22} />
                    </div>
                    <div>
                        <p className="ws-card-label">Tickets Resolved</p>
                        <h3 className="ws-card-value">{summary?.totalTicketsResolved || 0}</h3>
                    </div>
                </div>
                <div className="ws-card">
                    <div className="ws-card-icon bg-orange">
                        <Clock size={22} />
                    </div>
                    <div>
                        <p className="ws-card-label">Avg Resolution Time</p>
                        <h3 className="ws-card-value">{formatHours(summary?.avgTicketResolutionHours)}</h3>
                    </div>
                </div>
                <div className="ws-card">
                    <div className="ws-card-icon bg-purple">
                        <ClipboardList size={22} />
                    </div>
                    <div>
                        <p className="ws-card-label">Inspections Done</p>
                        <h3 className="ws-card-value">{summary?.totalInspectionsCompleted || 0}<span className="ws-card-sub">/ {summary?.totalInspections || 0}</span></h3>
                    </div>
                </div>
                <div className="ws-card">
                    <div className="ws-card-icon bg-teal">
                        <Activity size={22} />
                    </div>
                    <div>
                        <p className="ws-card-label">Avg Inspection Score</p>
                        <h3 className="ws-card-value">{summary?.avgInspectionScore || 0}%</h3>
                    </div>
                </div>
            </div>

            {/* Per-User Breakdown */}
            {isAdmin && userStats?.length > 0 && (
                <div className="ws-section">
                    <h2 className="ws-section-title"><User size={18} /> Per-Person Breakdown</h2>
                    <div className="ws-user-list">
                        {userStats.map(u => (
                            <div key={u.userId} className="ws-user-card">
                                <div
                                    className="ws-user-header"
                                    onClick={() => setExpandedUser(expandedUser === u.userId ? null : u.userId)}
                                >
                                    <div className="ws-user-info">
                                        <div className="ws-avatar">{u.name?.charAt(0)?.toUpperCase()}</div>
                                        <div>
                                            <h4 className="ws-user-name">{u.name}</h4>
                                            <span className="ws-user-role">{u.role?.replace('_', ' ')}</span>
                                        </div>
                                    </div>
                                    <div className="ws-user-quick">
                                        <span className="ws-tag blue">{u.tickets.resolved} tickets</span>
                                        <span className="ws-tag green">{u.inspections.completed} inspections</span>
                                        {expandedUser === u.userId ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </div>
                                </div>
                                {expandedUser === u.userId && (
                                    <div className="ws-user-details">
                                        <div className="ws-detail-grid">
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Tickets Assigned</span>
                                                <span className="ws-detail-value">{u.tickets.assigned}</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Tickets Started</span>
                                                <span className="ws-detail-value">{u.tickets.started}</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Tickets Resolved</span>
                                                <span className="ws-detail-value">{u.tickets.resolved}</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Avg Resolution</span>
                                                <span className="ws-detail-value">{formatHours(u.tickets.avgResolutionHours)}</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Inspections Assigned</span>
                                                <span className="ws-detail-value">{u.inspections.assigned}</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Inspections Completed</span>
                                                <span className="ws-detail-value">{u.inspections.completed}</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Avg Score</span>
                                                <span className="ws-detail-value">{u.inspections.avgScore}%</span>
                                            </div>
                                            <div className="ws-detail-item">
                                                <span className="ws-detail-label">Avg Completion</span>
                                                <span className="ws-detail-value">{formatHours(u.inspections.avgCompletionHours)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Activity Log */}
            <div className="ws-section">
                <div className="ws-section-header">
                    <h2 className="ws-section-title"><Activity size={18} /> Activity Log</h2>
                    <div className="ws-activity-filters">
                        {['all', 'ticket', 'inspection'].map(f => (
                            <button
                                key={f}
                                className={`ws-pill ${activityFilter === f ? 'active' : ''}`}
                                onClick={() => setActivityFilter(f)}
                            >
                                {f === 'all' ? 'All' : f === 'ticket' ? 'Tickets' : 'Inspections'}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredActivity.length === 0 ? (
                    <div className="ws-empty">No activity found for this period.</div>
                ) : (
                    <div className="ws-table-wrap">
                        <table className="ws-table">
                            <thead>
                                <tr>
                                    <th>Person</th>
                                    <th>Type</th>
                                    <th>Title / Location</th>
                                    <th>Started</th>
                                    <th>Completed</th>
                                    <th>Time Taken</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivity.map((a, i) => (
                                    <tr key={`${a.type}-${a.id}-${i}`}>
                                        <td className="ws-td-person">{a.person}</td>
                                        <td>
                                            <span className={`ws-type-badge ${a.type}`}>
                                                {a.type === 'ticket' ? 'Ticket' : 'Inspection'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="ws-td-title">{a.title}</div>
                                            <div className="ws-td-location">{a.locationName}</div>
                                        </td>
                                        <td className="ws-td-date">{formatDateTime(a.startedAt)}</td>
                                        <td className="ws-td-date">{formatDateTime(a.completedAt)}</td>
                                        <td className="ws-td-time">
                                            {a.timeTakenHours !== null ? (
                                                <span className="ws-time-badge">{formatHours(a.timeTakenHours)}</span>
                                            ) : (
                                                <span className="ws-time-pending">In progress</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`ws-status-badge ${a.status}`}>{a.status?.replace('_', ' ')}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .ws-container { padding: 0; }
                .ws-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
                .ws-header h1 { margin: 0 0 4px 0; font-size: 24px; color: var(--text-dark); }
                .ws-subtitle { margin: 0; color: var(--text-muted); font-size: 14px; }
                .ws-date-display { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-muted); background: white; padding: 8px 14px; border-radius: 8px; box-shadow: var(--shadow-sm); }

                .ws-filters { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; background: white; padding: 16px 20px; border-radius: 12px; box-shadow: var(--shadow-sm); align-items: flex-end; }
                .ws-filter-group { display: flex; flex-direction: column; gap: 6px; }
                .ws-filter-label { display: flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .ws-select { padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 13px; background: white; min-width: 180px; cursor: pointer; }
                .ws-select:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }
                .ws-date-btns { display: flex; gap: 4px; flex-wrap: wrap; }
                .ws-date-btn { padding: 6px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 12px; background: white; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
                .ws-date-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }
                .ws-date-btn.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

                .ws-summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
                .ws-card { display: flex; align-items: center; gap: 14px; background: white; padding: 20px; border-radius: 12px; box-shadow: var(--shadow-sm); }
                .ws-card-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
                .ws-card-icon.bg-blue { background: #3b82f6; }
                .ws-card-icon.bg-green { background: #22c55e; }
                .ws-card-icon.bg-orange { background: #f59e0b; }
                .ws-card-icon.bg-purple { background: #8b5cf6; }
                .ws-card-icon.bg-teal { background: #14b8a6; }
                .ws-card-label { margin: 0; font-size: 12px; color: var(--text-muted); font-weight: 500; }
                .ws-card-value { margin: 4px 0 0 0; font-size: 22px; font-weight: 700; color: var(--text-dark); }
                .ws-card-sub { font-size: 14px; font-weight: 400; color: var(--text-muted); margin-left: 2px; }

                .ws-section { background: white; border-radius: 12px; box-shadow: var(--shadow-sm); padding: 24px; margin-bottom: 24px; }
                .ws-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
                .ws-section-title { margin: 0 0 16px 0; font-size: 17px; display: flex; align-items: center; gap: 8px; color: var(--text-dark); }
                .ws-section-header .ws-section-title { margin-bottom: 0; }

                .ws-activity-filters { display: flex; gap: 4px; }
                .ws-pill { padding: 5px 14px; border: 1px solid #e2e8f0; border-radius: 20px; font-size: 12px; background: white; cursor: pointer; transition: all 0.15s; }
                .ws-pill:hover { border-color: var(--primary-color); }
                .ws-pill.active { background: var(--primary-color); color: white; border-color: var(--primary-color); }

                .ws-user-list { display: flex; flex-direction: column; gap: 8px; }
                .ws-user-card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; }
                .ws-user-header { display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; cursor: pointer; transition: background 0.15s; }
                .ws-user-header:hover { background: #f8fafc; }
                .ws-user-info { display: flex; align-items: center; gap: 12px; }
                .ws-avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0; }
                .ws-user-name { margin: 0; font-size: 14px; font-weight: 600; }
                .ws-user-role { font-size: 12px; color: var(--text-muted); text-transform: capitalize; }
                .ws-user-quick { display: flex; align-items: center; gap: 8px; }
                .ws-tag { padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
                .ws-tag.blue { background: #dbeafe; color: #1e40af; }
                .ws-tag.green { background: #dcfce7; color: #166534; }
                .ws-user-details { padding: 0 18px 18px; border-top: 1px solid #f1f5f9; }
                .ws-detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; padding-top: 14px; }
                .ws-detail-item { display: flex; flex-direction: column; gap: 2px; }
                .ws-detail-label { font-size: 11px; color: var(--text-muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.3px; }
                .ws-detail-value { font-size: 16px; font-weight: 700; color: var(--text-dark); }

                .ws-table-wrap { overflow-x: auto; }
                .ws-table { width: 100%; border-collapse: collapse; font-size: 13px; }
                .ws-table th { text-align: left; padding: 10px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); font-weight: 600; border-bottom: 2px solid #f1f5f9; white-space: nowrap; }
                .ws-table td { padding: 12px; border-bottom: 1px solid #f8fafc; vertical-align: middle; }
                .ws-table tbody tr:hover { background: #f8fafc; }
                .ws-td-person { font-weight: 600; white-space: nowrap; }
                .ws-td-title { font-weight: 500; color: var(--text-dark); }
                .ws-td-location { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
                .ws-td-date { font-size: 12px; color: var(--text-muted); white-space: nowrap; }
                .ws-td-time { white-space: nowrap; }
                .ws-time-badge { background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
                .ws-time-pending { color: var(--text-muted); font-style: italic; font-size: 12px; }

                .ws-type-badge { padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
                .ws-type-badge.ticket { background: #fee2e2; color: #991b1b; }
                .ws-type-badge.inspection { background: #dbeafe; color: #1e40af; }

                .ws-status-badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; text-transform: uppercase; font-weight: 600; }
                .ws-status-badge.open { background: #fee2e2; color: #991b1b; }
                .ws-status-badge.in_progress { background: #dbeafe; color: #1e40af; }
                .ws-status-badge.resolved { background: #dcfce7; color: #166534; }
                .ws-status-badge.verified { background: #f3e8ff; color: #7c3aed; }
                .ws-status-badge.pending { background: #fef3c7; color: #92400e; }
                .ws-status-badge.completed { background: #dcfce7; color: #166534; }
                .ws-status-badge.submitted { background: #f3e8ff; color: #7c3aed; }

                .ws-empty { text-align: center; padding: 40px; color: var(--text-muted); font-style: italic; }

                @media (max-width: 768px) {
                    .ws-summary-grid { grid-template-columns: repeat(2, 1fr); }
                    .ws-card { padding: 14px; }
                    .ws-card-value { font-size: 18px; }
                    .ws-filters { flex-direction: column; }
                    .ws-user-quick .ws-tag { display: none; }
                    .ws-detail-grid { grid-template-columns: repeat(2, 1fr); }
                    .ws-table { font-size: 12px; }
                    .ws-table th, .ws-table td { padding: 8px 6px; }
                    .ws-section { padding: 16px; }
                }
            `}</style>
        </div>
    );
};

export default WorkStats;
