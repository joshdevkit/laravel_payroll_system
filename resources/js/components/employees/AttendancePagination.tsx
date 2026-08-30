import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type AttendancePaginationProps = {
    page: number;
    pageCount: number;
    pageSize: number;
    totalRecords: number;
    onPageChange: (page: number) => void;
};

export function AttendancePagination({
    page,
    pageCount,
    pageSize,
    totalRecords,
    onPageChange,
}: AttendancePaginationProps) {
    if (totalRecords === 0) return null;

    const firstRecord = (page - 1) * pageSize + 1;
    const lastRecord = Math.min(page * pageSize, totalRecords);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
                Showing {firstRecord}–{lastRecord} of {totalRecords} attendance records
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                </Button>
                <span className="px-2 text-sm text-muted-foreground">
                    Page {page} of {pageCount}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(pageCount, page + 1))}
                    disabled={page === pageCount}
                >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
