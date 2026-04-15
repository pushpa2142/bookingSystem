import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Booking } from '../../models/booking.model';
import { BookingService } from '../../services/booking.service';

/**
 * Screen 1: Book / Update / Edit Booking
 * - Date picker, mobile input, seat selection
 * - Validates max 6 seats per mobile per day
 * - Supports edit mode via query param ?bookingId=XXX
 */
@Component({
  selector: 'app-booking',
  templateUrl: './booking.component.html',
  styleUrls: ['./booking.component.scss']
})
export class BookingComponent implements OnInit {

  bookingForm!: FormGroup;
  bookedSeats: string[] = [];
  preSelectedSeats: string[] = [];
  selectedSeats: string[] = [];
  confirmedBooking: Booking | null = null;
  errorMessage = '';
  isEditMode = false;
  editBookingId = '';
  maxSelectable = 6;
  isLoading = false;

  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    // Check for edit mode
    this.route.queryParams.subscribe(params => {
      if (params['bookingId']) {
        this.editBookingId = params['bookingId'];
        this.isEditMode = true;
        this.loadBookingForEdit(this.editBookingId);
      }
    });
  }

  private initForm(): void {
    this.bookingForm = this.fb.group({
      travelDate: ['', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern('^[6-9]\\d{9}$')]]
    });

    // Reload seat availability when date changes
    this.bookingForm.get('travelDate')?.valueChanges.subscribe(date => {
      if (date) this.refreshBookedSeats(date);
    });
  }

  private loadBookingForEdit(bookingId: string): void {
    const booking = this.bookingService['storageService'].getBookingById(bookingId);
    if (!booking) {
      this.errorMessage = 'Booking not found.';
      return;
    }
    this.bookingForm.patchValue({
      travelDate: booking.travelDate,
      mobileNumber: booking.mobileNumber
    });
    this.preSelectedSeats = [...booking.selectedSeats];
    this.selectedSeats = [...booking.selectedSeats];
    this.refreshBookedSeats(booking.travelDate, bookingId);
    this.updateMaxSelectable(booking.mobileNumber, booking.travelDate, bookingId);
  }

  private refreshBookedSeats(date: string, excludeId?: string): void {
    this.bookedSeats = this.bookingService.getBookedSeatsForDate(
      date,
      excludeId || (this.isEditMode ? this.editBookingId : undefined)
    );
  }

  private updateMaxSelectable(mobile: string, date: string, excludeId?: string): void {
    const used = this.bookingService['storageService'].getSeatCountForMobileOnDate(
      mobile, date, excludeId
    );
    this.maxSelectable = 6 - used;
  }

  onSeatSelectionChanged(seats: string[]): void {
    this.selectedSeats = seats;
    this.errorMessage = '';
  }

  onMobileChange(): void {
    const { mobileNumber, travelDate } = this.bookingForm.value;
    if (mobileNumber && travelDate) {
      this.updateMaxSelectable(
        mobileNumber, travelDate,
        this.isEditMode ? this.editBookingId : undefined
      );
    }
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      return;
    }
    if (this.selectedSeats.length === 0) {
      this.errorMessage = 'Please select at least one seat.';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const { travelDate, mobileNumber } = this.bookingForm.value;

    try {
      if (this.isEditMode) {
        const updated = this.bookingService.updateBooking(
          this.editBookingId, travelDate, mobileNumber, this.selectedSeats
        );
        this.confirmedBooking = updated;
      } else {
        const booking = this.bookingService.createBooking(travelDate, mobileNumber, this.selectedSeats);
        this.confirmedBooking = booking;
      }
    } catch (err: any) {
      this.errorMessage = err.message || 'An error occurred. Please try again.';
    } finally {
      this.isLoading = false;
    }
  }

  onModalClosed(): void {
    this.confirmedBooking = null;
    if (this.isEditMode) {
      this.router.navigate(['/bookings']);
    } else {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.bookingForm.reset();
    this.selectedSeats = [];
    this.preSelectedSeats = [];
    this.bookedSeats = [];
    this.errorMessage = '';
    this.maxSelectable = 6;
  }

  /** Convenience accessors for template validation */
  get f() { return this.bookingForm.controls; }
}
