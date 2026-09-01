<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Holiday extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'date',
        'name',
        'type',
        'notes',
    ];

    protected $casts = [
        'date' => 'date:Y-m-d',
    ];
}
