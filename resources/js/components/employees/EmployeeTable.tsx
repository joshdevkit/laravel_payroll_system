import type { Employee } from './EmployeeFormDialog';
import { EmployeeTableRow } from './EmployeeTableRow';

type EmployeeTableProps = {
    employees: Employee[];
    onMenuToggle: (
        employee: Employee,
        event: React.MouseEvent<HTMLButtonElement>,
    ) => void;
};

export function EmployeeTable({ employees, onMenuToggle }: EmployeeTableProps) {
    return (
        <div className="w-full overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[760px] caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                    <tr>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Emp ID
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Name
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Branch
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Department
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Type
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Rate
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-left align-middle font-medium text-foreground sm:px-4">
                            Date hired
                        </th>
                        <th className="h-10 whitespace-nowrap px-2 text-right align-middle font-medium text-foreground sm:px-4">
                            Actions
                        </th>
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
        </div>
    );
}
