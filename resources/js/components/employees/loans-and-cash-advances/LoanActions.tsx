import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { LoanAndCashAdvance } from "@/types/loans";

interface Props {
    loan: LoanAndCashAdvance;
    onView: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function LoanActions({
    loan,
    onView,
    onEdit,
    onDelete,
}: Props) {
    return (
        <DropdownMenu>
            {/*
                NOTE: this project's dropdown-menu is built on Base UI,
                not Radix — Base UI's Menu.Trigger always renders its own
                <button>, so passing a shadcn <Button> as an `asChild`
                child produces a nested <button> (hydration error). The
                fix is to render the trigger as a plain element styled
                with buttonVariants(), so there's exactly one <button>.
            */}
            <DropdownMenuTrigger
                type="button"
                className={cn(
                    buttonVariants({ variant: "ghost", size: "icon" }),
                    "h-8 w-8",
                )}
                aria-label={`Actions for ${loan.reference_no ?? "record"}`}
            >
                <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onView}>
                    <Eye className="mr-2 h-4 w-4" />
                    View History
                </DropdownMenuItem>

                <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive focus:text-destructive"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}