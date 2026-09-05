import { usePage } from '@inertiajs/react';

type AuthUser = {
    id: number;
    name: string;
    email: string;
};

type PageProps = {
    auth: {
        user: AuthUser;
    };
    roles?: string[];
    permissions?: string[];
};

export function useAuthorization() {
    const { props } = usePage<PageProps>();

    const auth = props.auth;

    const roles = Array.isArray(props.roles)
        ? props.roles
        : [];

    const permissions = Array.isArray(props.permissions)
        ? props.permissions
        : [];

    const hasRole = (role: string): boolean => {
        return roles.includes(role);
    };

    const hasAnyRole = (requiredRoles: string[]): boolean => {
        return requiredRoles.some((role) => roles.includes(role));
    };

    const hasPermission = (permission: string): boolean => {
        return permissions.includes(permission);
    };

    const hasAnyPermission = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.some((permission) =>
            permissions.includes(permission),
        );
    };

    const hasAllPermissions = (requiredPermissions: string[]): boolean => {
        return requiredPermissions.every((permission) =>
            permissions.includes(permission),
        );
    };

    /**
     * Managers have unrestricted navigation access.
     */
    const canAccess = (permission?: string, role?: string): boolean => {
        // Manager can access everything
        if (hasRole('manager')) {
            return true;
        }

        // Specific role requirement
        if (role && !hasRole(role)) {
            return false;
        }

        // Specific permission requirement
        if (permission) {
            return hasPermission(permission);
        }

        return true;
    };

    return {
        auth,
        roles,
        permissions,
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccess,
    };
}