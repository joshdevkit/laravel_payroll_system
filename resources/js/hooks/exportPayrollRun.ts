import XLSX from 'xlsx-js-style';
import type { PayrollItem, PayrollRun } from '@/components/payroll-run/types';
import { num, totalDeductions, totalEarnings } from '@/components/payroll-run/payrollRunUtils';

const thinBorder = { top: { style: 'thin', color: { rgb: '999999' } }, bottom: { style: 'thin', color: { rgb: '999999' } }, left: { style: 'thin', color: { rgb: '999999' } }, right: { style: 'thin', color: { rgb: '999999' } } };
const headerStyle = { font: { bold: true, color: { rgb: '000000' }, sz: 9 }, fill: { fgColor: { rgb: 'FBBF24' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true }, border: thinBorder };
const footerStyle = { font: { bold: true, color: { rgb: '000000' }, sz: 10 }, fill: { fgColor: { rgb: 'FDE68A' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: thinBorder };
const cellStyle = (shaded: boolean, bold = false, left = false) => ({ font: { bold, sz: 10 }, ...(shaded ? { fill: { fgColor: { rgb: 'FFFBEB' } } } : {}), alignment: { horizontal: left ? 'left' : 'center', vertical: 'center' }, border: thinBorder });
const dash = (value: string | number | null | undefined) => Number(value ?? 0) ? num(value) : '-';

export function exportPayrollRunToExcel(run: PayrollRun, items: PayrollItem[]) {
    const rows: unknown[][] = [
        ['No.', 'ID No.', 'Employee Name', 'Department', 'Earnings', '', '', '', '', '', '', '', '', '', 'Deductions', '', '', '', '', '', '', '', 'Total Net Earnings', 'Signature'],
        ['', '', '', '', 'No. of Days', 'Rate', 'Basic Salary', 'COLA', 'Tardy', 'Total Earnings', 'Overtime Pay', 'Holiday Pay', 'Night Shift Pay', 'Total Gross Earning', 'Contribution', '', '', 'Loans', '', 'Cash Advance', 'Others', 'Total Deductions', '', ''],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', 'PhilHealth', 'Pag-IBIG', 'SSS', 'SSS', 'Pag-IBIG', '', '', '', '', ''],
    ];

    items.forEach((item, index) => {
        const rate = item.employee?.rate_type === 'daily' ? Number(item.employee.daily_rate ?? item.employee.basic_rate ?? 0) : Number(item.employee?.basic_rate ?? 0) / 26;
        const others = Number(item.other_deductions ?? 0) + Number(item.tax_deduction ?? 0) + Number(item.leave_deduction ?? 0);
        rows.push([index + 1, item.employee?.employee_id ?? item.employee_id, item.employee?.full_name ?? '', '-', Number(item.present_days ?? 0), rate ? `₱${num(rate)}` : '-', num(item.basic_pay), '-', '-', num(item.basic_pay), dash(item.overtime_pay), dash(item.holiday_pay), dash(item.night_diff), num(totalEarnings(item)), dash(item.philhealth_deduction), dash(item.pagibig_deduction), dash(item.sss_deduction), '-', '-', '-', dash(others), dash(totalDeductions(item)), num(item.net_pay), '']);
    });

    const sum = (fn: (item: PayrollItem) => number) => items.reduce((total, item) => total + fn(item), 0);
    rows.push(['Total', '', '', '', sum(item => Number(item.present_days ?? 0)), '-', num(sum(item => Number(item.basic_pay ?? 0))), '-', '-', num(sum(item => Number(item.basic_pay ?? 0))), num(sum(item => Number(item.overtime_pay ?? 0))), num(sum(item => Number(item.holiday_pay ?? 0))), num(sum(item => Number(item.night_diff ?? 0))), num(sum(totalEarnings)), num(sum(item => Number(item.philhealth_deduction ?? 0))), num(sum(item => Number(item.pagibig_deduction ?? 0))), num(sum(item => Number(item.sss_deduction ?? 0))), '-', '-', '-', num(sum(item => Number(item.other_deductions ?? 0) + Number(item.tax_deduction ?? 0) + Number(item.leave_deduction ?? 0))), num(sum(totalDeductions)), num(sum(item => Number(item.net_pay ?? 0))), '']);

    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!merges'] = [
        ...[0,1,2,3].map(c => ({ s: { r: 0, c }, e: { r: 2, c } })),
        { s: { r: 0, c: 4 }, e: { r: 0, c: 13 } }, { s: { r: 0, c: 14 }, e: { r: 0, c: 21 } },
        { s: { r: 0, c: 22 }, e: { r: 2, c: 22 } }, { s: { r: 0, c: 23 }, e: { r: 2, c: 23 } },
        ...Array.from({ length: 10 }, (_, i) => ({ s: { r: 1, c: 4 + i }, e: { r: 2, c: 4 + i } })),
        { s: { r: 1, c: 14 }, e: { r: 1, c: 16 } }, { s: { r: 1, c: 17 }, e: { r: 1, c: 18 } },
        ...[19,20,21].map(c => ({ s: { r: 1, c }, e: { r: 2, c } })),
    ];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 24; c++) { const a = XLSX.utils.encode_cell({ r, c }); if (!worksheet[a]) worksheet[a] = { t: 's', v: '' }; worksheet[a].s = headerStyle; }
    items.forEach((_, i) => { const r = i + 3; for (let c = 0; c < 24; c++) { const a = XLSX.utils.encode_cell({ r, c }); if (!worksheet[a]) worksheet[a] = { t: 's', v: '' }; worksheet[a].s = cellStyle(i % 2 === 1, c === 1 || c === 13 || c === 22, c === 2 || c === 3); } });
    const footer = items.length + 3; for (let c = 0; c < 24; c++) { const a = XLSX.utils.encode_cell({ r: footer, c }); if (!worksheet[a]) worksheet[a] = { t: 's', v: '' }; worksheet[a].s = footerStyle; }
    worksheet['!cols'] = [5,10,24,16,10,10,12,8,8,12,11,11,12,13,10,10,10,10,10,11,9,12,13,16].map(wch => ({ wch }));
    worksheet['!rows'] = [{ hpt: 20 }, { hpt: 20 }, { hpt: 20 }];
    const workbook = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Register');
    XLSX.writeFile(workbook, `payroll-run-${run.cutoff_start}_to_${run.cutoff_end}.xlsx`);
}
