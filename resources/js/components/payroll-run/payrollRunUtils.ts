import type { PayrollItem } from './types';

export const formatDate = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
export const num = (value: string | number | null | undefined) => Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const peso = (value: string | number | null | undefined) => `₱${num(value)}`;
export const totalEarnings = (item: PayrollItem) => Number(item.basic_pay ?? 0) + Number(item.overtime_pay ?? 0) + Number(item.holiday_pay ?? 0) + Number(item.night_diff ?? 0) + Number(item.leave_pay ?? 0) + Number(item.bonus ?? 0);
export const totalDeductions = (item: PayrollItem) => Number(item.sss_deduction ?? 0) + Number(item.philhealth_deduction ?? 0) + Number(item.pagibig_deduction ?? 0) + Number(item.tax_deduction ?? 0) + Number(item.leave_deduction ?? 0) + Number(item.other_deductions ?? 0);
export const statusClass: Record<string, string> = { draft: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400', processing: 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400', completed: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400', cancelled: 'border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400' };
export const getDailyRate = (item: PayrollItem) => { const configured = Number(item.employee?.daily_rate ?? 0); if (configured > 0) return configured; return item.employee?.rate_type === 'daily' ? Number(item.employee?.basic_rate ?? 0) : 0; };
