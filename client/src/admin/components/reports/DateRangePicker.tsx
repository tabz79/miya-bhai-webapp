
import React, { useState } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { addDays, format, startOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  onDateChange: (range: DateRange) => void;
}

export function DateRangePicker({ className, onDateChange }: DateRangePickerProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  const handleDateSelect = (range: DateRange | undefined) => {
    if (range) {
      setDate(range);
      onDateChange(range);
    }
  };

  const setPreset = (preset: 'today' | '7d' | '30d' | 'month') => {
    const to = new Date();
    let from;
    switch (preset) {
      case 'today':
        from = to;
        break;
      case '7d':
        from = addDays(to, -7);
        break;
      case '30d':
        from = addDays(to, -30);
        break;
      case 'month':
        from = startOfMonth(to);
        break;
    }
    handleDateSelect({ from, to });
  };

  return (
    <div className={cn('grid gap-2', className)}>
        <div className='flex items-center gap-2'>
             <Button onClick={() => setPreset('7d')} variant="outline">Last 7 Days</Button>
             <Button onClick={() => setPreset('30d')} variant="outline">Last 30 Days</Button>
             <Button onClick={() => setPreset('month')} variant="outline">This Month</Button>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[300px] justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
      </div>
    </div>
  );
}

export default DateRangePicker;
