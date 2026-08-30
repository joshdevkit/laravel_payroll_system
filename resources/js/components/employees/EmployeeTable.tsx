import type { Employee } from './EmployeeFormDialog';
import { EmployeeTableRow } from './EmployeeTableRow';

type EmployeeTableProps = {
    employees: Employee[];
    onMenuToggle: (employee: Employee, event: React.MouseEvent<HTMLButtonElement>) => void;
};

export function EmployeeTable({ employees, onMenuToggle }: EmployeeTableProps) {
    return (
        <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
                <tr>
                    <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">Emp ID</th>
                    <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">Name</th>
                    <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">Type</th>
                    <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">Rate</th>
                    <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground">Date hired</th>
                    <th className="h-10 whitespace-nowrap px-2 text-right align-middle font-medium text-foreground">Actions</th>
                </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
                {employees.map((employee) => (
                    <EmployeeTableRow
                        key={employee.id}
                        employee={employee}
                        onMenuToggle={onMenuToggle}
                    />
                ))}
            </tbody>
        </table>
    );
}
