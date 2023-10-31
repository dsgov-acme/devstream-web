import { INuverialSnackBarConfiguration } from './nuverial.models';

// Default Configuration for Nuverial Snackbar
export const NUVERIAL_DEFAULT_SNACKBAR_CONFIGURATION: INuverialSnackBarConfiguration = {
  dismissible: true,
  duration: 5000,
  horizontalPosition: 'left',
  politeness: 'polite',
  type: 'success',
  verticalPosition: 'bottom',
};

export const INFINITE_SCROLL_DEFAULTS = {
  scrollDistance: 1,
  scrollUpDistance: 2,
  throttle: 300,
};

export const FOOTER_ACTIONS_OPEN_CLASS = 'footer-actions-open';
