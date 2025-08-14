import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TimePickerFieldProps {
  label: string;
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

// Generate time options every 15 minutes from 6:00 to 23:45
const generateTimeOptions = () => {
  const times: string[] = [];
  for (let hour = 6; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      times.push(timeString);
    }
  }
  return times;
};

// Common event times for quick selection
const popularTimes = ["18:00", "19:00", "20:00", "21:00", "22:00"];

export function TimePickerField({
  label,
  value,
  onChange,
  placeholder = "Selecione um horário",
  disabled = false,
  required = false,
}: TimePickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const timeOptions = generateTimeOptions();

  const handleTimeSelect = (time: string) => {
    onChange(time);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="time-picker">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="time-picker"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <Clock className="mr-2 h-4 w-4" />
            {value || <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            {/* Popular times section */}
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Horários Populares
              </h4>
              <div className="grid grid-cols-3 gap-2">
                {popularTimes.map((time) => (
                  <Button
                    key={time}
                    variant={value === time ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTimeSelect(time)}
                    className="text-xs"
                  >
                    {time}
                  </Button>
                ))}
              </div>
            </div>

            {/* All times section */}
            <div>
              <h4 className="text-sm font-medium mb-2 text-muted-foreground">
                Todos os Horários
              </h4>
              <ScrollArea className="h-40">
                <div className="grid grid-cols-4 gap-1">
                  {timeOptions.map((time) => (
                    <Button
                      key={time}
                      variant={value === time ? "default" : "ghost"}
                      size="sm"
                      onClick={() => handleTimeSelect(time)}
                      className="text-xs h-8"
                    >
                      {time}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}