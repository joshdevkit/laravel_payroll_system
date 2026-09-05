<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->date('birthday')->nullable()->after('rate_type');
            $table->text('place_of_birth')->nullable()->after('birthday');
            $table->enum('sex', ['male', 'female'])->nullable()->after('place_of_birth');
            $table->enum('civil_status',['single', 'married', 'widow', 'separated'])->nullable()->after('sex');
            $table->text('nationality')->nullable()->after('civil_status'); 
            $table->text('home_address')->nullable()->after('nationality'); 
            $table->text('contact_number')->nullable()->after('home_address'); 
            $table->text('email_address')->nullable()->after('contact_number');
            $table->boolean('is_cola_eligible')->after('contact_number')->default(0); 
            $table->decimal('cola_amount', 11,2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
             $table->dropColumn([
                'birthday',
                'place_of_birth',
                'sex',
                'civil_status',
                'nationality',
                'home_address',
                'contact_number',
                'email_address',
                'is_cola_eligible',
                'cola_amount'
            ]);
        });
    }
};
