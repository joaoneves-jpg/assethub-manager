import { useState } from "react";
import { Check, Plus, Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useTags, useCreateTag, useAddPageTag, useRemovePageTag, type Tag } from "@/hooks/useData";
import { useToast } from "@/hooks/use-toast";

interface TagSelectorProps {
    pageId: string;
    selectedTags: Tag[];
    onTagsChange?: () => void;
}

export function TagSelector({ pageId, selectedTags, onTagsChange }: TagSelectorProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const { toast } = useToast();

    const { data: allTags = [] } = useTags();
    const createTag = useCreateTag();
    const addPageTag = useAddPageTag();
    const removePageTag = useRemovePageTag();

    const selectedTagIds = new Set(selectedTags.map(t => t.id));
    const availableTags = allTags.filter(t => !selectedTagIds.has(t.id));

    const handleCreateTag = async () => {
        if (!search.trim()) return;

        try {
            const newTag = await createTag.mutateAsync({ name: search.trim() });
            await addPageTag.mutateAsync({ pageId, tagId: newTag.id });
            setSearch("");
            onTagsChange?.();
            toast({ title: "Tag criada e adicionada!" });
        } catch (error) {
            toast({ title: "Erro ao criar tag", variant: "destructive" });
        }
    };

    const handleAddTag = async (tagId: string) => {
        try {
            await addPageTag.mutateAsync({ pageId, tagId });
            onTagsChange?.();
            toast({ title: "Tag adicionada!" });
        } catch (error) {
            toast({ title: "Erro ao adicionar tag", variant: "destructive" });
        }
    };

    const handleRemoveTag = async (tagId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await removePageTag.mutateAsync({ pageId, tagId });
            onTagsChange?.();
            toast({ title: "Tag removida!" });
        } catch (error) {
            toast({ title: "Erro ao remover tag", variant: "destructive" });
        }
    };

    return (
        <div className="flex items-center gap-2">
            {selectedTags.map((tag) => (
                <Badge
                    key={tag.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                    style={{ backgroundColor: `${tag.color}20`, borderColor: tag.color, color: tag.color }}
                >
                    <TagIcon className="h-3 w-3" />
                    {tag.name}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={(e) => handleRemoveTag(tag.id, e)}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </Badge>
            ))}

            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                    >
                        <TagIcon className="h-3 w-3" />
                        {selectedTags.length === 0 ? "Adicionar tag" : "Mais"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[250px] p-0" align="start">
                    <Command>
                        <CommandInput
                            placeholder="Buscar ou criar tag..."
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            <CommandEmpty>
                                <div className="flex flex-col items-center gap-2 py-6">
                                    <p className="text-sm text-muted-foreground">Nenhuma tag encontrada</p>
                                    {search.trim() && (
                                        <Button
                                            size="sm"
                                            onClick={handleCreateTag}
                                            className="gap-2"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Criar "{search}"
                                        </Button>
                                    )}
                                </div>
                            </CommandEmpty>

                            {availableTags.length > 0 && (
                                <CommandGroup heading="Tags disponíveis">
                                    {availableTags.map((tag) => (
                                        <CommandItem
                                            key={tag.id}
                                            onSelect={() => handleAddTag(tag.id)}
                                            className="gap-2"
                                        >
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: tag.color }}
                                            />
                                            {tag.name}
                                            <Check className="ml-auto h-4 w-4 opacity-0" />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {search.trim() && !allTags.some(t => t.name.toLowerCase() === search.toLowerCase()) && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem onSelect={handleCreateTag} className="gap-2">
                                            <Plus className="h-4 w-4" />
                                            Criar "{search}"
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
