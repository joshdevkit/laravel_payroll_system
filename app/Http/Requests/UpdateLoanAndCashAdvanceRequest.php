<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLoanAndCashAdvanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => [
                'required',
                'in:sss,pag_ibig,cash_advance',
            ],

            'reference_no' => [
                'nullable',
                'string',
                'max:255',
            ],

            'principal_amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'deduction_amount' => [
                'required',
                'numeric',
                'min:0.01',
            ],

            'deduction_frequency' => [
                'required',
                'in:per_cutoff,monthly,one_time',
            ],

            'deduction_cutoff' => [
                'required',
                'in:first,second,both',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'date' => [
                'required',
                'date',
            ],

            'status' => [
                'required',
                'in:active,paid,cancelled',
            ],

            'notes' => [
                'nullable',
                'string',
            ],
        ];
    }
}