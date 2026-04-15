/**
 * Represents a single bus ticket booking
 */
export interface Booking {
  bookingId: string;
  travelDate: string;         // ISO date string YYYY-MM-DD
  mobileNumber: string;
  selectedSeats: string[];    // e.g. ['A1', 'A2']
  bookedAt: number;           // timestamp
  boardingStatus: BoardingStatus;
}

/**
 * Boarding status for each booking
 */
export enum BoardingStatus {
  NOT_BOARDED = 'NOT_BOARDED',
  SETTLING = 'SETTLING',
  BOARDED = 'BOARDED'
}

/**
 * Seat status in the layout
 */
export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  SELECTED = 'SELECTED',
  BOOKED = 'BOOKED'
}

/**
 * Represents a single seat in the bus
 */
export interface Seat {
  id: string;         // e.g. 'A1', 'B3'
  row: number;        // 1-15
  col: string;        // 'A' | 'B' | 'C' | 'D'
  status: SeatStatus;
}

/**
 * Boarding sequence result from the algorithm
 */
export interface BoardingSequenceItem {
  sequence: number;
  bookingId: string;
  seats: string[];
  mobile: string;
  boardingStatus: BoardingStatus;
  settlingUntil?: number;   // timestamp when settling ends
}
