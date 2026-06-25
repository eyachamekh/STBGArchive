export const formatDate = (value) => {
  if (!value) return '—';
  const str = String(value).trim();
  if (!str) return '—';

  const datePart = str.split('T')[0];
  const parts = datePart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const [year, month, day] = parts;
    if (day && month && year) {
      return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
  }

  const parsed = new Date(str);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('fr-TN');
  }

  return str;
};
