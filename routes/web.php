<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollSettingsController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthenticationController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthenticationController::class, 'login'])->name('login.submit');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return inertia('Dashboard/Index');
    })->name('dashboard');

    Route::post('/logout', [AuthenticationController::class, 'logout'])->name('logout');
    Route::resource('employees', EmployeeController::class);
    Route::get('/settings', [PayrollSettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings', [PayrollSettingsController::class, 'update'])->name('settings.update');
});
