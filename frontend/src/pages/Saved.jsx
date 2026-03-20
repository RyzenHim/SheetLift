import React, { useState, useEffect } from 'react';
import axios from 'axios';

const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const blankForm = () => ({ title: '', description: '', dueDate: '' });

const Saved = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search, sort, pagination
    const [search, setSearch] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTasks, setTotalTasks] = useState(0);
    const limit = 6;

    // Inline edit state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState(blankForm());

    // Add task modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState(blankForm());
    const [addLoading, setAddLoading] = useState(false);

    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/login';
    };

    // ── Fetch tasks from backend ─────────────────────────────────────────────
    const fetchTasks = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get('http://localhost:5000/api/tasks', {
                ...authHeader(),
                params: { search, sortOrder, page, limit },
            });
            setTasks(data.tasks);
            setTotalPages(data.totalPages);
            setTotalTasks(data.total);
        } catch (err) {
            setError('Failed to load tasks. Make sure you are logged in.');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, [search, sortOrder, page]);

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleSort = (order) => {
        setSortOrder(order);
        setPage(1);
    };

    // ── Add task ─────────────────────────────────────────────────────────────
    const handleAdd = async (e) => {
        e.preventDefault();
        if (!addForm.title.trim()) return;
        setAddLoading(true);
        try {
            await axios.post('http://localhost:5000/api/tasks', addForm, authHeader());
            setAddForm(blankForm());
            setShowAddModal(false);
            setPage(1);
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add task.');
        }
        setAddLoading(false);
    };

    // ── Start inline edit ────────────────────────────────────────────────────
    const startEdit = (task) => {
        setEditingId(task._id);
        setEditForm({
            title: task.title,
            description: task.description || '',
            dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
        });
    };

    // ── Save inline edit ─────────────────────────────────────────────────────
    const saveEdit = async (taskId) => {
        try {
            await axios.put(
                `http://localhost:5000/api/tasks/${taskId}`,
                editForm,
                authHeader()
            );
            setEditingId(null);
            fetchTasks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update task.');
        }
    };

    // ── Toggle completed ─────────────────────────────────────────────────────
    const toggleDone = async (task) => {
        try {
            await axios.put(
                `http://localhost:5000/api/tasks/${task._id}`,
                { completed: !task.completed },
                authHeader()
            );
            fetchTasks();
        } catch (err) {
            setError('Failed to update task status.');
        }
    };

    // ── Delete task ──────────────────────────────────────────────────────────
    const deleteTask = async (taskId) => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await axios.delete(
                `http://localhost:5000/api/tasks/${taskId}`,
                authHeader()
            );
            // If last item on page > 1, go back one page
            if (tasks.length === 1 && page > 1) setPage((p) => p - 1);
            else fetchTasks();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete task.');
        }
    };

    const fmtDate = (d) => {
        if (!d) return '—';
        try { return new Date(d).toLocaleDateString(); } catch { return d; }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">

            {/* Nav */}
            <nav className="bg-white shadow-lg rounded-2xl p-6 mb-8 max-w-6xl mx-auto flex justify-between items-center">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    SheetLift — Saved Data
                </h1>
                <div className="flex gap-4">
                    <a href="/landing" className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all">
                        ← Back
                    </a>
                    <button onClick={logout} className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto bg-white shadow-2xl rounded-3xl p-8">

                {/* Header row */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Saved Tasks {!loading && `(${totalTasks})`}
                    </h2>
                    <div className="flex gap-3 flex-wrap items-center">
                        {/* Search */}
                        <input
                            type="text"
                            value={search}
                            onChange={handleSearch}
                            placeholder="Search title or description…"
                            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm w-60"
                        />
                        {/* Sort */}
                        <button
                            onClick={() => handleSort('asc')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${sortOrder === 'asc' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}
                        >
                            Date ↑
                        </button>
                        <button
                            onClick={() => handleSort('desc')}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${sortOrder === 'desc' ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}
                        >
                            Date ↓
                        </button>
                        {/* Add task button */}
                        <button
                            onClick={() => { setAddForm(blankForm()); setShowAddModal(true); }}
                            className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 transition-all"
                        >
                            + Add Task
                        </button>
                    </div>
                </div>

                {error && <p className="text-red-500 text-center mb-4 font-medium text-sm">{error}</p>}

                {loading ? (
                    <div className="text-center py-20 text-gray-400 text-lg">Loading…</div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-20">
                        <p className="text-xl text-gray-400 mb-4">
                            {search ? `No tasks found for "${search}"` : 'No saved tasks yet.'}
                        </p>
                        {!search && (
                            <a href="/landing" className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg">
                                Go Load from Sheets
                            </a>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto text-sm">
                                <thead>
                                    <tr className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                        <th className="px-5 py-3 text-left rounded-tl-xl font-bold">#</th>
                                        <th className="px-5 py-3 text-left font-bold">Title</th>
                                        <th className="px-5 py-3 text-left font-bold">Description</th>
                                        <th className="px-5 py-3 text-left font-bold">Due Date</th>
                                        <th className="px-5 py-3 text-left font-bold">Status</th>
                                        <th className="px-5 py-3 text-left rounded-tr-xl font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tasks.map((task, index) => {
                                        const isEditing = editingId === task._id;
                                        return (
                                            <tr key={task._id} className="border-b hover:bg-purple-50 transition-colors">
                                                <td className="px-5 py-3 text-gray-400">
                                                    {(page - 1) * limit + index + 1}
                                                </td>

                                                {isEditing ? (
                                                    <>
                                                        <td className="px-5 py-3">
                                                            <input
                                                                value={editForm.title}
                                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-300 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <input
                                                                value={editForm.description}
                                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-300 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <input
                                                                type="date"
                                                                value={editForm.dueDate}
                                                                onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                                                                className="p-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-300 outline-none"
                                                            />
                                                        </td>
                                                        <td className="px-5 py-3 text-gray-400 text-xs">—</td>
                                                        <td className="px-5 py-3">
                                                            <button onClick={() => saveEdit(task._id)} className="mr-1 px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs font-semibold">Save</button>
                                                            <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-400 text-white rounded-lg hover:bg-gray-500 text-xs font-semibold">Cancel</button>
                                                        </td>
                                                    </>
                                                ) : (
                                                    <>
                                                        <td className="px-5 py-3 font-semibold text-gray-800">{task.title}</td>
                                                        <td className="px-5 py-3 text-gray-500 max-w-xs truncate">{task.description || '—'}</td>
                                                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmtDate(task.dueDate)}</td>
                                                        <td className="px-5 py-3">
                                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.completed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                                {task.completed ? '✓ Done' : 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-3">
                                                            <button onClick={() => toggleDone(task)} className="mr-1 px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-xs font-semibold">
                                                                {task.completed ? 'Undo' : '✓ Done'}
                                                            </button>
                                                            <button onClick={() => startEdit(task)} className="mr-1 px-3 py-1 bg-yellow-400 text-white rounded-lg hover:bg-yellow-500 text-xs font-semibold">Edit</button>
                                                            <button onClick={() => deleteTask(task._id)} className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-xs font-semibold">Delete</button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex justify-between items-center mt-6 flex-wrap gap-4">
                            <p className="text-sm text-gray-500">
                                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalTasks)} of {totalTasks} tasks
                            </p>
                            <div className="flex gap-2 items-center flex-wrap">
                                <button
                                    onClick={() => setPage((p) => p - 1)}
                                    disabled={page === 1}
                                    className="px-4 py-2 rounded-xl border text-sm font-semibold bg-white text-gray-600 hover:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    ← Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${p === page ? 'bg-purple-500 text-white border-purple-500' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-400'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage((p) => p + 1)}
                                    disabled={page === totalPages}
                                    className="px-4 py-2 rounded-xl border text-sm font-semibold bg-white text-gray-600 hover:border-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                >
                                    Next →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Add Task Modal */}
            {showAddModal && (
                <div
                    className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
                    onClick={() => setShowAddModal(false)}
                >
                    <div
                        className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Add New Task</h3>
                        <form onSubmit={handleAdd}>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={addForm.title}
                                    onChange={(e) => setAddForm({ ...addForm, title: e.target.value })}
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                                    placeholder="Task title"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={addForm.description}
                                    onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                                    placeholder="Task description"
                                />
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    value={addForm.dueDate}
                                    onChange={(e) => setAddForm({ ...addForm, dueDate: e.target.value })}
                                    className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-purple-300 outline-none text-sm"
                                />
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={addLoading}
                                    className="px-5 py-2 bg-purple-500 text-white rounded-xl text-sm font-semibold hover:bg-purple-600 disabled:opacity-60 transition-all"
                                >
                                    {addLoading ? 'Saving…' : 'Add Task'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Saved;