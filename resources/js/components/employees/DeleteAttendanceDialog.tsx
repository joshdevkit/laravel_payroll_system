import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type DeleteAttendanceDialogProps = {
    open: boolean;
    deleting: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
};

export function DeleteAttendanceDialog({
    open,
    deleting,
    onOpenChange,
    onConfirm,
}: DeleteAttendanceDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete attendance?</DialogTitle>
                    <DialogDescription>
                        This attendance record will be permanently removed and cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={deleting}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        disabled={deleting}
                        onClick={onConfirm}
                    >
                        {deleting ? 'Deleting…' : 'Delete attendance'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
