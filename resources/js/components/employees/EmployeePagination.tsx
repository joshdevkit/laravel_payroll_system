import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type EmployeePaginationProps = {
    page: number;
    pageCount: number;
    firstRecord: number;
    lastRecord: number;
    total: number;
    onPrevious: () => void;
    onNext: () => void;
};

export function EmployeePagination({ page, pageCount, firstRecord, lastRecord, total, onPrevious, onNext }: EmployeePaginationProps) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
                Showing {firstRecord}–{lastRecord} of {total} employees
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onPrevious} disabled={page === 1}>
                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                    Page {page} of {pageCount}
                </span>
                <Button variant="outline" size="sm" onClick={onNext} disabled={page === pageCount}>
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
