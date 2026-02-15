import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CopyableIdProps {
    id: string;
    label?: string;
}

export function CopyableId({ id, label = "ID" }: CopyableIdProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="h-3 w-3" />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy className="h-3 w-3" />
                                {label}
                            </>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p className="text-xs font-mono">{id}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
