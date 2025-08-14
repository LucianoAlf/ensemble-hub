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
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled = false,
  required = false,
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
            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
            initialFocus
            className="pointer-events-auto"
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}