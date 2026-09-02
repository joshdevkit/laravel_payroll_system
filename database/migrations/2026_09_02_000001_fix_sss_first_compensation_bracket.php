<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('sss_contribution_tables')
            ->where('effective_from', '2025-01-01')
            ->where('compensation_min', 0)
            ->update([
                'compensation_max' => 5249.99,
            ]);
    }

    public function down(): void
    {
        DB::table('sss_contribution_tables')
            ->where('effective_from', '2025-01-01')
            ->where('compensation_min', 0)
            ->update([
                'compensation_max' => 499.99,
            ]);
    }
};
