export function getDateTimeOfNow(): Date {
  return new Date(new Date().getTime() + 9 * 60 * 60 * 1000);
}
