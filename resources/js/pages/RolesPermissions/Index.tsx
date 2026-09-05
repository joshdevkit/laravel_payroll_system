import { useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import {
    Check,
    ChevronDown,
    ChevronRight,
    KeyRound,
    Plus,
    ShieldCheck,
    Trash2,
    UsersRound,
} from "lucide-react";

import AuthenticatedLayout from "@/components/layout/AuthenticatedLayout";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Permission = {
    id: number;
    name: string;
    guard_name: string;
};

type Role = {
    id: number;
    name: string;
    guard_name: string;
    permissions: Permission[];
};

type PageProps = {
    roleList: Role[];
    permissionList: Permission[];
};

type PermissionGroup = {
    label: string;
    permissions: Permission[];
};

const groupLabels: Record<string, string> = {
    dashboard: "Dashboard",
    employees: "Employees",
    attendance: "Attendance",
    scheduling: "Scheduling",
    payroll: "Payroll",
    deductions: "Deductions",
    holidays: "Holidays",
    categories: "Departments",
    branches: "Branches",
    loans: "Loans & Cash Advances",
    sss_contributions: "SSS Contributions",
    settings: "Payroll Settings",
    profile: "Profile",
};

function getPermissionGroup(permission: Permission): string {
    const [group] = permission.name.split(".");

    return group;
}

function formatPermissionName(permission: Permission): string {
    const [, action = permission.name] = permission.name.split(".");

    switch (action) {
        case "view":
            return "View";

        case "create":
            return "Create";

        case "update":
            return "Update";

        case "delete":
            return "Delete";

        case "import":
            return "Import";

        case "confirm":
            return "Confirm";

        case "sync":
            return "Sync";

        default:
            return action
                .replace(/_/g, " ")
                .replace(/\b\w/g, (letter) =>
                    letter.toUpperCase(),
                );
    }
}

function formatRoleName(name: string): string {
    return name
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase(),
        );
}

function groupPermissions(
    permissions: Permission[],
): PermissionGroup[] {
    const groups = new Map<string, Permission[]>();

    for (const permission of permissions) {
        const group = getPermissionGroup(permission);

        if (!groups.has(group)) {
            groups.set(group, []);
        }

        groups.get(group)!.push(permission);
    }

    return Array.from(groups.entries()).map(
        ([group, groupedPermissions]) => ({
            label:
                groupLabels[group] ??
                group
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (letter) =>
                        letter.toUpperCase(),
                    ),

            permissions: groupedPermissions,
        }),
    );
}

