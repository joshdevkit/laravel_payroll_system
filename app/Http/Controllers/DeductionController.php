<?php

namespace App\Http\Controllers;

use App\Models\SssContributionTable;
use Inertia\Response;

class DeductionController extends Controller
{
    public function index(): Response
    {
        return inertia('Deductions/Index', [
            'sssContributionTables' => SssContributionTable::query()
                ->orderByDesc('effective_from')
                ->orderBy('compensation_min')
                ->get(),
        ]);
    }
}
