<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

use App\Models\PayrollItem;
use App\Models\Category;
class PayrollRun extends Model
{
    use HasFactory;

    protected $table = 'payroll_runs';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'category_id',
        'cutoff_start',
        'cutoff_end',
        'pay_date',
        'status',
        'settings_snapshot',
    ];

    protected $casts = [
        'cutoff_start' => 'date:Y-m-d',
        'cutoff_end' => 'date:Y-m-d',
        'pay_date' => 'date:Y-m-d',
        'settings_snapshot' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(
            function (PayrollRun $run) {
                if (! $run->getKey()) {
                    $run->setAttribute(
                        $run->getKeyName(),
                        (string) Str::uuid()
                    );
                }
            }
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            PayrollItem::class
        );
    }

    public function category()
    {
        return $this->belongsTo(
            Category::class
        );
    }
}