export class UIManager {
  constructor(app) {
    this.app = window.app; // Store reference to the App instance
    this.taskModal = document.getElementById("taskModal");
    this.taskForm = document.getElementById("taskForm");
    this.tasksContainer = document.getElementById("tasksContainer");
    this.listsContainer = document.getElementById("listsContainer");
    this.setupNotificationSystem();
    this.setupModalHandling();
    this.editingTaskId = null;
    this.setupListModal();
  }

  setupNotificationSystem() {
    this.notificationContainer = document.createElement("div");
    this.notificationContainer.className = "notification-container";
    document.body.appendChild(this.notificationContainer);
  }

  setupModalHandling() {
    this.taskModal = document.getElementById("taskModal");
    this.taskForm = document.getElementById("taskForm");

    // Close modal on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.taskModal.classList.contains("visible")) {
        this.hideTaskModal();
      }
    });

    // Close modal on outside click
    this.taskModal.addEventListener("click", (e) => {
      if (e.target === this.taskModal) {
        this.hideTaskModal();
      }
    });

    // Prevent modal content clicks from closing
    this.taskModal
      .querySelector(".modal-content")
      .addEventListener("click", (e) => {
        e.stopPropagation();
      });
  }

  setupListModal() {
    // Character counter
    const listNameInput = document.getElementById("listName");
    const charCount = document.querySelector(".character-count");

    listNameInput.addEventListener("input", (e) => {
      const count = e.target.value.length;
      charCount.textContent = `${count}/50`;
      charCount.style.color = count >= 40 ? "#e74c3c" : "inherit";
    });

    // Icon selection
    document.querySelectorAll(".icon-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelector(".icon-option.active")
          ?.classList.remove("active");
        btn.classList.add("active");
      });
    });

    // Color selection
    document.querySelectorAll(".color-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelector(".color-option.active")
          ?.classList.remove("active");
        btn.classList.add("active");
      });
    });
  }

  showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${
              type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
            }"></i>
            <span>${message}</span>
        </div>
    `;

    this.notificationContainer.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add("show");
    });

    // Remove after delay
    setTimeout(() => {
      notification.classList.add("hide");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  updateThemeToggle(isDark) {
    const toggleBtn = document.getElementById("themeToggleBtn");
    const toggleText = toggleBtn.querySelector(".toggle-text");
    toggleText.textContent = isDark ? "Light Mode" : "Dark Mode";

    // Update icons
    const sunIcon = toggleBtn.querySelector(".sun-icon");
    const moonIcon = toggleBtn.querySelector(".moon-icon");

    if (isDark) {
      sunIcon.style.opacity = "1";
      moonIcon.style.opacity = "0";
    } else {
      sunIcon.style.opacity = "0";
      moonIcon.style.opacity = "1";
    }
  }

  renderTasks(tasks = []) {
    if (!Array.isArray(tasks)) {
      console.error("Invalid tasks array:", tasks);
      tasks = [];
    }

    if (!this.tasksContainer) {
      console.error("Tasks container not found");
      return;
    }

    this.tasksContainer.innerHTML = tasks
      .map((task) => this.createTaskElement(task))
      .join("");
  }

  renderLists(lists = []) {
    if (!Array.isArray(lists)) {
      console.error("Invalid lists array:", lists);
      lists = [];
    }

    if (!this.listsContainer) {
      console.error("Lists container not found");
      return;
    }

    this.listsContainer.innerHTML = lists
      .map((list) => this.createListElement(list))
      .join("");
  }

  createTaskElement(task) {
    const priorityColors = {
      high: "#e74c3c",
      medium: "#f39c12",
      low: "#27ae60",
    };

    const timeStatus = task.getTimeStatus();
    const timeHTML = timeStatus
      ? `
        <div class="task-time-status ${timeStatus.status}">
            <i class="fas ${timeStatus.icon}"></i>
            <span>${task.startTime} - ${task.endTime}</span>
        </div>
    `
      : "";

    return `
      <div class="task-item" draggable="true" data-task-id="${
        task.id
      }" style="--priority-color: ${priorityColors[task.priority]}">
        <div class="task-content">
          <h3>${task.title}</h3>
          <p>${task.description || "No description provided"}</p>
          <div class="task-meta">
            <span class="priority-badge priority-${task.priority}">
              <i class="fas fa-flag"></i> ${task.priority}
            </span>
            ${
              task.dueDate
                ? `
              <span class="due-date">
                <i class="fas fa-calendar"></i>
                ${new Date(task.dueDate).toLocaleDateString()}
              </span>
            `
                : ""
            }
            ${task.tags
              .map(
                (tag) => `
              <span class="tag">
                <i class="fas fa-tag"></i> ${tag}
              </span>
            `
              )
              .join("")}
            ${timeHTML}
          </div>
        </div>
        <div class="task-actions">
          <button class="edit-task" data-task-id="${task.id}" title="Edit task">
            <i class="fas fa-edit"></i>
          </button>
          <button class="delete-task" data-task-id="${
            task.id
          }" title="Delete task">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }

  createListElement(list) {
    const isActive = this.app?.currentList?.id === list.id ? "active" : "";
    const isDefault = list.name === "Default List";

    return `
        <div class="list-item ${isActive}" data-list-id="${list.id}">
            <div class="list-item-content" title="${list.name}">
                <div class="list-item-icon" style="background: ${list.color}20">
                    <i class="fas ${list.icon}" style="color: ${
      list.color
    }"></i>
                </div>
                <span style="color: ${list.color}">${list.name}</span>
            </div>
            <div class="list-actions">
                <span class="task-count">${list.tasks.length}</span>
                ${
                  !isDefault
                    ? `
                    <button class="delete-list-btn" title="Delete list">
                        <i class="fas fa-times"></i>
                        <span class="hover-text">Delete</span>
                    </button>
                `
                    : ""
                }
            </div>
        </div>
    `;
  }

  showTaskModal(task = null) {
    if (!this.taskModal || !this.taskForm) {
      console.error("Modal elements not found");
      return;
    }

    this.editingTaskId = task?.id || null;
    this.taskForm.reset();

    const modalTitle = document.getElementById("modalTitle");
    modalTitle.textContent = task ? "Edit Task" : "Add Task";

    if (task) {
      // Fill form with task data
      document.getElementById("taskTitle").value = task.title;
      document.getElementById("taskDescription").value = task.description;
      document.getElementById("taskDueDate").value = task.dueDate || "";
      document.getElementById("taskStartTime").value = task.startTime || "";
      document.getElementById("taskEndTime").value = task.endTime || "";
      document.getElementById("taskPriority").value = task.priority;
      document.getElementById("taskTags").value = task.tags.join(", ");
    }

    // Show modal with animation
    this.taskModal.style.display = "flex";
    requestAnimationFrame(() => {
      this.taskModal.classList.add("visible");
      document.getElementById("taskTitle")?.focus();
    });
  }

  hideTaskModal() {
    this.taskModal.classList.remove("visible");
    setTimeout(() => {
      this.taskModal.style.display = "none";
      this.taskForm.reset();
    }, 300);
  }

  showListModal() {
    const modal = document.getElementById("listModal");
    modal.style.display = "flex";
    requestAnimationFrame(() => {
      modal.classList.add("visible");
      document.getElementById("listName")?.focus();
    });
  }

  hideListModal() {
    const modal = document.getElementById("listModal");
    modal.classList.remove("visible");
    setTimeout(() => {
      modal.style.display = "none";
      document.getElementById("listForm").reset();
    }, 300);
  }

  showConfirmDialog(title, message, onConfirm) {
    const dialog = document.createElement("div");
    dialog.className = "modal confirm-dialog visible";
    dialog.innerHTML = `
        <div class="modal-content">
            <h2>${title}</h2>
            <p>${message}</p>
            <div class="modal-buttons">
                <button type="button" class="cancel-btn">Cancel</button>
                <button type="button" class="confirm-btn danger">Delete</button>
            </div>
        </div>
    `;

    const closeDialog = () => {
      dialog.classList.remove("visible");
      setTimeout(() => dialog.remove(), 300);
    };

    dialog.querySelector(".cancel-btn").addEventListener("click", closeDialog);
    dialog.querySelector(".confirm-btn").addEventListener("click", () => {
      onConfirm();
      closeDialog();
    });

    document.body.appendChild(dialog);
  }

  showDeleteConfirmation(list, onConfirm) {
    const dialog = document.createElement("div");
    dialog.className = "modal delete-confirmation visible";
    dialog.innerHTML = `
        <div class="modal-content">
            <div class="delete-header">
                <i class="fas fa-exclamation-triangle"></i>
                <h2>Delete List</h2>
            </div>
            <div class="delete-body">
                <p>Are you sure you want to delete "${list.name}"?</p>
                ${
                  list.tasks.length > 0
                    ? `
                    <div class="task-warning">
                        <i class="fas fa-tasks"></i>
                        <p>This list contains ${list.tasks.length} task${
                        list.tasks.length === 1 ? "" : "s"
                      }</p>
                    </div>
                `
                    : ""
                }
            </div>
            <div class="modal-buttons">
                <button class="cancel-btn">
                    <i class="fas fa-times"></i> Cancel
                </button>
                <button class="confirm-btn danger">
                    <i class="fas fa-trash"></i> Delete List
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    const handleClose = () => {
      dialog.classList.remove("visible");
      setTimeout(() => dialog.remove(), 300);
    };

    dialog.querySelector(".cancel-btn").addEventListener("click", handleClose);
    dialog.querySelector(".confirm-btn").addEventListener("click", () => {
      onConfirm();
      handleClose();
    });
  }

  getTaskFormData() {
    const formData = {
      title: document.getElementById("taskTitle").value.trim(),
      description: document.getElementById("taskDescription").value.trim(),
      dueDate: document.getElementById("taskDueDate").value,
      startTime: document.getElementById("taskStartTime")?.value,
      endTime: document.getElementById("taskEndTime")?.value,
      priority: document.getElementById("taskPriority").value,
      tags: document
        .getElementById("taskTags")
        .value.split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    };

    // Validate required fields
    if (!formData.title) {
      throw new Error("Task title is required");
    }

    // Validate time range if either time is set
    if (formData.startTime || formData.endTime) {
      if (!formData.startTime || !formData.endTime) {
        throw new Error("Both start and end times must be set");
      }
      if (formData.startTime >= formData.endTime) {
        throw new Error("End time must be after start time");
      }
    }

    // Validate due date is not in the past
    if (formData.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(formData.dueDate);
      if (dueDate < today) {
        throw new Error("Due date cannot be in the past");
      }
    }

    return formData;
  }

  getListFormData() {
    const name = document.getElementById("listName").value.trim();
    if (!name) throw new Error("List name is required");

    const icon =
      document.querySelector(".icon-option.active")?.dataset.icon ||
      "fa-list-ul";
    const color =
      document.querySelector(".color-option.active")?.dataset.color ||
      "#4a90e2";

    return { name, icon, color };
  }
}
