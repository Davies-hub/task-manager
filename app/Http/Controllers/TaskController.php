<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    // Endpoint 1: Create Task
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'    => 'required|string',
            'due_date' => 'required|date|after_or_equal:today',
            'priority' => 'required|in:low,medium,high',
        ]);

        $exists = Task::where('title', $validated['title'])
                      ->where('due_date', $validated['due_date'])
                      ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'A task with this title already exists for the given due date.'
            ], 422);
        }

        $task = Task::create($validated);
        return response()->json($task, 201);
    }

    // Endpoint 2: List Tasks
    public function index(Request $request)
    {
        $query = Task::query();

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Sort by priority (high -> medium -> low), then due_date ascending
        $tasks = $query->orderByRaw("FIELD(priority, 'high', 'medium', 'low')")
                       ->orderBy('due_date', 'asc')
                       ->get();

        if ($tasks->isEmpty()) {
            return response()->json(['message' => 'No tasks found.'], 200);
        }

        return response()->json($tasks, 200);
    }

    // Endpoint 3: Update Task Status
    public function updateStatus(Request $request, $id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        $request->validate([
            'status' => 'required|in:pending,in_progress,done'
        ]);

        // Define the allowed progressions
        $allowed = [
            'pending'     => 'in_progress',
            'in_progress' => 'done',
        ];

        $newStatus = $request->status;
        $currentStatus = $task->status;

        // Check if the transition is valid
        if (!isset($allowed[$currentStatus]) || $allowed[$currentStatus] !== $newStatus) {
            return response()->json([
                'message' => "Cannot change status from '{$currentStatus}' to '{$newStatus}'. Status can only move: pending → in_progress → done."
            ], 422);
        }

        $task->status = $newStatus;
        $task->save();

        return response()->json($task, 200);
    }

    // Endpoint 4: Delete Task
    public function destroy($id)
    {
        $task = Task::find($id);

        if (!$task) {
            return response()->json(['message' => 'Task not found.'], 404);
        }

        if ($task->status !== 'done') {
            return response()->json([
                'message' => 'Only completed tasks can be deleted.'
            ], 403);
        }

        $task->delete();
        return response()->json(['message' => 'Task deleted successfully.'], 200);
    }

    // Endpoint 5 (Bonus): Daily Report
    public function report(Request $request)
    {
        $request->validate([
            'date' => 'required|date'
        ]);

        $date = $request->date;
        $priorities = ['high', 'medium', 'low'];
        $statuses = ['pending', 'in_progress', 'done'];

        $summary = [];

        foreach ($priorities as $priority) {
            foreach ($statuses as $status) {
                $count = Task::where('priority', $priority)
                             ->where('status', $status)
                             ->whereDate('due_date', $date)
                             ->count();
                $summary[$priority][$status] = $count;
            }
        }

        return response()->json([
            'date'    => $date,
            'summary' => $summary
        ], 200);
    }
}