export default function RolesPermissions() {
    const { roleList: roles, permissionList: permissions } =
        usePage<PageProps>().props;

    const [selectedRoleId, setSelectedRoleId] =
        useState<number | null>(
            roles.length > 0 ? roles[0].id : null,
        );

    const [expandedGroups, setExpandedGroups] =
        useState<Record<string, boolean>>({});

    const [newRoleName, setNewRoleName] =
        useState("");

    const [creatingRole, setCreatingRole] =
        useState(false);

    const selectedRole = useMemo(
        () =>
            roles.find(
                (role) =>
                    role.id === selectedRoleId,
            ) ?? null,
        [roles, selectedRoleId],
    );

    const permissionGroups = useMemo(
        () => groupPermissions(permissions),
        [permissions],
    );

    const selectedPermissionIds = useMemo(
        () =>
            new Set(
                selectedRole?.permissions.map(
                    (permission) =>
                        permission.id,
                ) ?? [],
            ),
        [selectedRole],
    );

    const toggleGroup = (group: string) => {
        setExpandedGroups((current) => ({
            ...current,
            [group]: !current[group],
        }));
    };

    const isGroupExpanded = (group: string) => {
        return expandedGroups[group] ?? true;
    };

    const hasPermission = (permissionId: number) => {
        return selectedPermissionIds.has(
            permissionId,
        );
    };

    const togglePermission = (
        permissionId: number,
    ) => {
        if (!selectedRole) {
            return;
        }

        const currentIds = new Set(
            selectedRole.permissions.map(
                (permission) =>
                    permission.id,
            ),
        );

        if (currentIds.has(permissionId)) {
            currentIds.delete(permissionId);
        } else {
            currentIds.add(permissionId);
        }

        const nextPermissions = permissions.filter(
            (permission) =>
                currentIds.has(permission.id),
        );

        const nextRole = {
            ...selectedRole,
            permissions: nextPermissions,
        };

        /*
         * We cannot directly mutate Inertia props,
         * so this UI keeps a temporary local state below.
         */
        setLocalRole(nextRole);
    };

    const [
        localRole,
        setLocalRole,
    ] = useState<Role | null>(null);

    const activeRole =
        localRole?.id === selectedRole?.id
            ? localRole
            : selectedRole;

    const activePermissionIds = useMemo(
        () =>
            new Set(
                activeRole?.permissions.map(
                    (permission) =>
                        permission.id,
                ) ?? [],
            ),
        [activeRole],
    );

    const savePermissions = () => {
        if (!activeRole) {
            return;
        }

        router.put(
            `/roles-permissions/${activeRole.id}`,
            {
                permissions:
                    Array.from(
                        activePermissionIds,
                    ),
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setLocalRole(null);
                },
            },
        );
    };

    const selectRole = (role: Role) => {
        setSelectedRoleId(role.id);
        setLocalRole(null);
    };

    const selectAll = () => {
        if (!activeRole) {
            return;
        }

        setLocalRole({
            ...activeRole,
            permissions: [...permissions],
        });
    };

    const clearAll = () => {
        if (!activeRole) {
            return;
        }

        setLocalRole({
            ...activeRole,
            permissions: [],
        });
    };

    const toggleGroupPermissions = (
        groupPermissions: Permission[],
    ) => {
        if (!activeRole) {
            return;
        }

        const currentIds = new Set(
            activeRole.permissions.map(
                (permission) =>
                    permission.id,
            ),
        );

        const allSelected =
            groupPermissions.every(
                (permission) =>
                    currentIds.has(
                        permission.id,
                    ),
            );

        if (allSelected) {
            groupPermissions.forEach(
                (permission) => {
                    currentIds.delete(
                        permission.id,
                    );
                },
            );
        } else {
            groupPermissions.forEach(
                (permission) => {
                    currentIds.add(
                        permission.id,
                    );
                },
            );
        }

        setLocalRole({
            ...activeRole,
            permissions: permissions.filter(
                (permission) =>
                    currentIds.has(
                        permission.id,
                    ),
            ),
        });
    };

    const createRole = () => {
        const name =
            newRoleName.trim();

        if (!name) {
            return;
        }

        setCreatingRole(true);

        router.post(
            "/roles-permissions",
            {
                name,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setNewRoleName("");
                },
                onFinish: () => {
                    setCreatingRole(false);
                },
            },
        );
    };

    const deleteRole = (role: Role) => {
        if (role.name === "manager") {
            return;
        }

        if (
            !window.confirm(
                `Delete the ${formatRoleName(
                    role.name,
                )} role?`,
            )
        ) {
            return;
        }

        router.delete(
            `/roles-permissions/${role.id}`,
            {
                preserveScroll: true,
                onSuccess: () => {
                    if (
                        selectedRoleId ===
                        role.id
                    ) {
                        const remaining =
                            roles.filter(
                                (item) =>
                                    item.id !==
                                    role.id,
                            );

                        setSelectedRoleId(
                            remaining[0]
                                ?.id ?? null,
                        );
                    }
                },
            },
        );
    };

    return (
        <>
            <Header
                title="Roles & Permissions"
                description="Manage user roles and access permissions."
            />
            <AuthenticatedLayout>
                <div className="min-h-svh bg-background font-sans">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                                Administration
                            </p>

                            <h1 className="mt-1 font-display text-2xl font-bold text-foreground sm:text-3xl">
                                Roles & Permissions
                            </h1>

                            <p className="mt-1 text-sm text-muted-foreground">
                                Control what each role can access.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                        {/* Roles */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <UsersRound className="h-4 w-4 text-primary" />
                                    Roles
                                </CardTitle>

                                <CardDescription>
                                    Select a role to manage its permissions.
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-2">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() =>
                                            selectRole(role)
                                        }
                                        className={[
                                            "flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left transition-colors",
                                            selectedRoleId ===
                                            role.id
                                                ? "border-primary/30 bg-primary/5"
                                                : "border-transparent hover:bg-muted",
                                        ].join(" ")}
                                    >
                                        <div className="flex min-w-0 items-center gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                                <ShieldCheck className="h-4 w-4 text-primary" />
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {formatRoleName(
                                                        role.name,
                                                    )}
                                                </p>

                                                <p className="text-xs text-muted-foreground">
                                                    {
                                                        role.permissions
                                                            .length
                                                    }{" "}
                                                    permissions
                                                </p>
                                            </div>
                                        </div>

                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    </button>
                                ))}

                                <div className="mt-4 border-t pt-4">
                                    <div className="space-y-2">
                                        <Input
                                            value={
                                                newRoleName
                                            }
                                            onChange={(
                                                event,
                                            ) =>
                                                setNewRoleName(
                                                    event
                                                        .target
                                                        .value,
                                                )
                                            }
                                            placeholder="New role name"
                                            onKeyDown={(
                                                event,
                                            ) => {
                                                if (
                                                    event.key ===
                                                    "Enter"
                                                ) {
                                                    createRole();
                                                }
                                            }}
                                        />

                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full"
                                            disabled={
                                                creatingRole ||
                                                !newRoleName.trim()
                                            }
                                            onClick={
                                                createRole
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add role
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Permissions */}
                        <Card>
                            {!activeRole ? (
                                <CardContent className="flex min-h-[400px] items-center justify-center">
                                    <div className="text-center">
                                        <KeyRound className="mx-auto h-8 w-8 text-muted-foreground" />

                                        <p className="mt-3 text-sm font-medium">
                                            No role selected
                                        </p>

                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Select a role to manage permissions.
                                        </p>
                                    </div>
                                </CardContent>
                            ) : (
                                <>
                                    <CardHeader className="border-b">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <KeyRound className="h-4 w-4 text-primary" />

                                                    {formatRoleName(
                                                        activeRole.name,
                                                    )}
                                                </CardTitle>

                                                <CardDescription>
                                                    {
                                                        activePermissionIds.size
                                                    }{" "}
                                                    of{" "}
                                                    {
                                                        permissions.length
                                                    }{" "}
                                                    permissions enabled
                                                </CardDescription>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={
                                                        selectAll
                                                    }
                                                >
                                                    Select all
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={
                                                        clearAll
                                                    }
                                                >
                                                    Clear all
                                                </Button>

                                                {activeRole.name !==
                                                    "manager" && (
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() =>
                                                            deleteRole(
                                                                activeRole,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete role
                                                    </Button>
                                                )}

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={
                                                        savePermissions
                                                    }
                                                >
                                                    <Check className="mr-2 h-4 w-4" />
                                                    Save permissions
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-0">
                                        <div className="divide-y">
                                            {permissionGroups.map(
                                                (
                                                    group,
                                                ) => {
                                                    const allSelected =
                                                        group.permissions.every(
                                                            (
                                                                permission,
                                                            ) =>
                                                                activePermissionIds.has(
                                                                    permission.id,
                                                                ),
                                                        );

                                                    const someSelected =
                                                        group.permissions.some(
                                                            (
                                                                permission,
                                                            ) =>
                                                                activePermissionIds.has(
                                                                    permission.id,
                                                                ),
                                                        );

                                                    const expanded =
                                                        isGroupExpanded(
                                                            group.label,
                                                        );

                                                    return (
                                                        <div
                                                            key={
                                                                group.label
                                                            }
                                                        >
                                                            <div className="flex items-center justify-between gap-4 px-5 py-4">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleGroup(
                                                                            group.label,
                                                                        )
                                                                    }
                                                                    className="flex min-w-0 items-center gap-2 text-left"
                                                                >
                                                                    {expanded ? (
                                                                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                    ) : (
                                                                        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                                    )}

                                                                    <span className="text-sm font-semibold">
                                                                        {
                                                                            group.label
                                                                        }
                                                                    </span>

                                                                    <span className="text-xs text-muted-foreground">
                                                                        (
                                                                        {
                                                                            group
                                                                                .permissions
                                                                                .length
                                                                        }
                                                                        )
                                                                    </span>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        toggleGroupPermissions(
                                                                            group.permissions,
                                                                        )
                                                                    }
                                                                    className="text-xs font-medium text-primary hover:underline"
                                                                >
                                                                    {allSelected
                                                                        ? "Clear"
                                                                        : "Select all"}
                                                                </button>
                                                            </div>

                                                            {expanded && (
                                                                <div className="grid gap-2 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-3">
                                                                    {group.permissions.map(
                                                                        (
                                                                            permission,
                                                                        ) => {
                                                                            const checked =
                                                                                activePermissionIds.has(
                                                                                    permission.id,
                                                                                );

                                                                            return (
                                                                                <button
                                                                                    key={
                                                                                        permission.id
                                                                                    }
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        togglePermission(
                                                                                            permission.id,
                                                                                        )
                                                                                    }
                                                                                    className={[
                                                                                        "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                                                                                        checked
                                                                                            ? "border-primary/30 bg-primary/5"
                                                                                            : "hover:bg-muted",
                                                                                    ].join(
                                                                                        " ",
                                                                                    )}
                                                                                >
                                                                                    <div
                                                                                        className={[
                                                                                            "flex h-5 w-5 shrink-0 items-center justify-center rounded border",
                                                                                            checked
                                                                                                ? "border-primary bg-primary text-primary-foreground"
                                                                                                : "border-input",
                                                                                        ].join(
                                                                                            " ",
                                                                                        )}
                                                                                    >
                                                                                        {checked && (
                                                                                            <Check className="h-3.5 w-3.5" />
                                                                                        )}
                                                                                    </div>

                                                                                    <span className="text-sm">
                                                                                        {formatPermissionName(
                                                                                            permission,
                                                                                        )}
                                                                                    </span>
                                                                                </button>
                                                                            );
                                                                        },
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    </CardContent>
                                </>
                            )}
                        </Card>
                    </div>
                </div>
            </AuthenticatedLayout>
        </>
    );
}