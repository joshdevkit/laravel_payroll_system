<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class UserSeedeer extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Get Time Keeping Role
        |--------------------------------------------------------------------------
        */

        $timeKeepingRole = Role::firstOrCreate([
            'name' => 'time_keeping',
            'guard_name' => 'web',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Create Time Keeping User
        |--------------------------------------------------------------------------
        */

        $user = User::updateOrCreate(
            [
                'email' => 'emman@gmail.com',
            ],
            [
                'name' => 'Emman Pogi',
                'password' => Hash::make('emman123'),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | Assign Role
        |--------------------------------------------------------------------------
        */

        $user->syncRoles([
            $timeKeepingRole,
        ]);
    }
}
