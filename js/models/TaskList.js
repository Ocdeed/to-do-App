export class TaskList {
  constructor(name, icon = "fa-list-ul", color = "#4a90e2") {
    this.id = Date.now().toString();
    this.name = name;
    this.tasks = [];
    this.icon = icon;
    this.color = color;
    this.createdAt = new Date();
  }

  addTask(task) {
    if (!task || !task.title) {
      throw new Error("Invalid task data");
    }
    this.tasks.push(task);
  }

  removeTask(taskId) {
    this.tasks = this.tasks.filter((task) => task.id !== taskId);
  }

  getTask(taskId) {
    return this.tasks.find((task) => task.id === taskId);
  }

  updateTask(taskId, data) {
    const task = this.getTask(taskId);
    if (task) {
      task.update(data);
    }
  }

  sortTasks(criteria) {
    const sortFunctions = {
      title: (a, b) => a.title.localeCompare(b.title),
      dueDate: (a, b) =>
        new Date(a.dueDate || "9999") - new Date(b.dueDate || "9999"),
      priority: (a, b) => {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      },
      created: (a, b) => b.createdAt - a.createdAt,
      startTime: (a, b) => (a.startTime || "").localeCompare(b.startTime || ""),
    };

    if (sortFunctions[criteria]) {
      this.tasks.sort(sortFunctions[criteria]);
    }
    return this.tasks;
  }

  filterTasks(filters) {
    return this.tasks.filter((task) => {
      if (filters.priority && task.priority !== filters.priority) return false;
      if (
        filters.completed !== undefined &&
        task.completed !== filters.completed
      )
        return false;
      if (filters.dueDate) {
        const today = new Date().setHours(0, 0, 0, 0);
        const taskDate = new Date(task.dueDate).setHours(0, 0, 0, 0);

        switch (filters.dueDate) {
          case "today":
            return taskDate === today;
          case "upcoming":
            return taskDate > today;
          case "overdue":
            return taskDate < today;
        }
      }
      if (filters.tags && filters.tags.length > 0) {
        return filters.tags.some((tag) => task.tags.includes(tag));
      }
      return true;
    });
  }

  searchTasks(query) {
    if (!query) return this.tasks;

    const searchTerms = query.toLowerCase().split(" ");
    return this.tasks.filter((task) => {
      const searchableContent = `
        ${task.title} ${task.description} 
        ${task.tags.join(" ")} ${task.priority}
      `.toLowerCase();

      return searchTerms.every((term) => searchableContent.includes(term));
    });
  }

  editTask(taskId, newData) {
    const task = this.getTask(taskId);
    if (!task) {
      throw new Error("Task not found");
    }
    Object.assign(task, newData);
    return task;
  }

  deleteTask(taskId) {
    const taskIndex = this.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex === -1) {
      throw new Error("Task not found");
    }
    const [deletedTask] = this.tasks.splice(taskIndex, 1);
    return deletedTask;
  }
}
