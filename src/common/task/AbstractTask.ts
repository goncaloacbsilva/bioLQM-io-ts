import { Task } from "./Task";
import { TaskStatus } from "./TaskStatus";

export abstract class AbstractTask<T> implements Task<T> {
  protected canceled = false;
  private status = TaskStatus.STOPPED;
  private result: T | null = null;

  protected abstract performTask(): Promise<T> | T;

  getResult(): T | null {
    return this.result;
  }

  getStatus(): TaskStatus {
    return this.status;
  }

  async call(): Promise<T> {
    if (this.status === TaskStatus.RUNNING) {
      throw new Error("Should not be able to call a running task");
    }

    this.result = null;
    this.canceled = false;
    this.status = TaskStatus.RUNNING;

    this.result = await this.performTask();
    if (this.canceled) {
      this.result = null;
      this.status = TaskStatus.CANCELED;
      return null as never;
    }

    this.status = TaskStatus.FINISHED;
    return this.result;
  }

  cancel(): void {
    if (this.status === TaskStatus.RUNNING) {
      this.canceled = true;
    }
  }
}
