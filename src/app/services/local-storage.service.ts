import { Injectable } from '@angular/core';
import { Booking, BoardingStatus } from '../models/booking.model';

const STORAGE_KEY = 'bus_bookings';

/**
 * Service to manage all booking data via localStorage.
 * All CRUD operations are performed in-memory via localStorage.
 * Data is cleared on page unload (beforeunload event).
 */
@Injectable({ providedIn: 'root' })
export class LocalStorageService {

  constructor() {
    // Clear localStorage when the user leaves the page
    window.addEventListener('beforeunload', () => this.clearAll());
  }

  /** Retrieve all bookings */
  getAllBookings(): Booking[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Booking[]) : [];
    } catch {
      return [];
    }
  }

  /** Get bookings filtered by travel date */
  getBookingsByDate(date: string): Booking[] {
    return this.getAllBookings().filter(b => b.travelDate === date);
  }

  /** Get a single booking by ID */
  getBookingById(bookingId: string): Booking | undefined {
    return this.getAllBookings().find(b => b.bookingId === bookingId);
  }

  /** Add a new booking */
  addBooking(booking: Booking): void {
    const bookings = this.getAllBookings();
    bookings.push(booking);
    this.persist(bookings);
  }

  /** Update an existing booking */
  updateBooking(updated: Booking): void {
    const bookings = this.getAllBookings().map(b =>
      b.bookingId === updated.bookingId ? updated : b
    );
    this.persist(bookings);
  }

  /** Delete a booking by ID */
  deleteBooking(bookingId: string): void {
    const bookings = this.getAllBookings().filter(b => b.bookingId !== bookingId);
    this.persist(bookings);
  }

  /**
   * Get total seats booked for a mobile number on a given date.
   * Used to enforce the 6-seat max constraint.
   */
  getSeatCountForMobileOnDate(mobile: string, date: string, excludeBookingId?: string): number {
    return this.getAllBookings()
      .filter(b => b.mobileNumber === mobile && b.travelDate === date && b.bookingId !== excludeBookingId)
      .reduce((sum, b) => sum + b.selectedSeats.length, 0);
  }

  /** Get all booked seat IDs for a given date */
  getBookedSeatsForDate(date: string, excludeBookingId?: string): string[] {
    return this.getAllBookings()
      .filter(b => b.travelDate === date && b.bookingId !== excludeBookingId)
      .flatMap(b => b.selectedSeats);
  }

  /** Clear all data from localStorage */
  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Persist bookings array to localStorage */
  private persist(bookings: Booking[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  }
}
