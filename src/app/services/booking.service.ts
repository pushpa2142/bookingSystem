import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Booking, BoardingStatus, BoardingSequenceItem } from '../models/booking.model';
import { LocalStorageService } from './local-storage.service';

const MAX_SEATS_PER_MOBILE_PER_DAY = 6;
const SETTLING_DURATION_MS = 60_000; // 60 seconds

/**
 * Core business logic service for the Bus Booking System.
 * Handles bookings, validation, and the optimal boarding sequence algorithm.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {

  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  bookings$ = this.bookingsSubject.asObservable();

  constructor(private storageService: LocalStorageService) {
    this.refreshBookings();
  }

  /** Reload bookings from localStorage into the observable */
  refreshBookings(): void {
    this.bookingsSubject.next(this.storageService.getAllBookings());
  }

  /** Get bookings for a specific date */
  getBookingsForDate(date: string): Booking[] {
    return this.storageService.getBookingsByDate(date);
  }

  /**
   * Create a new booking.
   * Validates seat availability and mobile number seat limit.
   * @returns The created Booking or throws an error string
   */
  createBooking(travelDate: string, mobileNumber: string, selectedSeats: string[]): Booking {
    this.validateBookingInput(travelDate, mobileNumber, selectedSeats);
    this.validateSeatAvailability(travelDate, selectedSeats);
    this.validateMobileSeatLimit(mobileNumber, travelDate, selectedSeats.length);

    const booking: Booking = {
      bookingId: this.generateBookingId(),
      travelDate,
      mobileNumber,
      selectedSeats,
      bookedAt: Date.now(),
      boardingStatus: BoardingStatus.NOT_BOARDED
    };

    this.storageService.addBooking(booking);
    this.refreshBookings();
    return booking;
  }

  /**
   * Update an existing booking (edit seats/date/mobile).
   * @returns The updated Booking or throws an error string
   */
  updateBooking(
    bookingId: string,
    travelDate: string,
    mobileNumber: string,
    selectedSeats: string[]
  ): Booking {
    const existing = this.storageService.getBookingById(bookingId);
    if (!existing) throw new Error('Booking not found.');

    this.validateBookingInput(travelDate, mobileNumber, selectedSeats);
    this.validateSeatAvailability(travelDate, selectedSeats, bookingId);
    this.validateMobileSeatLimit(mobileNumber, travelDate, selectedSeats.length, bookingId);

    const updated: Booking = {
      ...existing,
      travelDate,
      mobileNumber,
      selectedSeats,
      boardingStatus: BoardingStatus.NOT_BOARDED
    };

    this.storageService.updateBooking(updated);
    this.refreshBookings();
    return updated;
  }

  /** Delete a booking */
  deleteBooking(bookingId: string): void {
    this.storageService.deleteBooking(bookingId);
    this.refreshBookings();
  }

  /** Get all booked seat IDs for a date (to show in seat layout) */
  getBookedSeatsForDate(date: string, excludeBookingId?: string): string[] {
    return this.storageService.getBookedSeatsForDate(date, excludeBookingId);
  }

  /**
   * Mark a booking as boarding (starts 60s settling timer).
   * Constraint: While a passenger settles, no one behind them can pass.
   */
  markBoarding(bookingId: string): void {
    const booking = this.storageService.getBookingById(bookingId);
    if (!booking) return;

    const updated: Booking = {
      ...booking,
      boardingStatus: BoardingStatus.SETTLING,
    };
    this.storageService.updateBooking(updated);

    // After 60 seconds, mark as BOARDED
    setTimeout(() => {
      const b = this.storageService.getBookingById(bookingId);
      if (b && b.boardingStatus === BoardingStatus.SETTLING) {
        this.storageService.updateBooking({ ...b, boardingStatus: BoardingStatus.BOARDED });
        this.refreshBookings();
      }
    }, SETTLING_DURATION_MS);

    this.refreshBookings();
  }

  /**
   * ALGORITHM: Optimal Boarding Sequence
   * Seats are numbered from front (row 1) to back (row 15).
   * To minimize total boarding time, passengers board from back to front
   * (highest row number first). This prevents blocking.
   *
   * For each booking group, the "representative seat" is the maximum row
   * among all selected seats (the furthest back they need to go).
   * Groups are sorted descending by this max row → back-to-front boarding.
   *
   * Time complexity: O(n log n) where n = number of bookings for the date.
   */
  getOptimalBoardingSequence(date: string): BoardingSequenceItem[] {
    const bookings = this.storageService.getBookingsByDate(date);

    // Extract row number from seat ID (e.g. 'A7' → 7, 'B15' → 15)
    const getMaxRow = (seats: string[]): number =>
      Math.max(...seats.map(s => parseInt(s.replace(/[A-D]/g, ''), 10)));

    // Sort bookings by max row descending (back → front)
    const sorted = [...bookings].sort((a, b) =>
      getMaxRow(b.selectedSeats) - getMaxRow(a.selectedSeats)
    );

    return sorted.map((booking, index) => ({
      sequence: index + 1,
      bookingId: booking.bookingId,
      seats: booking.selectedSeats,
      mobile: booking.mobileNumber,
      boardingStatus: booking.boardingStatus
    }));
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private validateBookingInput(date: string, mobile: string, seats: string[]): void {
    if (!date) throw new Error('Travel date is required.');
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) throw new Error('Enter a valid 10-digit mobile number.');
    if (!seats || seats.length === 0) throw new Error('Please select at least one seat.');
    if (seats.length > MAX_SEATS_PER_MOBILE_PER_DAY) throw new Error(`Maximum ${MAX_SEATS_PER_MOBILE_PER_DAY} seats per booking.`);
  }

  private validateSeatAvailability(date: string, seats: string[], excludeId?: string): void {
    const booked = this.storageService.getBookedSeatsForDate(date, excludeId);
    const conflict = seats.filter(s => booked.includes(s));
    if (conflict.length > 0) throw new Error(`Seats already booked: ${conflict.join(', ')}`);
  }

  private validateMobileSeatLimit(mobile: string, date: string, newCount: number, excludeId?: string): void {
    const existing = this.storageService.getSeatCountForMobileOnDate(mobile, date, excludeId);
    if (existing + newCount > MAX_SEATS_PER_MOBILE_PER_DAY) {
      throw new Error(`Mobile ${mobile} has already booked ${existing} seat(s). Max ${MAX_SEATS_PER_MOBILE_PER_DAY} seats per day.`);
    }
  }

  /** Generate a unique booking ID like BK-2024-XXXXX */
  private generateBookingId(): string {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `BK-${year}-${rand}`;
  }
}
