<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthenticationController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthenticationController::class, 'login'])->name('login.submit');

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', function () {
        return inertia('Dashboard/Index');
    })->name('dashboard');

    Route::get('/employees', [EmployeeController::class, 'index'])
        ->name('employees.index');
    Route::post('/employees', [EmployeeController::class, 'store'])
        ->name('employees.store');
    Route::put('/employees/{employee}', [EmployeeController::class, 'update'])
        ->name('employees.update');
    Route::delete('/employees/{employee}', [EmployeeController::class, 'destroy'])
        ->name('employees.destroy');
});
