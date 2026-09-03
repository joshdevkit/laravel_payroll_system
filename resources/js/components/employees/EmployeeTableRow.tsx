import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import type { Employee } from './EmployeeFormDialog';

type EmployeeTableRowProps = {
    employee: Employee;
    onMenuToggle: (employee: Employee, event: React.MouseEvent<HTMLButtonElement>) => void;
};

const employmentTypeLabel: Record<Employee['employment_type'], string> = {
    regular: 'Regular',
    probationary: 'Probationary',
    contractual: 'Contractual',
};

const formatPeso = (amount: number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
    }).format(amount);

export function EmployeeTableRow({ employee, onMenuToggle }: EmployeeTableRowProps) {
    const rate = employee.rate_type === 'daily' ? employee.daily_rate : employee.basic_rate;

    return (
        <tr className="border-b transition-colors hover:bg-muted/50">
            <td className="whitespace-nowrap p-2 align-middle font-mono tabular-nums">{employee.employee_id}</td>
            <td className="whitespace-nowrap p-2 align-middle font-medium">{employee.full_name}</td>
            <td className="whitespace-nowrap p-2 align-middle font-medium">{employee.category.name}</td>
            <td className="whitespace-nowrap p-2 align-middle">
                <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium">
                    {employmentTypeLabel[employee.employment_type]}
                </span>
            </td>
            <td className="whitespace-nowrap p-2 align-middle font-mono tabular-nums">
                {formatPeso(Number(rate ?? 0))}
                <span className="ml-1 text-xs text-muted-foreground">/{employee.rate_type === 'daily' ? 'day' : 'mo'}</span>
            </td>
            <td className="whitespace-nowrap p-2 align-middle text-muted-foreground">
                {new Date(`${employee.date_hired}T00:00:00`).toLocaleDateString('en-PH', {
                    year: 'numeric', month: 'short', day: 'numeric',
                })}
            </td>
            <td className="whitespace-nowrap p-2 text-right align-middle">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(event) => onMenuToggle(employee, event)}
                >
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </td>
        </tr>
    );
}
