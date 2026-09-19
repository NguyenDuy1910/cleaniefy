const bookingDate = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const bookingTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

// Availability rules and stored slots currently use UTC calendar days.
export const formatBookingDate = (value: string | Date) => bookingDate.format(new Date(value));
export const formatBookingTime = (value: string | Date) => bookingTime.format(new Date(value));
