/**
 * Promise-based wrapper around a hidden `<input type="file">`. Resolves only
 * after the native picker settles — `change` (files chosen) or `cancel`
 * (dismissed) — so callers can `await` a selection instead of racing it.
 */
/** Newest-first ordering (today's photos surface ahead of older ones). */
export function sortByNewest(files: File[]): File[] {
  return [...files].sort((a, b) => b.lastModified - a.lastModified);
}

export function pickFiles(input: HTMLInputElement): Promise<File[]> {
  return new Promise((resolve) => {
    const finish = (files: File[]): void => {
      input.removeEventListener('change', onChange);
      input.removeEventListener('cancel', onCancel);
      resolve(files);
    };
    const onChange = (): void => finish(Array.from(input.files ?? []));
    const onCancel = (): void => finish([]);
    input.addEventListener('change', onChange, { once: true });
    input.addEventListener('cancel', onCancel, { once: true });
    input.value = '';
    input.click();
  });
}
