import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type EmployeeSearchProps = {
    value: string;
    onChange: (value: string) => void;
};

export function EmployeeSearch({ value, onChange }: EmployeeSearchProps) {
    return (
        <div className="relative mt-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder="Search by name…"
                className="pl-9"
                value={value}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}
