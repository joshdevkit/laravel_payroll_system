<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\EmployeeAttendanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeSssContributionController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\PayrollRunController;
use App\Http\Controllers\PayrollSettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SchedulingController;
use Illuminate\Support\Facades\Route;

Route::get('/', [AuthenticationController::class, 'showLoginForm'])->name('login');
Route::post('/login', [AuthenticationController::class, 'login'])->name('login.submit');

Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/logout', [AuthenticationController::class, 'logout'])->name('logout');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/profile/password', [ProfileController::class, 'editPassword'])->name('profile.password.edit');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password.update');

    Route::resource('employees', EmployeeController::class);

    Route::get('/employees/{employee}/attendance', [EmployeeAttendanceController::class, 'index'])->name('employees.attendance.index');
    Route::post('/employees/{employee}/attendance/import', [EmployeeAttendanceController::class, 'import'])->name('employees.attendance.import');
    Route::delete('/employees/{employee}/attendance/{attendance}', [EmployeeAttendanceController::class, 'destroy'])->name('employees.attendance.destroy');
    Route::get('/employees/{employee}/sss-contributions', [EmployeeSssContributionController::class, 'index'])->name('employees.sss-contributions.index');
    Route::patch('/employees/{employee}/sss-contributions/msc', [EmployeeSssContributionController::class, 'updateMsc'])->name('employees.sss-contributions.msc.update');

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

    Route::get('/deductions', [DeductionController::class, 'index'])->name('deductions.index');
    Route::patch('/deductions/sss-cutoff/{employee}', [DeductionController::class, 'updateSssCutoff'])->name('deductions.sss-cutoff.update');
    Route::patch('/deductions/government-cutoffs/{employee}', [DeductionController::class, 'updateGovernmentCutoffs'])->name('deductions.government-cutoffs.update');

    // Keep the old URL working for existing bookmarks while the UI moves to /deductions.
    Route::redirect('/sss-deductions', '/deductions');

    Route::get('/holidays', [HolidayController::class, 'index'])->name('holidays.index');
    Route::post('/holidays', [HolidayController::class, 'store'])->name('holidays.store');
    Route::put('/holidays/{holiday}', [HolidayController::class, 'update'])->name('holidays.update');
    Route::delete('/holidays/{holiday}', [HolidayController::class, 'destroy'])->name('holidays.destroy');
    Route::post('/holidays/sync', [HolidayController::class, 'sync'])->name('holidays.sync');

    Route::get('/settings', [PayrollSettingsController::class, 'index'])->name('settings.index');
    Route::put('/settings', [PayrollSettingsController::class, 'update'])->name('settings.update');

    Route::post('/categories', [CategoryController::class, 'store'])
        ->name('categories.store');

    Route::put('/categories/{category}', [CategoryController::class, 'update'])
        ->name('categories.update');

    Route::delete('/categories/{category}', [CategoryController::class, 'destroy'])
        ->name('categories.destroy');
});
