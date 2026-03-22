"use client";

import { useState, useEffect, useMemo } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { useLanguage } from "@/src/context/LanguageContext";
import { translations } from "@/src/locales/dicts";

// Ensure dark mode for MUI components to match the app
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#8b5cf6", // Violet-500
    },
    background: {
      paper: "#0f172a", // Slate-900
      default: "#0f172a",
    },
  },
  typography: {
    fontFamily: "inherit",
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem",
          borderColor: "#334155", // Slate-700
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#475569", // Slate-600
          },
        },
        input: {
          padding: "8px 12px",
          color: "#e2e8f0", // Slate-200
          fontSize: "0.875rem",
        },
      },
    },
  },
});

export type TimeRangeType = "relative" | "absolute";

export interface TimeRangeValue {
  type: TimeRangeType;
  value: string; // "5m", "1h" for relative
  start?: number; // timestamp in seconds for absolute
  end?: number; // timestamp in seconds for absolute
  label?: string; // "Last 5 minutes", "Custom Range"
}

interface AdvancedTimeRangeSelectorProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  disabled?: boolean;
  className?: string;
}

export function AdvancedTimeRangeSelector({
  value,
  onChange,
  disabled,
  className,
}: AdvancedTimeRangeSelectorProps) {
  const { language } = useLanguage();
  const t = translations.timePicker[language];

  const quickRangeKeys = useMemo(() => [
    { value: "5m", label: t.last5m },
    { value: "15m", label: t.last15m },
    { value: "30m", label: t.last30m },
    { value: "1h", label: t.last1h },
    { value: "3h", label: t.last3h },
    { value: "4h", label: t.last4h },
    { value: "6h", label: t.last6h },
    { value: "12h", label: t.last12h },
    { value: "24h", label: t.last24h },
    { value: "2d", label: t.last2d },
    { value: "7d", label: t.last7d },
    { value: "30d", label: t.last30d },
  ], [t]);

  const [isOpen, setIsOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [activeTab, setActiveTab] = useState<"absolute" | "quick">("quick");

  // Initialize absolute dates when opening if absolute is selected
  useEffect(() => {
    if (isOpen) {
      if (value.type === "absolute" && value.start && value.end) {
        setFromDate(dayjs(value.start * 1000));
        setToDate(dayjs(value.end * 1000));
      } else if (value.type === "relative") {
        const range = value.value;
        const now = dayjs();
        let start = now;

        const num = parseInt(range.replace(/\D/g, ""));
        const unit = range.replace(/\d/g, "");

        if (unit === "m") start = now.subtract(num, "minute");
        if (unit === "h") start = now.subtract(num, "hour");
        if (unit === "d") start = now.subtract(num, "day");

        setFromDate(start);
        setToDate(now);
      }
    }
  }, [isOpen, value.type, value.value, value.start, value.end]);

  const handleApplyAbsolute = () => {
    if (fromDate && toDate) {
      onChange({
        type: "absolute",
        value: "custom",
        start: fromDate.unix(),
        end: toDate.unix(),
        label: `${fromDate.format("MMM D, HH:mm")} to ${toDate.format("MMM D, HH:mm")}`,
      });
      setIsOpen(false);
    }
  };

  const handleSelectRelative = (range: typeof quickRangeKeys[0]) => {
    onChange({
      type: "relative",
      value: range.value,
      label: range.label, 
    });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full sm:w-auto sm:min-w-50 justify-between text-left font-normal bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="shrink-0 h-4 w-4 text-slate-400" />
            <span className="truncate text-sm">
              {value.type === "relative"
                ? quickRangeKeys.find((r) => r.value === value.value)?.label ?? t.last5m
                : value.label || t.customRange}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-150 max-w-150 p-0 bg-slate-950 border-slate-800 text-slate-200"
        align="end"
        sideOffset={8}
      >
        {/* Mobile Tabs */}
        <div className="flex sm:hidden border-b border-slate-800">
          <button
            onClick={() => setActiveTab("quick")}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === "quick"
                ? "text-violet-400 border-b-2 border-violet-500 bg-slate-900/50"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {language === "TH" ? "ช่วงเวลาด่วน" : "Quick Ranges"}
          </button>
          <button
            onClick={() => setActiveTab("absolute")}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === "absolute"
                ? "text-violet-400 border-b-2 border-violet-500 bg-slate-900/50"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {t.absoluteTitle}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row overflow-y-auto h-90 sm:h-100">
          {/* Left Column: Absolute Range Picker */}
          <div
            className={cn(
              "flex-1 p-4 sm:border-r border-slate-800 flex flex-col gap-4",
              activeTab !== "absolute" && "hidden sm:flex",
            )}
          >
            <h4 className="hidden sm:block font-semibold text-sm text-slate-100 mb-2">
              {t.absoluteTitle}
            </h4>

            <ThemeProvider theme={darkTheme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">{t.from}</label>
                    <DateTimePicker
                      value={fromDate}
                      onChange={(newValue) => setFromDate(newValue)}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">{t.to}</label>
                    <DateTimePicker
                      value={toDate}
                      onChange={(newValue) => setToDate(newValue)}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </div>
                </div>
              </LocalizationProvider>
            </ThemeProvider>

            <div className="mt-auto pt-4 flex gap-2">
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleApplyAbsolute}
                disabled={!fromDate || !toDate}
              >
                {t.apply}
              </Button>
            </div>
          </div>

          {/* Right Column: Quick Ranges List */}
          <div
            className={cn(
              "w-full sm:w-50 flex flex-col sm:border-l border-slate-800/50 bg-slate-900/30",
              activeTab !== "quick" && "hidden sm:flex",
            )}
          >
            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {quickRangeKeys.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleSelectRelative(range)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group",
                    value.type === "relative" && value.value === range.value
                      ? "bg-violet-500/10 text-violet-400 border-l-2 border-violet-500"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  )}
                >
                  <span>{range.label}</span>
                  {value.type === "relative" && value.value === range.value && (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}