<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\PayrollSetting;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Response;

class SchedulingController extends Controller
{
    public function index(Request $request): Response
    {
        $start = $request->date('start_date')?->startOfDay() ?? now()->startOfMonth();
        $end = $request->date('end_date')?->endOfDay() ?? now()->endOfMonth();

        return inertia('Scheduling/Index', [
            'employees' => fn() => Employee::query()
                ->orderBy('full_name')
                ->get(),
            'schedules' => fn() => EmployeeSchedule::query()
                ->whereBetween('work_date', [$start->toDateString(), $end->toDateString()])
                ->orderBy('work_date')
                ->orderBy('segment_no')
                ->orderBy('start_time')
                ->get(),
            'payrollSettings' => fn() => PayrollSetting::query()->find(1),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,id'],
            'work_date' => ['required', 'date'],
            'start_time' => ['required_if:is_working_day,true', 'date_format:H:i'],
            'end_time' => ['required_if:is_working_day,true', 'date_format:H:i'],
            'break_minutes' => ['nullable', 'integer', 'min:0'],
            'is_working_day' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $data['segment_no'] = $this->nextSegmentNumber($data['employee_id'], $data['work_date']);
        $data['break_minutes'] = $this->resolveBreakMinutes($data);

        EmployeeSchedule::create($data);

        return back()->with('success', 'Schedule added successfully.');
    }

    public function update(Request $request, EmployeeSchedule $schedule): RedirectResponse
    {
        $data = $this->validatedData($request);
        $data['employee_id'] = $schedule->employee_id;
        $data['segment_no'] = $schedule->segment_no;
        $data['break_minutes'] = $this->resolveBreakMinutes($data);

        $schedule->update($data);

        return back()->with('success', 'Schedule updated successfully.');
    }

    public function destroy(EmployeeSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return back()->with('success', 'Schedule deleted successfully.');
    }

    public function bulkStore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'schedules' => ['required', 'array', 'min:1'],
            'schedules.*.employee_id' => [
                'required',
                'string',
                'exists:employees,employee_id',
            ],
            'schedules.*.work_date' => ['required', 'date'],
            'schedules.*.segment_no' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'schedules.*.start_time' => [
                'required_if:schedules.*.is_working_day,true',
                'date_format:H:i',
            ],
            'schedules.*.end_time' => [
                'required_if:schedules.*.is_working_day,true',
                'date_format:H:i',
            ],
            'schedules.*.break_minutes' => [
                'nullable',
                'integer',
                'min:0',
            ],
            'schedules.*.is_working_day' => [
                'required',
                'boolean',
            ],
            'schedules.*.notes' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        foreach ($validated['schedules'] as $input) {
            $employee = Employee::where(
                'employee_id',
                $input['employee_id'],
            )->firstOrFail();

            $segmentNo = $input['segment_no'] ?? $this->nextSegmentNumber(
                $employee->id,
                $input['work_date'],
            );

            EmployeeSchedule::updateOrCreate(
                [
                    'employee_id' => $employee->id,
                    'work_date' => $input['work_date'],
                    'segment_no' => $segmentNo,
                ],
                [
                    'start_time' => $input['start_time'] ?? '00:00',
                    'end_time' => $input['end_time'] ?? '00:00',
                    'break_minutes' => $this->resolveBreakMinutes($input),
                    'is_working_day' => $input['is_working_day'],
                    'notes' => trim($input['notes'] ?? '') ?: null,
                ],
            );
        }

        return back()->with(
            'success',
            'Schedules saved successfully.',
        );
    }

    private function validatedData(Request $request): array
    {
        $data = $request->validate([
            'employee_id' => ['required', 'uuid', 'exists:employees,employee_id'],
            'work_date' => ['required', 'date'],
            'start_time' => ['required_if:is_working_day,true', 'date_format:H:i'],
            'end_time' => ['required_if:is_working_day,true', 'date_format:H:i'],
            'break_minutes' => ['nullable', 'integer', 'min:0'],
            'is_working_day' => ['required', 'boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);


        if ($data['is_working_day']) {
            $start = Carbon::createFromFormat('H:i', $data['start_time']);
            $end = Carbon::createFromFormat('H:i', $data['end_time']);

            if ($start->equalTo($end)) {
                abort(422, 'Working days must have different start and end times.');
            }

            $grossMinutes = $this->grossMinutes($data['start_time'], $data['end_time']);
            if ((int) ($data['break_minutes'] ?? 0) >= $grossMinutes) {
                abort(422, 'Break time must be shorter than the scheduled shift.');
            }
        }

        $data['notes'] = trim($data['notes'] ?? '') ?: null;

        return $data;
    }

    private function nextSegmentNumber(string $employeeId, string $workDate): int
    {
        return ((int) EmployeeSchedule::query()
            ->where('employee_id', $employeeId)
            ->whereDate('work_date', $workDate)
            ->max('segment_no')) + 1;
    }

    private function resolveBreakMinutes(array $data): int
    {
        if (! ($data['is_working_day'] ?? false)) {
            return 0;
        }

        if (array_key_exists('break_minutes', $data) && $data['break_minutes'] !== null) {
            return max(0, (int) $data['break_minutes']);
        }

        $settings = PayrollSetting::query()->find(1);
        $dailyMinutes = (float) ($settings?->daily_work_hours ?? 8) * 60;
        $grossMinutes = $this->grossMinutes($data['start_time'], $data['end_time']);

        return $grossMinutes >= $dailyMinutes
            ? (int) ($settings?->unpaid_break_minutes ?? 60)
            : 0;
    }

    private function grossMinutes(string $start, string $end): int
    {
        [$startHour, $startMinute] = array_map('intval', explode(':', substr($start, 0, 5)));
        [$endHour, $endMinute] = array_map('intval', explode(':', substr($end, 0, 5)));

        $startMinutes = ($startHour * 60) + $startMinute;
        $endMinutes = ($endHour * 60) + $endMinute;

        if ($endMinutes <= $startMinutes) {
            $endMinutes += 1440;
        }

        return max(0, $endMinutes - $startMinutes);
    }
}
