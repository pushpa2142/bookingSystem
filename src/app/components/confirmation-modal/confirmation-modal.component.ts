import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Booking } from '../../models/booking.model';

/**
 * Modal to confirm a successful booking with booking details.
 */
@Component({
  selector: 'app-confirmation-modal',
  templateUrl: './confirmation-modal.component.html',
  styleUrls: ['./confirmation-modal.component.scss']
})
export class ConfirmationModalComponent {
  @Input() booking: Booking | null = null;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}
