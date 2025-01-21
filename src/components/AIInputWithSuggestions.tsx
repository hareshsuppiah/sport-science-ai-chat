import { LucideIcon, Send, CornerRightDown } from "lucide-react";
import { useState } from "react";
import { Textarea } from "./ui/textarea";
import { cn } from "../lib/utils";
import { useAutoResizeTextarea } from "../hooks/useAutoResizeTextarea";

interface ActionItem {
    text: string;
    icon: LucideIcon;
    colors: {
        icon: string;
        border: string;
        bg: string;
    };
}

interface AIInputWithSuggestionsProps {
    id?: string;
    placeholder?: string;
    minHeight?: number;
    maxHeight?: number;
    actions?: ActionItem[];
    defaultSelected?: string;
    onSubmit?: (text: string, action?: string) => void;
    className?: string;
    value?: string;
    onChange?: (value: string) => void;
    isLoading?: boolean;
}

export function AIInputWithSuggestions({
    id = "ai-input",
    placeholder = "Ask about the research...",
    minHeight = 50,
    maxHeight = 200,
    actions = [],
    defaultSelected,
    onSubmit,
    className,
    value = "",
    onChange,
    isLoading = false,
}: AIInputWithSuggestionsProps) {
    const [selectedItem, setSelectedItem] = useState<string | null>(defaultSelected ?? null);

    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight,
        maxHeight,
    });

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit?.(value, selectedItem ?? undefined);
            adjustHeight(true);
        }
    };

    const currentAction = selectedItem ? actions.find(a => a.text === selectedItem) : null;

    return (
        <div className={cn("w-full py-4", className)}>
            <div className="relative w-full">
                <div className="relative border border-black/10 dark:border-white/10 focus-within:border-black/20 dark:focus-within:border-white/20 rounded-2xl bg-black/[0.03] dark:bg-white/[0.03]">
                    <div className="flex flex-col">
                        <div
                            className="overflow-y-auto"
                            style={{ maxHeight: `${maxHeight}px` }}
                        >
                            <Textarea
                                ref={textareaRef}
                                id={id}
                                placeholder={placeholder}
                                className={cn(
                                    "max-w-full w-full rounded-2xl pr-12 pt-3 pb-3",
                                    "placeholder:text-black/70 dark:placeholder:text-white/70",
                                    "border-none focus:ring-0 text-black dark:text-white",
                                    "resize-none bg-transparent",
                                    "focus-visible:ring-0 focus-visible:ring-offset-0",
                                    "leading-[1.2]",
                                    `min-h-[${minHeight}px]`
                                )}
                                value={value}
                                onChange={(e) => {
                                    onChange?.(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {currentAction && (
                        <div className="absolute left-3 bottom-3 z-10">
                            <button
                                type="button"
                                onClick={() => setSelectedItem(null)}
                                className={cn(
                                    "inline-flex items-center gap-1.5",
                                    "border shadow-sm rounded-md px-2 py-0.5 text-xs font-medium",
                                    "animate-fadeIn hover:bg-black/5 dark:hover:bg-white/5 transition-colors duration-200",
                                    currentAction.colors.bg,
                                    currentAction.colors.border
                                )}
                            >
                                <currentAction.icon className={cn("w-3.5 h-3.5", currentAction.colors.icon)} />
                                <span className={currentAction.colors.icon}>{currentAction.text}</span>
                            </button>
                        </div>
                    )}

                    <div className={cn(
                        "absolute right-3 top-3 transition-all duration-200",
                        value ? "opacity-100" : "opacity-30"
                    )}>
                        {isLoading ? (
                            <CornerRightDown className="w-4 h-4 text-black dark:text-white" />
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading || !value.trim()}
                                className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4 text-black dark:text-white" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {actions.length > 0 && !selectedItem && (
                <div className="flex flex-wrap gap-1.5 mt-2 justify-start">
                    {actions.map(({ text, icon: Icon, colors }) => (
                        <button
                            key={text}
                            onClick={() => setSelectedItem(text)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-medium rounded-full",
                                "border transition-all duration-200",
                                "border-black/10 dark:border-white/10",
                                "bg-white/50 dark:bg-zinc-800/50",
                                "hover:bg-black/5 dark:hover:bg-white/5",
                                "flex-shrink-0"
                            )}
                        >
                            <div className="flex items-center gap-1.5">
                                <Icon className={cn("h-4 w-4", colors.icon)} />
                                <span className="text-black/70 dark:text-white/70 whitespace-nowrap">
                                    {text}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 