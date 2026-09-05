<?php

use App\Http\Controllers\AuthenticationController;
use App\Http\Controllers\BranchController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\EmployeeAttendanceController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeSssContributionController;
use App\Http\Controllers\HolidayController;
use App\Http\Controllers\LoanAndCashAdvanceController;
use App\Http\Controllers\PayrollRunController;
use App\Http\Controllers\PayrollSettingsController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RolePermissionController;
use App\Http\Controllers\SchedulingController;
use Illuminate\Support\Facades\Route;

Route::get(
    '/',
    [AuthenticationController::class, 'showLoginForm']
)->name('login');

Route::post(
    '/login',
    [AuthenticationController::class, 'login']
)->name('login.submit');


Route::middleware(['auth'])->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    Route::post(
        '/logout',
        [AuthenticationController::class, 'logout']
    )->name('logout');


    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:dashboard.view')->group(function () {

        Route::get(
            '/dashboard',
            [DashboardController::class, 'index']
        )->name('dashboard');
    });


    /*
    |--------------------------------------------------------------------------
    | Profile
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:profile.view')->group(function () {

        Route::get(
            '/profile',
            [ProfileController::class, 'edit']
        )->name('profile.edit');
    });

    Route::middleware('permission:profile.update')->group(function () {

        Route::put(
            '/profile',
            [ProfileController::class, 'update']
        )->name('profile.update');
    });

    Route::middleware('permission:profile.password.update')->group(function () {

        Route::get(
            '/profile/password',
            [ProfileController::class, 'editPassword']
        )->name('profile.password.edit');

        Route::put(
            '/profile/password',
            [ProfileController::class, 'updatePassword']
        )->name('profile.password.update');
    });


    /*
    |--------------------------------------------------------------------------
    | Employees - VIEW
    |--------------------------------------------------------------------------
    |
    | time_keeping can access employee pages because attendance
    | is accessed through the employee page.
    |
    */

    Route::middleware('permission:employees.view')->group(function () {

        Route::get(
            '/employees',
            [EmployeeController::class, 'index']
        )->name('employees.index');

        Route::get(
            '/employees/{employee}',
            [EmployeeController::class, 'show']
        )->name('employees.show');
    });


    /*
    |--------------------------------------------------------------------------
    | Employees - CREATE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:employees.create')->group(function () {

        Route::post(
            '/employees',
            [EmployeeController::class, 'store']
        )->name('employees.store');
    });


    /*
    |--------------------------------------------------------------------------
    | Employees - UPDATE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:employees.update')->group(function () {

        Route::put(
            '/employees/{employee}',
            [EmployeeController::class, 'update']
        )->name('employees.update');

        Route::patch(
            '/employees/{employee}',
            [EmployeeController::class, 'update']
        )->name('employees.patch');
    });


    /*
    |--------------------------------------------------------------------------
    | Employees - DELETE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:employees.delete')->group(function () {

        Route::delete(
            '/employees/{employee}',
            [EmployeeController::class, 'destroy']
        )->name('employees.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | Employee Attendance - VIEW
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:attendance.view')->group(function () {

        Route::get(
            '/employees/{employee}/attendance',
            [EmployeeAttendanceController::class, 'index']
        )->name('employees.attendance.index');
    });


    /*
    |--------------------------------------------------------------------------
    | Employee Attendance - IMPORT
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:attendance.import')->group(function () {

        Route::post(
            '/employees/{employee}/attendance/import',
            [EmployeeAttendanceController::class, 'import']
        )->name('employees.attendance.import');
    });


    /*
    |--------------------------------------------------------------------------
    | Employee Attendance - DELETE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:attendance.delete')->group(function () {

        Route::delete(
            '/employees/{employee}/attendance/{attendance}',
            [EmployeeAttendanceController::class, 'destroy']
        )->name('employees.attendance.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | SSS Contributions
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:sss_contributions.view')->group(function () {

        Route::get(
            '/employees/{employee}/sss-contributions',
            [EmployeeSssContributionController::class, 'index']
        )->name('employees.sss-contributions.index');
    });

    Route::middleware('permission:sss_contributions.update')->group(function () {

        Route::patch(
            '/employees/{employee}/sss-contributions/msc',
            [EmployeeSssContributionController::class, 'updateMsc']
        )->name('employees.sss-contributions.msc.update');
    });


    /*
    |--------------------------------------------------------------------------
    | Scheduling - VIEW
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:scheduling.view')->group(function () {

        Route::get(
            '/scheduling',
            [SchedulingController::class, 'index']
        )->name('schedules.index');
    });


    /*
    |--------------------------------------------------------------------------
    | Scheduling - CREATE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:scheduling.create')->group(function () {

        Route::post(
            '/scheduling',
            [SchedulingController::class, 'store']
        )->name('schedules.store');

        Route::post(
            '/scheduling/bulk',
            [SchedulingController::class, 'bulkStore']
        )->name('schedules.bulk-store');
    });


    /*
    |--------------------------------------------------------------------------
    | Scheduling - UPDATE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:scheduling.update')->group(function () {

        Route::put(
            '/scheduling/{schedule}',
            [SchedulingController::class, 'update']
        )->name('schedules.update');
    });


    /*
    |--------------------------------------------------------------------------
    | Scheduling - DELETE
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:scheduling.delete')->group(function () {

        Route::delete(
            '/scheduling/{schedule}',
            [SchedulingController::class, 'destroy']
        )->name('schedules.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | Payroll
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:payroll.view')->group(function () {

        Route::get(
            '/payroll',
            [PayrollRunController::class, 'index']
        )->name('payroll.index');

        Route::get(
            '/payroll/{payrollRun}',
            [PayrollRunController::class, 'show']
        )->name('payroll.show');
    });


    Route::middleware('permission:payroll.create')->group(function () {

        Route::post(
            '/payroll',
            [PayrollRunController::class, 'store']
        )->name('payroll.store');
    });


    Route::middleware('permission:payroll.confirm')->group(function () {

        Route::patch(
            '/payroll/{payrollRun}/confirm',
            [PayrollRunController::class, 'confirm']
        )->name('payroll.confirm');
    });


    Route::middleware('permission:payroll.delete')->group(function () {

        Route::delete(
            '/payroll/{payrollRun}',
            [PayrollRunController::class, 'destroy']
        )->name('payroll.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | Deductions
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:deductions.view')->group(function () {

        Route::get(
            '/deductions',
            [DeductionController::class, 'index']
        )->name('deductions.index');
    });

    Route::middleware('permission:deductions.update')->group(function () {

        Route::patch(
            '/deductions/sss-cutoff/{employee}',
            [DeductionController::class, 'updateSssCutoff']
        )->name('deductions.sss-cutoff.update');

        Route::patch(
            '/deductions/government-cutoffs/{employee}',
            [DeductionController::class, 'updateGovernmentCutoffs']
        )->name('deductions.government-cutoffs.update');
    });


    /*
    |--------------------------------------------------------------------------
    | Backward-compatible URL
    |--------------------------------------------------------------------------
    */

    Route::redirect(
        '/sss-deductions',
        '/deductions'
    );


    /*
    |--------------------------------------------------------------------------
    | Holidays
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:holidays.view')->group(function () {

        Route::get(
            '/holidays',
            [HolidayController::class, 'index']
        )->name('holidays.index');
    });

    Route::middleware('permission:holidays.create')->group(function () {

        Route::post(
            '/holidays',
            [HolidayController::class, 'store']
        )->name('holidays.store');
    });

    Route::middleware('permission:holidays.update')->group(function () {

        Route::put(
            '/holidays/{holiday}',
            [HolidayController::class, 'update']
        )->name('holidays.update');
    });

    Route::middleware('permission:holidays.delete')->group(function () {

        Route::delete(
            '/holidays/{holiday}',
            [HolidayController::class, 'destroy']
        )->name('holidays.destroy');
    });

    Route::middleware('permission:holidays.sync')->group(function () {

        Route::post(
            '/holidays/sync',
            [HolidayController::class, 'sync']
        )->name('holidays.sync');
    });


    /*
    |--------------------------------------------------------------------------
    | Payroll Settings
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:settings.view')->group(function () {

        Route::get(
            '/settings',
            [PayrollSettingsController::class, 'index']
        )->name('settings.index');
    });

    Route::middleware('permission:settings.update')->group(function () {

        Route::put(
            '/settings',
            [PayrollSettingsController::class, 'update']
        )->name('settings.update');
    });


    /*
    |--------------------------------------------------------------------------
    | Categories / Departments
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:categories.create')->group(function () {

        Route::post(
            '/categories',
            [CategoryController::class, 'store']
        )->name('categories.store');
    });

    Route::middleware('permission:categories.update')->group(function () {

        Route::put(
            '/categories/{category}',
            [CategoryController::class, 'update']
        )->name('categories.update');
    });

    Route::middleware('permission:categories.delete')->group(function () {

        Route::delete(
            '/categories/{category}',
            [CategoryController::class, 'destroy']
        )->name('categories.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | Loans & Cash Advances
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:loans.view')->group(function () {

        Route::get(
            '/employees/{employee}/loans-and-cash-advances',
            [LoanAndCashAdvanceController::class, 'index']
        )->name('employees.loans-and-cash-advances.index');
    });

    Route::middleware('permission:loans.create')->group(function () {

        Route::post(
            '/employees/{employee}/loans-and-cash-advances',
            [LoanAndCashAdvanceController::class, 'store']
        )->name('employees.loans-and-cash-advances.store');
    });

    Route::middleware('permission:loans.update')->group(function () {

        Route::put(
            '/employees/{employee}/loans-and-cash-advances/{loanAndCashAdvance}',
            [LoanAndCashAdvanceController::class, 'update']
        )->name('employees.loans-and-cash-advances.update');
    });

    Route::middleware('permission:loans.delete')->group(function () {

        Route::delete(
            '/employees/{employee}/loans-and-cash-advances/{loanAndCashAdvance}',
            [LoanAndCashAdvanceController::class, 'destroy']
        )->name('employees.loans-and-cash-advances.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | Branches
    |--------------------------------------------------------------------------
    */

    Route::middleware('permission:branches.create')->group(function () {

        Route::post(
            '/branches',
            [BranchController::class, 'store']
        )->name('branches.store');
    });

    Route::middleware('permission:branches.update')->group(function () {

        Route::put(
            '/branches/{branch}',
            [BranchController::class, 'update']
        )->name('branches.update');
    });

    Route::middleware('permission:branches.delete')->group(function () {

        Route::delete(
            '/branches/{branch}',
            [BranchController::class, 'destroy']
        )->name('branches.destroy');
    });


    /*
    |--------------------------------------------------------------------------
    | Roles & Permissions
    |--------------------------------------------------------------------------
    |
    | This is intentionally manager-only.
    |
    | Do NOT use permission middleware here because the manager
    | must retain access to this page even if permissions are
    | changed from this screen.
    |
    */

    Route::middleware('role:manager')->group(function () {
        Route::get(
            '/roles-permissions',
            [RolePermissionController::class, 'index']
        )->name('roles-permissions.index');

        Route::post(
            '/roles-permissions',
            [RolePermissionController::class, 'store']
        )->name('roles-permissions.store');

        Route::put(
            '/roles-permissions/{role}',
            [RolePermissionController::class, 'update']
        )->name('roles-permissions.update');

        Route::delete(
            '/roles-permissions/{role}',
            [RolePermissionController::class, 'destroy']
        )->name('roles-permissions.destroy');
    });
});
