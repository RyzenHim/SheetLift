const Task = require('../models/task.model');

// POST /api/tasks/bulk-create
const bulkCreate = async (req, res) => {
    try {
        const { tasks } = req.body;

        if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
            return res.status(400).json({ message: 'Please provide a valid tasks array.' });
        }

        const tasksToInsert = tasks.map((task) => {
            // Safely parse dueDate — if invalid, store null
            let dueDate = null;
            if (task.dueDate) {
                const parsed = new Date(task.dueDate);
                dueDate = isNaN(parsed.getTime()) ? null : parsed;
            }

            return {
                title:       task.title       || '',
                description: task.description || '',
                dueDate,
                completed:   task.completed   || false,
                userId:      req.user._id,
            };
        });

        const saved = await Task.insertMany(tasksToInsert);

        res.status(201).json({
            message: `${saved.length} tasks saved successfully.`,
            count: saved.length,
            tasks: saved,
        });

    } catch (err) {
        console.error('bulkCreate error:', err.message);
        res.status(500).json({ message: 'Error saving tasks: ' + err.message });
    }
};

// GET /api/tasks
// Query params: search, sortOrder (asc|desc), page, limit
const getTasks = async (req, res) => {
    try {
        const { search = '', sortOrder = 'desc', page = 1, limit = 6 } = req.query;

        const pageNum  = parseInt(page);
        const limitNum = parseInt(limit);
        const skip     = (pageNum - 1) * limitNum;

        // Build filter — always filter by logged-in user
        const filter = { userId: req.user._id };

        // If search query exists, search in title and description
        if (search.trim()) {
            filter.$or = [
                { title:       { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
            ];
        }

        // Sort by dueDate — tasks with no dueDate go to the end
        const sortDir = sortOrder === 'asc' ? 1 : -1;
        const sort = { dueDate: sortDir };

        // Run query and count in parallel for efficiency
        const [tasks, total] = await Promise.all([
            Task.find(filter).sort(sort).skip(skip).limit(limitNum),
            Task.countDocuments(filter),
        ]);

        res.json({
            tasks,
            total,
            page:       pageNum,
            totalPages: Math.ceil(total / limitNum),
        });

    } catch (err) {
        console.error('getTasks error:', err.message);
        res.status(500).json({ message: 'Error fetching tasks: ' + err.message });
    }
};

// POST /api/tasks
const createTask = async (req, res) => {
    try {
        const { title, description, dueDate } = req.body;

        if (!title) {
            return res.status(400).json({ message: 'Title is required.' });
        }

        const task = await Task.create({
            title,
            description: description || '',
            dueDate:     dueDate ? new Date(dueDate) : null,
            completed:   false,
            userId:      req.user._id,
        });

        res.status(201).json(task);
    } catch (err) {
        console.error('createTask error:', err.message);
        res.status(500).json({ message: 'Error creating task: ' + err.message });
    }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const task = await Task.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        res.json(task);
    } catch (err) {
        console.error('updateTask error:', err.message);
        res.status(500).json({ message: 'Error updating task: ' + err.message });
    }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

        if (!task) {
            return res.status(404).json({ message: 'Task not found.' });
        }

        res.json({ message: 'Task deleted successfully.' });
    } catch (err) {
        console.error('deleteTask error:', err.message);
        res.status(500).json({ message: 'Error deleting task: ' + err.message });
    }
};

module.exports = { bulkCreate, getTasks, createTask, updateTask, deleteTask };