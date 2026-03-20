const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const taskController = require('../controllers/task.controller');

router.post('/tasks/bulk-create', authenticate, taskController.bulkCreate);
router.get('/tasks',              authenticate, taskController.getTasks);
router.post('/tasks',             authenticate, taskController.createTask);
router.put('/tasks/:id',          authenticate, taskController.updateTask);
router.delete('/tasks/:id',       authenticate, taskController.deleteTask);

module.exports = router;