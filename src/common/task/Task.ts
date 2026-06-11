import { TaskStatus } from "./TaskStatus";

export interface Task<T> {
  call(): Promise<T> | T;
  getResult(): T | null;
  getStatus(): TaskStatus;
  cancel(): void;
}
