export function getDateTimeOfNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export function compareDateGroupExist(createdAt: Date): boolean {
  if (createdAt > new Date(Date.now() - 63 * 60 * 60 * 1000)) return true;
  return false;
}
