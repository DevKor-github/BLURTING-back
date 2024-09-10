import { BlurtingGroupEntity } from 'src/domain/entities';

export function getDateTimeOfNow(): Date {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

export function applyTimeZone(date: Date): Date {
  return new Date(date.getTime() + 9 * 60 * 60 * 1000);
}
