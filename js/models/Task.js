export class Task {
  constructor({
    title,
    description = "",
    dueDate = null,
    startTime = "",
    endTime = "",
    priority = "low",
    tags = [],
  }) {
    this.id = Date.now().toString();
    this.title = title;
    this.description = description;
    this.dueDate = dueDate;
    this.startTime = startTime;
    this.endTime = endTime;
    this.priority = priority;
    this.tags = Array.isArray(tags)
      ? tags
      : tags.split(",").map((tag) => tag.trim());
    this.completed = false;
    this.createdAt = new Date();
  }

  toggleComplete() {
    this.completed = !this.completed;
  }

  update(data) {
    Object.assign(this, data);
  }

  getTimeStatus() {
    if (!this.startTime || !this.endTime) return null;

    const now = new Date();
    const today = this.dueDate ? new Date(this.dueDate) : new Date();

    const [startHours, startMinutes] = this.startTime.split(":");
    const [endHours, endMinutes] = this.endTime.split(":");

    const startDateTime = new Date(today.setHours(startHours, startMinutes, 0));
    const endDateTime = new Date(today.setHours(endHours, endMinutes, 0));

    if (now < startDateTime) {
      return {
        status: "upcoming",
        icon: "fa-hourglass-start",
        color: "#3498db",
      };
    } else if (now >= startDateTime && now <= endDateTime) {
      return { status: "in-progress", icon: "fa-clock", color: "#2ecc71" };
    } else {
      return { status: "expired", icon: "fa-hourglass-end", color: "#e74c3c" };
    }
  }
}
