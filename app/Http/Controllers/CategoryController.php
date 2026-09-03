<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:categories,name'],
        ]);

        Category::create($validated);

        return back()->with('success', 'Department added successfully.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:categories,name,' . $category->id,
            ],
        ]);

        $category->update($validated);

        return back()->with('success', 'Department updated successfully.');
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->employees()->exists()) {
            return back()->with('error', 'This department cannot be deleted because it has employees assigned to it.');
        }

        $category->delete();

        return back()->with('success', 'Department deleted successfully.');
    }
}