import React, { useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';

// Attaches the JWT token to every backend request
const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const Landing = () => {
    const [csvUrl, setCsvUrl] = useState('');
    const [csvTasks, setCsvTasks] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savingAll, setSavingAll] = useState(false);
    const [error, setError] = useState('');

    const [addForm, setAddForm] = useState({ title: '', description: '', dueDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', description: '', dueDate: '' });

    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // ── Load Google Sheet CSV ───────────────────────────────────────────────
    const loadSheet = () => {
        if (!csvUrl.trim()) {
            setError('Please paste a Google Sheets CSV link first.');
            return;
        }
        setLoading(true);
        setError('');

        Papa.parse(csvUrl, {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: ({ data }) => {
                const tasks = data.map((row) => ({
                    tempId: Date.now() + Math.random(),
                    title: row['title'] || row['Title'] || '',
                    description: row['description'] || row['Description'] || '',
                    dueDate: row['dueDate'] || row['due date'] || row['Due Date'] || row['due_date'] || '',
                    completed: false,
                })).filter((t) => t.title.trim() !== '');

                if (tasks.length === 0) {
                    setError('No valid rows found. Make sure your sheet has title, description, dueDate columns.');
                } else {
                    setCsvTasks(tasks);
                    setAllTasks(tasks);
                    setCsvUrl('');
                }
                setLoading(false);
            },
            error: (err) => {
                setError('Failed to load CSV: ' + err.message);
                setLoading(false);
            },
        });
    };

    // ── Save all tasks to DB ────────────────────────────────────────────────
    const saveAllToDb = async () => {
        if (allTasks.length === 0) {
            setError('No tasks to save.');
            return;
        }
        setSavingAll(true);
        try {
            await axios.post(
                'http://localhost:5000/api/tasks/bulk-create',
                { tasks: allTasks },
                authHeader()
            );
            setCsvTasks([]);
            setAllTasks([]);
            setError('');
            alert('All tasks saved! Go to Saved Data to see them.');
        } catch (err) {
            setError(err.response?.data?.message || 'Save failed. Make sure you are logged in.');
        }
        setSavingAll(false);
    };

    // ── Add new task manually ───────────────────────────────────────────────
    const addTask = (e) => {
        e.preventDefault();
        if (!addForm.title.trim()) return;
        setAllTasks([{ tempId: Date.now() + Math.random(), ...addForm, completed: false }, ...allTasks]);
        setAddForm({ title: '', description: '', dueDate: '' });
    };

    // ── Inline edit ─────────────────────────────────────────────────────────
    const startEdit = (task) => {
        setEditingId(task._id || task.tempId);
        setEditForm({
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        });
    };

    const saveEdit = (rowId) => {
        setAllTasks(allTasks.map((t) =>
            (t._id === rowId || t.tempId === rowId) ? { ...t, ...editForm } : t
        ));
        setEditingId(null);
    };

    // ── Delete ──────────────────────────────────────────────────────────────
    const deleteTask = (rowId) => {
        if (!window.confirm('Delete this task?')) return;
        setAllTasks(allTasks.filter((t) => t._id !== rowId && t.tempId !== rowId));
    };

    // ── Toggle complete ─────────────────────────────────────────────────────
    const toggleDone = (rowId) => {
        setAllTasks(allTasks.map((t) =>
            (t._id === rowId || t.tempId === rowId) ? { ...t, completed: !t.completed } : t
        ));
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString(); } catch { return d; }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-8">

            {/* Nav */}
            <nav className="bg-white shadow-lg rounded-2xl p-6 mb-8 max-w-6xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    SheetLift
                </h1>
                <div className="flex gap-4">
                    <a href="/saved" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
                        Saved Data
                    </a>
                    <button onClick={logout} className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto">

                {/* Import Card */}
                <div className="bg-white shadow-xl rounded-3xl p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Load Google Sheets</h2>
                    <p className="text-gray-500 text-sm mb-6">
                        Publish your sheet as CSV (File → Share → Publish to web → CSV) and paste the link below.
                    </p>
                    <div className="flex gap-4 flex-wrap">
                        <input
                            type="url"
                            value={csvUrl}
                            onChange={(e) => setCsvUrl(e.target.value)}
                            placeholder="Paste Google Sheets CSV link  (…pub?output=csv)"
                            className="flex-1 min-w-64 px-5 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 shadow-sm text-sm"
                        />
                        <button
                            onClick={loadSheet}
                            disabled={loading}
                            className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg transition-all whitespace-nowrap"
                        >
                            {loading ? 'Loading…' : 'Load Data'}
                        </button>
                    </div>
                    {csvTasks.length > 0 && (
                        <p className="mt-4 text-green-700 font-medium text-sm">
                            ✅ {csvTasks.length} tasks loaded — edit below, then save to DB.
                        </p>
                    )}
                    {error && <p className="mt-4 text-red-500 text-sm font-medium">{error}</p>}
                </div>

                {/* Tasks Card */}
                <div className="bg-white shadow-xl rounded-3xl p-8">
                    <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                        <h2 className="text-2xl font-bold text-gray-800">Tasks ({allTasks.length})</h2>
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={saveAllToDb}
                                disabled={savingAll || allTasks.length === 0}
                                className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white font-bold rounded-xl hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
                            >
                                {savingAll ? 'Saving…' : 'Save All to DB'}
                            </button>
                            <button
                                onClick={() => { setCsvTasks([]); setAllTasks([]); }}
                                className="px-6 py-2 bg-gray-400 text-white font-bold rounded-xl hover:bg-gray-500 transition-all"
                            >
                                Clear
                            </button>
                        </div>
                    </div>

                    {/* Add Task Form */}
                    <form onSubmit={addTask} className="bg-blue-50 rounded-2xl p-6 mb-8">
                        <h3 className="text-lg font-bold text-blue-800 mb-4">Add New Task Manually</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                placeholder="Title *"
                                value={addForm.title}
                                onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                                required
                            />
                            <input
                                placeholder="Description"
                                value={addForm.description}
                                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                                className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                            />
                            <input
                                type="date"
                                value={addForm.dueDate}
                                onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                                className="p-3 border rounded-xl focus:ring-2 focus:ring-blue-400 outline-none text-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="mt-4 px-6 py-2 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-all"
                        >
                            + Add Task
                        </button>
                    </form>

                    {/* Tasks Table */}
                    {allTasks.length === 0 ? (
                        <p className="text-center text-gray-400 py-16 text-lg">
                            No tasks yet. Load from a sheet or add one manually.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                                        <th className="px-5 py-3 text-left rounded-tl-xl">Title</th>
                                        <th className="px-5 py-3 text-left">Description</th>
                                        <th className="px-5 py-3 text-left">Due Date</th>
                                        <th className="px-5 py-3 text-left">Status</th>
                                        <th className="px-5 py-3 text-left rounded-tr-xl">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allTasks.map((task) => {
                                        const rowId = task._id || task.tempId;
                                        const isEditing = editingId === rowId;
                                        return (
                                            <tr key={rowId} className="border-b hover:bg-gray-50 transition-colors">
                                                {isEditing ? (
                                                    <>
                                                        <td className="px-5 py-3">
                                                            <input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <input value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full p-2 border rounded-lg text-sm" />
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <input type="date" value={editForm.dueDate} onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })} className="p-2 border rounded-lg text-sm" />
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-400 text-xs">—</td>
                                                        <td className="px-5 py-3 flex gap-2">
                                                            <button onClick={() => saveEdit(rowId)} className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-semibold">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-xs font-semibold">Cancel</button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-5 py-3 font-semibold text-gray-800">{task.title}</td>
                                                        <td className="px-5 py-3 text-gray-600">{task.description || '—'}</td>
                                                        <td className="px-5 py-3 text-gray-500">{fmtDate(task.dueDate)}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {task.completed ? '✓ Done' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <button onClick={() => toggleDone(rowId)} className="mr-1 px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-xs font-semibold">
                                                                {task.completed ? 'Undo' : '✓ Done'}
                                                            </button>
                                                            <button onClick={() => startEdit(task)} className="mr-1 px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 text-xs font-semibold">Edit</button>
                                                            <button onClick={() => deleteTask(rowId)} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold">Delete</button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Landing;