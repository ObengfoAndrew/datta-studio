// src/components/shared/responsive.ts

export const breakpoints = {
  xs: 320,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
} as const;

export const mediaQueries = {
  xs: `@media (max-width: ${breakpoints.xs}px)`,
  sm: `@media (max-width: ${breakpoints.sm}px)`,
  md: `@media (max-width: ${breakpoints.md}px)`,
  lg: `@media (max-width: ${breakpoints.lg}px)`,
  xl: `@media (max-width: ${breakpoints.xl}px)`,
  xxl: `@media (max-width: ${breakpoints.xxl}px)`
} as const;

export const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoints.md;
};

export const isTabletDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg;
};

export const isDesktopDevice = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= breakpoints.lg;
};

// Responsive spacing helper
export const getResponsiveSpacing = (isMobile: boolean, mobile: number | string, desktop: number | string) => {
  return isMobile ? mobile : desktop;
};

// Responsive font size helper
export const getResponsiveFontSize = (isMobile: boolean, mobile: number, desktop: number) => {
  return isMobile ? `${mobile}px` : `${desktop}px`;
};

// Responsive padding helper
export const getResponsivePadding = (isMobile: boolean, mobilePx: number, desktopPx: number) => {
  return isMobile ? `${mobilePx}px` : `${desktopPx}px`;
};

// Touch-friendly button size
export const TOUCH_TARGET_SIZE = 44; // Minimum recommended by iOS
