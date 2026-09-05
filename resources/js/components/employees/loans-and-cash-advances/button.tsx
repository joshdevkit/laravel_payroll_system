import { Button } from "@/components/ui/button";

export default function FilterButton({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <Button
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={onClick}
        >
            {children}
        </Button>
    );
}