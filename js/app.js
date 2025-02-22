import { TaskList } from "./models/TaskList.js";
import { Task } from "./models/Task.js";
import { StorageManager } from "./utils/StorageManager.js";
import { UIManager } from "./utils/UIManager.js";
import { DragAndDrop } from "./utils/DragAndDrop.js";

class App {
  constructor() {
    this.storage = new StorageManager();
    this.initializeLists();
    this.ui = new UIManager();
    this.dragAndDrop = new DragAndDrop();

    // Initialize theme
    this.initializeTheme();
    this.initializeApp();
  }

  initializeLists() {
    const savedLists = this.storage.getLists();
    if (savedLists && savedLists.length > 0) {
      this.lists = savedLists;
    } else {
      this.lists = [new TaskList("Default List")];
    }
    this.currentList = this.lists[0];
    this.storage.saveLists(this.lists);
  }

  addTask(taskData) {
    const task = new Task(taskData);
    if (!this.currentList) {
      throw new Error("No active list available");
    }
    this.currentList.addTask(task);
    this.storage.saveLists(this.lists);
    this.ui.renderTasks(this.currentList.tasks);
    return task;
  }

  initializeApp() {
    this.setupEventListeners();
    this.ui.renderLists(this.lists);
    this.ui.renderTasks(this.currentList.tasks);
    this.dragAndDrop.initialize();
  }

  initializeTheme() {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.body.dataset.theme = savedTheme;
    this.ui.updateThemeToggle(savedTheme === "dark");
  }

