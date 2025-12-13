/**
 * Helper functions for exporting data
 */

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const formatExportFilename = (prefix: string, extension: string = 'xlsx'): string => {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}_${date}.${extension}`;
};



