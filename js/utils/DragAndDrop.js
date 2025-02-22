export class DragAndDrop {
  initialize() {
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const tasksContainer = document.getElementById("tasksContainer");

    tasksContainer.addEventListener("dragstart", (e) => {
      if (e.target.classList.contains("task-item")) {
        e.target.classList.add("dragging");
        e.dataTransfer.setData("text/plain", e.target.dataset.taskId);
      }
    });

    tasksContainer.addEventListener("dragend", (e) => {
      if (e.target.classList.contains("task-item")) {
        e.target.classList.remove("dragging");
      }
    });

    tasksContainer.addEventListener("dragover", (e) => {
      e.preventDefault();
      const afterElement = this.getDragAfterElement(tasksContainer, e.clientY);
      const draggable = document.querySelector(".dragging");
      if (afterElement == null) {
        tasksContainer.appendChild(draggable);
      } else {
        tasksContainer.insertBefore(draggable, afterElement);
      }
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [
      ...container.querySelectorAll(".task-item:not(.dragging)"),
    ];

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child };
        } else {
          return closest;
        }
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }
}
