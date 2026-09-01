<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmployeeAttendanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\PayrollRunController;
use App\Http\Controllers\PayrollSettingsController;
use App\Http\Controllers\SchedulingController;
use App\Http\Controllers\SssDeductionController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthenticationController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthenticationController::class, 'login'])->name('login.submit');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [AuthenticationController::class, 'logout'])->name('logout');
    Route::resource('employees', EmployeeController::class);

    Route::get('/employees/{employee}/attendance', [EmployeeAttendanceController::class, 'index'])->name('employees.attendance.index');
    Route::post('/employees/{employee}/attendance/import', [EmployeeAttendanceController::class, 'import'])->name('employees.attendance.import');
    Route::delete('/employees/{employee}/attendance/{attendance}', [EmployeeAttendanceController::class, 'destroy'])->name('employees.attendance.destroy');

    Route::get('/scheduling', [SchedulingController::class, 'index'])->name('schedules.index');
    Route::post('/scheduling', [SchedulingController::class, 'store'])->name('schedules.store');
    Route::post('/scheduling/bulk', [SchedulingController::class, 'bulkStore'])->name('schedules.bulk-store');
    Route::put('/scheduling/{schedule}', [SchedulingController::class, 'update'])->name('schedules.update');
    Route::delete('/scheduling/{schedule}', [SchedulingController::class, 'destroy'])->name('schedules.destroy');

    Route::get('/payroll', [PayrollRunController::class, 'index'])->name('payroll.index');
    Route::post('/payroll', [PayrollRunController::class, 'store'])->name('payroll.store');
    Route::get('/payroll/{payrollRun}', [PayrollRunController::class, 'show'])->name('payroll.show');
    Route::patch('/payroll/{payrollRun}/confirm', [PayrollRunController::class, 'confirm'])->name('payroll.confirm');
    Route::delete('/payroll/{payrollRun}', [PayrollRunController::class, 'destroy'])->name('payroll.destroy');

    Route::resource('sss-deductions', SssDeductionController::class)->except(['show', 'create', 'edit']);

    Route::get('/settings', [PayrollSettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings', [PayrollSettingsController::class, 'update'])->name('settings.update');
});
