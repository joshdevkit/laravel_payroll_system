import { Link } from '@inertiajs/react';
import type { Employee } from './EmployeeFormDialog';

type EmployeeActionsMenuProps = {
    employee: Employee;
    position: { top: number; left: number };
    onClose: () => void;
    onEdit: (employee: Employee) => void;
    onDelete: (employee: Employee) => void;
};

export function EmployeeActionsMenu({ employee, position, onClose, onEdit, onDelete }: EmployeeActionsMenuProps) {
    return (
        <div
            className="fixed z-[9999] w-48 rounded-md border bg-popover p-1 text-popover-foreground shadow-lg"
            style={{ top: position.top, left: position.left }}
            onClick={(event) => event.stopPropagation()}
        >
            <Link
                href={`/employees/${employee.id}/attendance`}
                className="flex rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={onClose}
            >
                View attendance
            </Link>
            <Link
                href={`/employees/${employee.id}/sss-contributions`}
                className="flex rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={onClose}
            >
                View contributions
            </Link>
            <button
                type="button"
                className="flex w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => onEdit(employee)}
            >
                Edit
            </button>
            <button
                type="button"
                className="flex w-full rounded-sm px-3 py-2 text-left text-sm text-destructive hover:bg-muted"
                onClick={() => onDelete(employee)}
            >
                Delete
            </button>
        </div>
    );
}