  setupEventListeners() {
    // Task Creation
    document.getElementById("addTaskBtn").addEventListener("click", () => {
      this.ui.showTaskModal();
    });

    // Form submission
    document
      .getElementById("taskForm")
      .addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          const taskData = this.ui.getTaskFormData();
          const taskId = this.ui.editingTaskId;

          if (taskId) {
            // Editing existing task
            const updatedTask = this.currentList.editTask(taskId, taskData);
            this.ui.hideTaskModal();
            this.ui.showNotification(
              `Task "${updatedTask.title}" updated successfully! 📝`
            );
          } else {
            // Creating new task
            const newTask = await this.addTask(taskData);
            this.ui.hideTaskModal();
            this.ui.showNotification(
              `Task "${newTask.title}" created successfully! 🎉`
            );
          }

          this.storage.saveLists(this.lists);
          this.ui.renderTasks(this.currentList.tasks);
        } catch (error) {
          this.ui.showNotification(error.message, "error");
        }
      });

    // Theme Toggle
    document.getElementById("themeToggleBtn").addEventListener("click", () => {
      const isDark = document.body.dataset.theme === "dark";
      const newTheme = isDark ? "light" : "dark";

      // Animate theme change
      document.body.style.transition = "background-color 0.3s ease";
      document.body.dataset.theme = newTheme;
      localStorage.setItem("theme", newTheme);

      // Update UI
      this.ui.updateThemeToggle(!isDark);
      this.ui.showNotification(
        `${
          newTheme.charAt(0).toUpperCase() + newTheme.slice(1)
        } theme activated! 🎨`
      );
    });

    // Modal Close
    document.getElementById("cancelTaskBtn").addEventListener("click", (e) => {
      e.preventDefault();
      this.ui.hideTaskModal();
    });

    // Close modal on outside click
    document.getElementById("taskModal").addEventListener("click", (e) => {
      if (e.target.id === "taskModal") {
        this.ui.hideTaskModal();
      }
    });

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.ui.hideTaskModal();
      }
      if (e.ctrlKey && e.key === "n") {
        e.preventDefault();
        this.ui.showTaskModal();
      }
    });

    // Edit task
    document.getElementById("tasksContainer").addEventListener("click", (e) => {
      const editBtn = e.target.closest(".edit-task");
      const deleteBtn = e.target.closest(".delete-task");

      if (editBtn) {
        const taskId = editBtn.dataset.taskId;
        const task = this.currentList.getTask(taskId);
        if (task) {
          this.ui.showTaskModal(task);
        }
      }

      if (deleteBtn) {
        const taskId = deleteBtn.dataset.taskId;
        this.ui.showConfirmDialog(
          "Delete Task",
          "Are you sure you want to delete this task?",
          () => this.deleteTask(taskId)
        );
      }
    });

    // Search functionality
    let searchTimeout;
    document.getElementById("searchInput").addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const searchResults = this.currentList.searchTasks(e.target.value);
        this.ui.renderTasks(searchResults);
      }, 300);
    });

    // Sort functionality
    document.getElementById("sortMenu").addEventListener("click", (e) => {
      const sortButton = e.target.closest("[data-sort]");
      if (!sortButton) return;

      const criteria = sortButton.dataset.sort;
      this.currentList.sortTasks(criteria);
      this.ui.renderTasks(this.currentList.tasks);
      this.ui.showNotification(`Tasks sorted by ${criteria} 📋`);
    });

    // Filter functionality
    let activeFilters = {};
    document.getElementById("filterMenu").addEventListener("click", (e) => {
      const filterBtn = e.target.closest("[data-filter]");
      if (!filterBtn) return;

      const { filter, value } = filterBtn.dataset;

      // Toggle filter
      if (activeFilters[filter] === value) {
        delete activeFilters[filter];
        filterBtn.classList.remove("active");
      } else {
        activeFilters[filter] = value;
        filterBtn.classList.add("active");
      }

      const filteredTasks = this.currentList.filterTasks(activeFilters);
      this.ui.renderTasks(filteredTasks);
    });

    // View toggle
    document.getElementById("viewToggleBtn").addEventListener("click", () => {
      const container = document.getElementById("tasksContainer");
      container.classList.toggle("list-view");
      const icon = document.getElementById("viewToggleBtn").querySelector("i");
      icon.classList.toggle("fa-th-list");
      icon.classList.toggle("fa-th-large");
    });

    // Sidebar list selection
    document.getElementById("listsContainer").addEventListener("click", (e) => {
      const listItem = e.target.closest(".list-item");
      if (!listItem) return;

      const listId = listItem.dataset.listId;
      this.currentList = this.lists.find((list) => list.id === listId);
      this.ui.renderTasks(this.currentList.tasks);
      this.ui.renderLists(this.lists); // Re-render to update active state
    });

    // New List Creation
    document.getElementById("newListBtn").addEventListener("click", () => {
      this.ui.showListModal();
    });

    document.getElementById("listForm").addEventListener("submit", (e) => {
      e.preventDefault();
      try {
        const listData = this.ui.getListFormData();
        const newList = new TaskList(
          listData.name,
          listData.icon,
          listData.color
        );

        this.lists.push(newList);
        this.storage.saveLists(this.lists);
        this.ui.renderLists(this.lists);
        this.ui.hideListModal();

        this.ui.showNotification(
          `List "${listData.name}" created successfully! 📝`
        );
      } catch (error) {
        this.ui.showNotification(error.message, "error");
      }
    });

    document.getElementById("cancelListBtn").addEventListener("click", () => {
      this.ui.hideListModal();
    });

    // List deletion
    document.getElementById("listsContainer").addEventListener("click", (e) => {
      const deleteBtn = e.target.closest(".delete-list-btn");
      if (!deleteBtn) return;

      const listItem = deleteBtn.closest(".list-item");
      const listId = listItem.dataset.listId;
      const listToDelete = this.lists.find((list) => list.id === listId);

      if (listToDelete.name === "Default List") return;

      this.ui.showDeleteConfirmation(listToDelete, () => {
        // Add deleting animation
        listItem.classList.add("deleting");

        // Wait for animation
        setTimeout(() => {
          // Remove list
          this.lists = this.lists.filter((list) => list.id !== listId);

          // If deleted list was current, switch to default
          if (this.currentList.id === listId) {
            this.currentList = this.lists.find(
              (list) => list.name === "Default List"
            );
            this.ui.renderTasks(this.currentList.tasks);
          }

          this.storage.saveLists(this.lists);
          this.ui.renderLists(this.lists);

          // Show success notification
          this.ui.showNotification(
            `List "${listToDelete.name}" deleted successfully! 🗑️`
          );

          // If list had tasks, show transfer option
          if (listToDelete.tasks.length > 0) {
            this.offerTaskTransfer(listToDelete);
          }
        }, 300);
      });
    });

    // Mobile menu handling
    const mobileToggle = document.querySelector(".mobile-toggle");
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".mobile-overlay");

    mobileToggle?.addEventListener("click", () => {
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
      document.body.style.overflow = sidebar.classList.contains("active")
        ? "hidden"
        : "";
    });

    overlay?.addEventListener("click", () => {
      sidebar.classList.remove("active");
      overlay.classList.remove("active");
      document.body.style.overflow = "";
    });

    // Close mobile menu on list selection
    document.getElementById("listsContainer").addEventListener("click", (e) => {
      if (window.innerWidth < 768 && e.target.closest(".list-item")) {
        sidebar.classList.remove("active");
        overlay.classList.remove("active");
        document.body.style.overflow = "";
      }
    });

    // Handle orientation change
    window.addEventListener("orientationchange", () => {
      this.handleOrientationChange();
    });

    // Handle resize for desktop/mobile transitions
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.handleResize();
      }, 250);
    });
  }

  handleOrientationChange() {
    const modal = document.querySelector(".modal.visible");
    if (modal) {
      modal.style.height = `${window.innerHeight}px`;
    }
  }

  handleResize() {
    const sidebar = document.querySelector(".sidebar");
    const overlay = document.querySelector(".mobile-overlay");

    if (window.innerWidth >= 768) {
      sidebar?.classList.remove("active");
      overlay?.classList.remove("active");
      document.body.style.overflow = "";
    }
  }

  offerTaskTransfer(deletedList) {
    const transferDialog = document.createElement("div");
    transferDialog.className = "modal transfer-dialog visible";
    transferDialog.innerHTML = `
        <div class="modal-content">
            <h3>Transfer Tasks?</h3>
            <p>Would you like to transfer the tasks from "${
              deletedList.name
            }" to another list?</p>
            <div class="list-selector">
                <select id="transferList">
                    ${this.lists
                      .filter((list) => list.name !== "Default List")
                      .map(
                        (list) => `
                            <option value="${list.id}">${list.name}</option>
                        `
                      )
                      .join("")}
                </select>
            </div>
            <div class="modal-buttons">
                <button class="skip-btn">No, Delete Tasks</button>
                <button class="transfer-btn">Yes, Transfer Tasks</button>
            </div>
        </div>
    `;

    document.body.appendChild(transferDialog);

    const handleClose = () => {
      transferDialog.classList.remove("visible");
      setTimeout(() => transferDialog.remove(), 300);
    };

    transferDialog
      .querySelector(".skip-btn")
      .addEventListener("click", handleClose);
    transferDialog
      .querySelector(".transfer-btn")
      .addEventListener("click", () => {
        const targetListId = document.getElementById("transferList").value;
        const targetList = this.lists.find((list) => list.id === targetListId);

        if (targetList) {
          deletedList.tasks.forEach((task) => targetList.addTask(task));
          this.storage.saveLists(this.lists);
          this.ui.renderLists(this.lists);
          this.ui.showNotification(
            `Tasks transferred to "${targetList.name}" successfully! 📦`
          );
        }

        handleClose();
      });
  }

  deleteTask(taskId) {
    try {
      const deletedTask = this.currentList.deleteTask(taskId);
      this.storage.saveLists(this.lists);
      this.ui.renderTasks(this.currentList.tasks);
      this.ui.showNotification(
        `Task "${deletedTask.title}" deleted successfully! 🗑️`
      );
    } catch (error) {
      this.ui.showNotification(error.message, "error");
    }
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
