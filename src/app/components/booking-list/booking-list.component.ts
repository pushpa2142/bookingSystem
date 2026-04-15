import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Booking, BoardingStatus, BoardingSequenceItem } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';

/**
 * Screen 2: Booking List & Boarding Tracking
 * - Filter by travel date
 * - Shows bookings with boarding status
 * - Optimal boarding sequence (back-to-front algorithm)
 * - 60-second settling timer
 */
@Component({
  selector: 'app-booking-list',
  templateUrl: './booking-list.component.html',
  styleUrls: ['./booking-list.component.scss']
})
export class BookingListComponent implements OnInit, OnDestroy {

  selectedDate = '';
  bookings: Booking[] = [];
  boardingSequence: BoardingSequenceItem[] = [];
  showSequenceView = false;
  today: string = new Date().toISOString().split('T')[0];

  settlingTimers: Map<string, number> = new Map();
  settlingProgress: Map<string, number> = new Map();
  private timerIntervals: any[] = [];

  readonly BoardingStatus = BoardingStatus;

  constructor(
    private bookingService: BookingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.selectedDate = this.today;
    this.loadBookings();

    // Refresh list every 2 seconds to catch timer updates
    const interval = setInterval(() => this.loadBookings(), 2000);
    this.timerIntervals.push(interval);
  }

  ngOnDestroy(): void {
    this.timerIntervals.forEach(i => clearInterval(i));
  }

  loadBookings(): void {
    if (!this.selectedDate) {
      this.bookings = [];
      this.boardingSequence = [];
      return;
    }
    this.bookings = this.bookingService.getBookingsForDate(this.selectedDate);
    this.boardingSequence = this.bookingService.getOptimalBoardingSequence(this.selectedDate);
  }

  onDateChange(): void {
    this.loadBookings();
  }

  /** Initiate a phone call */
  callPassenger(mobile: string): void {
    window.location.href = `tel:${mobile}`;
  }

  /** Mark a booking as boarding (starts 60s timer) */
  markBoarding(bookingId: string): void {
    this.bookingService.markBoarding(bookingId);
    this.loadBookings();

    // Start progress bar timer
    const startTime = Date.now();
    const duration = 60_000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      this.settlingProgress.set(bookingId, progress);
      if (progress >= 100) {
        clearInterval(interval);
        this.settlingProgress.delete(bookingId);
        this.loadBookings();
      }
    }, 500);

    this.timerIntervals.push(interval);
  }

  getSettlingProgress(bookingId: string): number {
    return this.settlingProgress.get(bookingId) ?? 0;
  }

  editBooking(bookingId: string): void {
    this.router.navigate(['/book'], { queryParams: { bookingId } });
  }

  deleteBooking(bookingId: string): void {
    if (confirm('Are you sure you want to cancel this booking?')) {
      this.bookingService.deleteBooking(bookingId);
      this.loadBookings();
    }
  }

  toggleSequenceView(): void {
    this.showSequenceView = !this.showSequenceView;
  }

  getBoardingLabel(status: BoardingStatus): string {
    switch (status) {
      case BoardingStatus.NOT_BOARDED: return 'Board';
      case BoardingStatus.SETTLING:    return 'Settling...';
      case BoardingStatus.BOARDED:     return '✓ Boarded';
    }
  }

  getBoardingClass(status: BoardingStatus): string {
    switch (status) {
      case BoardingStatus.NOT_BOARDED: return 'btn-board';
      case BoardingStatus.SETTLING:    return 'btn-settling';
      case BoardingStatus.BOARDED:     return 'btn-boarded';
    }
  }

  isBoardingDisabled(status: BoardingStatus): boolean {
    return status === BoardingStatus.SETTLING || status === BoardingStatus.BOARDED;
  }
}
