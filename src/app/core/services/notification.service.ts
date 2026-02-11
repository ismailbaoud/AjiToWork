import { Injectable, signal } from "@angular/core";

/**
 * Notification types for different message severities
 */
export type NotificationType = "success" | "error" | "warning" | "info";

/**
 * Notification message structure
 */
export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

/**
 * Service for managing application notifications and user feedback
 */
@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private notifications = signal<Notification[]>([]);
  private idCounter = 0;

  constructor() {}

  /**
   * Get all current notifications
   */
  getNotifications() {
    return this.notifications.asReadonly();
  }

  /**
   * Show a success notification
   * @param message Success message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, "success", duration);
  }

  /**
   * Show an error notification
   * @param message Error message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, "error", duration);
  }

  /**
   * Show a warning notification
   * @param message Warning message to display
   * @param duration Duration in milliseconds (default: 4000)
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, "warning", duration);
  }

  /**
   * Show an info notification
   * @param message Info message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, "info", duration);
  }

  /**
   * Show a notification with custom type
   * @param message Message to display
   * @param type Notification type
   * @param duration Duration in milliseconds
   */
  private show(
    message: string,
    type: NotificationType,
    duration: number,
  ): void {
    const notification: Notification = {
      id: this.generateId(),
      type,
      message,
      duration,
    };

    this.notifications.update((notifications) => [
      ...notifications,
      notification,
    ]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification.id);
      }, duration);
    }
  }

  /**
   * Remove a notification by ID
   * @param id Notification ID to remove
   */
  remove(id: string): void {
    this.notifications.update((notifications) =>
      notifications.filter((notification) => notification.id !== id),
    );
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.set([]);
  }

  /**
   * Generate unique ID for notification
   * @returns Unique notification ID
   */
  private generateId(): string {
    return `notification-${++this.idCounter}-${Date.now()}`;
  }

  /**
   * Alias for success() method
   * @param message Success message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  showSuccess(message: string, duration: number = 3000): void {
    this.success(message, duration);
  }

  /**
   * Alias for error() method
   * @param message Error message to display
   * @param duration Duration in milliseconds (default: 5000)
   */
  showError(message: string, duration: number = 5000): void {
    this.error(message, duration);
  }

  /**
   * Alias for warning() method
   * @param message Warning message to display
   * @param duration Duration in milliseconds (default: 4000)
   */
  showWarning(message: string, duration: number = 4000): void {
    this.warning(message, duration);
  }

  /**
   * Alias for info() method
   * @param message Info message to display
   * @param duration Duration in milliseconds (default: 3000)
   */
  showInfo(message: string, duration: number = 3000): void {
    this.info(message, duration);
  }
}
