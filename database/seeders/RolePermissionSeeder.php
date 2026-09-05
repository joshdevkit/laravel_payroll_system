<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Reset Spatie permission cache
        |--------------------------------------------------------------------------
        */

        app()[PermissionRegistrar::class]->forgetCachedPermissions();



        /*
        |--------------------------------------------------------------------------
        | Permissions
        |--------------------------------------------------------------------------
        */

        $permissions = [

            // Dashboard
            'dashboard.view',

            // Profile
            'profile.view',
            'profile.update',
            'profile.password.update',

            // Employees
            'employees.view',
            'employees.create',
            'employees.update',
            'employees.delete',

            // Attendance
            'attendance.view',
            'attendance.create',
            'attendance.update',
            'attendance.delete',

            // Scheduling
            'scheduling.view',
            'scheduling.create',
            'scheduling.update',
            'scheduling.delete',

            // Holidays
            'holidays.view',
            'holidays.create',
            'holidays.update',
            'holidays.delete',
            'holidays.sync',

            // Departments
            'departments.view',
            'departments.create',
            'departments.update',
            'departments.delete',

            // Branches
            'branches.view',
            'branches.create',
            'branches.update',
            'branches.delete',

            // Payroll
            'payroll.view',
            'payroll.create',
            'payroll.update',
            'payroll.confirm',
            'payroll.delete',

            // Deductions
            'deductions.view',
            'deductions.update',

            // SSS Contributions
            'sss_contributions.view',
            'sss_contributions.update',

            // Loans / Cash Advances
            'loans.view',
            'loans.create',
            'loans.update',
            'loans.delete',

            // Reports
            'reports.view',

            // Settings
            'settings.view',
            'settings.update',

            // Users
            'users.view',
            'users.create',
            'users.update',
            'users.delete',

            // Roles
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
        ];


        /*
        |--------------------------------------------------------------------------
        | Create Permissions
        |--------------------------------------------------------------------------
        */

        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | Create Roles
        |--------------------------------------------------------------------------
        */

        $manager = Role::firstOrCreate([
            'name' => 'manager',
            'guard_name' => 'web',
        ]);

        $timeKeeping = Role::firstOrCreate([
            'name' => 'time_keeping',
            'guard_name' => 'web',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Manager
        |--------------------------------------------------------------------------
        |
        | Manager has absolutely everything.
        |
        */

        $manager->syncPermissions(
            Permission::where('guard_name', 'web')->get()
        );


        /*
        |--------------------------------------------------------------------------
        | Time Keeping
        |--------------------------------------------------------------------------
        |
        | Time Keeping can:
        |
        | - View dashboard
        | - View employees
        | - View attendance
        | - View schedules
        | - Delete schedules
        | - Create schedules
        | - View holidays
        | - View departments
        | - View branches
        | - Manage own profile
        | - Change own password
        |
        */

        $timeKeeping->syncPermissions([

            // Dashboard
            'dashboard.view',

            // Profile
            'profile.view',
            'profile.update',
            'profile.password.update',

            // Employees
            'employees.view',

            // Attendance
            'attendance.view',

            // Scheduling
            'scheduling.view',
            'scheduling.create',
            'scheduling.delete',
            // Holidays
            'holidays.view',

            // Departments
            'departments.view',

            // Branches
            'branches.view',
        ]);


        /*
        |--------------------------------------------------------------------------
        | Refresh Permission Cache
        |--------------------------------------------------------------------------
        */

        /*
        |--------------------------------------------------------------------------
        | Assign Roles to Default Users
        |--------------------------------------------------------------------------
        |
        | User #1 = Manager
        | User #2 = Time Keeping
        |
        | Only create the assignment if it does not already exist.
        |
        */

        $managerUser = User::find(1);

        if ($managerUser) {
            $alreadyManager = DB::table('model_has_roles')
                ->where('role_id', $manager->id)
                ->where('model_type', User::class)
                ->where('model_id', $managerUser->id)
                ->exists();

            if (!$alreadyManager) {
                $managerUser->assignRole($manager);
            }
        }


        $timeKeepingUser = User::find(2);

        if ($timeKeepingUser) {
            $alreadyTimeKeeping = DB::table('model_has_roles')
                ->where('role_id', $timeKeeping->id)
                ->where('model_type', User::class)
                ->where('model_id', $timeKeepingUser->id)
                ->exists();

            if (!$alreadyTimeKeeping) {
                $timeKeepingUser->assignRole($timeKeeping);
            }
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
