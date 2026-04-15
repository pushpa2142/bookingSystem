import {
  Component, Input, Output, EventEmitter, OnChanges, SimpleChanges
} from '@angular/core';
import { Seat, SeatStatus } from '../../models/booking.model';

/**
 * Seat Layout Component
 * Renders a 2×2 seating arrangement with 15 rows (60 seats total).
 * Columns: A, B | aisle | C, D
 * Rows: 1–15 (1 = front, 15 = back)
 */
@Component({
  selector: 'app-seat-layout',
  templateUrl: './seat-layout.component.html',
  styleUrls: ['./seat-layout.component.scss']
})
export class SeatLayoutComponent implements OnChanges {

  /** Seats already booked by others */
  @Input() bookedSeats: string[] = [];

  /** Seats pre-selected (for edit mode) */
  @Input() preSelectedSeats: string[] = [];

  /** Max seats the user can still select */
  @Input() maxSelectable: number = 6;

  /** Emits the current selection */
  @Output() selectionChanged = new EventEmitter<string[]>();

  rows: Seat[][] = [];
  selectedSeats: string[] = [];

  readonly ROWS = 15;
  readonly COLS: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];

  ngOnChanges(changes: SimpleChanges): void {
    this.buildLayout();
  }

  /** Build the full seat grid */
  buildLayout(): void {
    this.selectedSeats = [...this.preSelectedSeats];
    this.rows = [];

    for (let r = 1; r <= this.ROWS; r++) {
      const row: Seat[] = this.COLS.map(col => {
        const id = `${col}${r}`;
        let status: SeatStatus;

        if (this.bookedSeats.includes(id)) {
          status = SeatStatus.BOOKED;
        } else if (this.selectedSeats.includes(id)) {
          status = SeatStatus.SELECTED;
        } else {
          status = SeatStatus.AVAILABLE;
        }

        return { id, row: r, col, status };
      });
      this.rows.push(row);
    }
  }

  /** Toggle seat selection */
  toggleSeat(seat: Seat): void {
    if (seat.status === SeatStatus.BOOKED) return;

    const idx = this.selectedSeats.indexOf(seat.id);

    if (idx > -1) {
      // Deselect
      this.selectedSeats.splice(idx, 1);
      seat.status = SeatStatus.AVAILABLE;
    } else {
      // Select — enforce max limit
      if (this.selectedSeats.length >= this.maxSelectable) return;
      this.selectedSeats.push(seat.id);
      seat.status = SeatStatus.SELECTED;
    }

    this.selectionChanged.emit([...this.selectedSeats]);
  }

  /** CSS class for a seat */
  getSeatClass(seat: Seat): string {
    switch (seat.status) {
      case SeatStatus.AVAILABLE: return 'seat available';
      case SeatStatus.SELECTED:  return 'seat selected';
      case SeatStatus.BOOKED:    return 'seat booked';
    }
  }

  /** Left pair (columns A, B) */
  getLeftPair(row: Seat[]): Seat[] {
    return row.filter(s => s.col === 'A' || s.col === 'B');
  }

  /** Right pair (columns C, D) */
  getRightPair(row: Seat[]): Seat[] {
    return row.filter(s => s.col === 'C' || s.col === 'D');
  }
}
