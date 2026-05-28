/** Flip password visibility state (SOREN-callable UI helper). */
export function togglePasswordVisibility(currentlyVisible: boolean): boolean {
  return !currentlyVisible;
}

export function passwordVisibilityAriaLabel(visible: boolean): string {
  return visible ? 'Hide characters' : 'Show characters';
}

export function passwordInputType(visible: boolean): 'text' | 'password' {
  return visible ? 'text' : 'password';
}
