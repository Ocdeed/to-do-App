import { TaskList } from "../models/TaskList.js";
import { Task } from "../models/Task.js";

export class StorageManager {
  constructor() {
    this.STORAGE_KEY = "taskmaster_data";
  }

  saveLists(lists) {
    const data = lists.map((list) => ({
      id: list.id,
      name: list.name,
      tasks: list.tasks.map((task) => ({
        ...task,
        createdAt: task.createdAt.toISOString(),
      })),
    }));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  getLists() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return null;

      const parsedData = JSON.parse(data);
      return parsedData.map((listData) => {
        const list = new TaskList(listData.name);
        list.id = listData.id;
        list.tasks = listData.tasks.map((taskData) => {
          const task = new Task({
            title: taskData.title,
            description: taskData.description,
            dueDate: taskData.dueDate,
            priority: taskData.priority,
            tags: taskData.tags,
          });
          task.id = taskData.id;
          task.completed = taskData.completed;
          task.createdAt = new Date(taskData.createdAt);
          return task;
        });
        return list;
      });
    } catch (error) {
      console.error("Error loading lists:", error);
      return null;
    }
  }
}
