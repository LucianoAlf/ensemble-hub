import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface DatePickerFieldProps {
  label: string;
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  allowPastDates?: boolean;
  calendarTheme?: 'income' | 'expense' | 'payout';
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  required = false,
  allowPastDates = false,
  calendarTheme = 'income',
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="date-picker">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date-picker"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? (
              format(value, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            ) : (
              <span>{placeholder}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={allowPastDates ? undefined : (date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="pointer-events-auto"
            locale={ptBR}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: "h-7 w-7 bg-transparent p-0 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-gray-400 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
              day: "h-9 w-9 p-0 font-normal text-gray-300 hover:bg-gray-700 hover:text-white rounded-md transition-colors duration-200 focus:bg-gray-700 focus:text-white",
              day_selected: calendarTheme === 'income' 
                ? "bg-green-600 text-white hover:bg-green-700 hover:text-white focus:bg-green-700 focus:text-white shadow-md"
                : calendarTheme === 'expense'
                ? "bg-red-600 text-white hover:bg-red-700 hover:text-white focus:bg-red-700 focus:text-white shadow-md"
                : "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white shadow-md",
              day_today: "bg-gray-600 text-white font-medium border border-gray-400 ring-2 ring-white/20",
              day_outside: "text-gray-600 opacity-50",
              day_disabled: "text-gray-600 opacity-30 cursor-not-allowed hover:bg-transparent hover:text-gray-600",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}