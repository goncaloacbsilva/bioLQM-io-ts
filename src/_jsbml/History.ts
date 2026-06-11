export class History {
  private modifiedDate: Date | null = null;

  setModifiedDate(date: Date): void {
    this.modifiedDate = date;
  }

  getModifiedDate(): Date | null {
    return this.modifiedDate;
  }
}
