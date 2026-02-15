import { useRef, useCallback } from 'react';

/**
 * Hook para gerenciar seleção com SHIFT+Click
 * Permite selecionar múltiplos itens em intervalo
 */
export const useShiftSelection = <T extends string | number>(
    items: T[],
    selected: Set<T>,
    setSelected: (selected: Set<T>) => void
) => {
    const lastSelectedIndex = useRef<number | null>(null);

    const handleToggleSelect = useCallback(
        (id: T, index: number, event?: React.MouseEvent) => {
            if (event?.shiftKey && lastSelectedIndex.current !== null) {
                // SHIFT+Click: selecionar intervalo
                const start = Math.min(lastSelectedIndex.current, index);
                const end = Math.max(lastSelectedIndex.current, index);

                const newSelected = new Set(selected);
                for (let i = start; i <= end; i++) {
                    newSelected.add(items[i]);
                }

                setSelected(newSelected);
            } else {
                // Click normal: toggle individual
                const newSelected = new Set(selected);
                if (newSelected.has(id)) {
                    newSelected.delete(id);
                } else {
                    newSelected.add(id);
                }
                setSelected(newSelected);
                lastSelectedIndex.current = index;
            }
        },
        [items, selected, setSelected]
    );

    const resetLastSelected = useCallback(() => {
        lastSelectedIndex.current = null;
    }, []);

    return {
        handleToggleSelect,
        resetLastSelected,
    };
};
