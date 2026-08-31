<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;


use App\Models\User;
use App\Models\Employee;
class Category extends Model
{
    protected $fillable = [
        'name',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
