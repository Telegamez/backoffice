export const cn = (...classes: Array<string | undefined | null | false>) =>
  classes.filter(Boolean).join(' ');

export type ZoomLevel = 'weeks' | 'months' | 'quarters' | 'year';

export const getPixelsPerDay = (containerWidth: number, rangeDays: number) => {
  const minWidth = Math.max(containerWidth, 1200);
  return minWidth / Math.max(rangeDays, 1);
};




