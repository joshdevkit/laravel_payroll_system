<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Category;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'IT Department',
            'Canteen',
            'Maxi',
        ];

        foreach ($categories as $name) {
            Category::firstOrCreate([
                'name' => $name,
            ]);
        }
    }
}
