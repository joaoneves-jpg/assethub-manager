import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BulkEditBarProps {
    selectedCount: number;
    onClose: () => void;
    onBulkUpdate: (field: string, value: any) => Promise<void>;
    availableFields: {
        key: string;
        label: string;
        options?: { value: string; label: string }[];
    }[];
}

export function BulkEditBar({
    selectedCount,
    onClose,
    onBulkUpdate,
    availableFields,
}: BulkEditBarProps) {
    const [selectedField, setSelectedField] = useState<string>("");
    const [selectedValue, setSelectedValue] = useState<string>("");
    const [isUpdating, setIsUpdating] = useState(false);
    const { toast } = useToast();

    const currentField = availableFields.find(f => f.key === selectedField);

    const handleApply = async () => {
        if (!selectedField || !selectedValue) {
            toast({
                title: "Selecione um campo e valor",
                variant: "destructive",
            });
            return;
        }

        setIsUpdating(true);
        try {
            await onBulkUpdate(selectedField, selectedValue);
            toast({ title: `${selectedCount} itens atualizados com sucesso!` });
            setSelectedField("");
            setSelectedValue("");
        } catch (error) {
            toast({
                title: "Erro ao atualizar itens",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex items-center gap-4 py-4">
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                        {selectedCount}
                    </div>
                    <span className="text-sm font-medium">
                        {selectedCount === 1 ? "item selecionado" : "itens selecionados"}
                    </span>
                </div>

                <div className="flex flex-1 items-center gap-2">
                    <Select value={selectedField} onValueChange={(value) => {
                        setSelectedField(value);
                        setSelectedValue("");
                    }}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Selecione o campo" />
                        </SelectTrigger>
                        <SelectContent side="top">
                            {availableFields.map((field) => (
                                <SelectItem key={field.key} value={field.key}>
                                    {field.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {currentField?.options && (
                        <Select value={selectedValue} onValueChange={setSelectedValue}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Selecione o valor" />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {currentField.options.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <Button
                        onClick={handleApply}
                        disabled={!selectedField || !selectedValue || isUpdating}
                        className="ml-auto"
                    >
                        {isUpdating ? "Atualizando..." : "Aplicar"}
                    </Button>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
