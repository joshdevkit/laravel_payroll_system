<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class BranchController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:branches,name',
            ],
        ]);

        Branch::create($validated);

        return back()->with(
            'success',
            'Branch created successfully.'
        );
    }

    public function update(
        Request $request,
        Branch $branch
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:branches,name,' . $branch->id,
            ],
        ]);

        $branch->update($validated);

        return back()->with(
            'success',
            'Branch updated successfully.'
        );
    }

    public function destroy(
        Branch $branch
    ): RedirectResponse {
        $branch->delete();

        return back()->with(
            'success',
            'Branch deleted successfully.'
        );
    }
}