<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\Route;
class DashboardController extends Controller
{
    public function index()
    {
        return inertia('Dashboard/Index');
    }
}
