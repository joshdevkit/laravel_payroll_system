<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionController extends Controller
{
    /**
     * Display roles and permissions.
     *
     * This controller is protected by role:manager in web.php.
     */
    public function index(): Response
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name,guard_name')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'guard_name',
            ]);

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'guard_name',
            ]);

        return inertia('RolesPermissions/Index', [
            'roleList' => $roles,
            'permissionList' => $permissions,
        ]);
    }

    /**
     * Update permissions assigned to a role.
     */
    public function update(
        Request $request,
        Role $role
    ): RedirectResponse {
        $validated = $request->validate([
            'permissions' => [
                'array',
            ],

            'permissions.*' => [
                'integer',
                'exists:permissions,id',
            ],
        ]);

        if ($role->guard_name !== 'web') {
            abort(404);
        }

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->whereIn(
                'id',
                $validated['permissions'] ?? []
            )
            ->get();

        $role->syncPermissions($permissions);

        return back()->with(
            'success',
            "Permissions for {$role->name} updated successfully."
        );
    }

    /**
     * Create a new role.
     */
    public function store(
        Request $request
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'regex:/^[a-zA-Z0-9_-]+$/',
                'unique:roles,name',
            ],
        ]);

        Role::create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        return back()->with(
            'success',
            'Role created successfully.'
        );
    }

    /**
     * Delete a role.
     */
    public function destroy(
        Role $role
    ): RedirectResponse {
        if ($role->name === 'manager') {
            return back()->with(
                'error',
                'The manager role cannot be deleted.'
            );
        }

        if ($role->guard_name !== 'web') {
            abort(404);
        }

        $role->delete();

        return back()->with(
            'success',
            'Role deleted successfully.'
        );
    }
}
