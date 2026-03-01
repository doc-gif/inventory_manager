import React from 'react';
import {useNavigate} from 'react-router';
import {ArchiveRestore, Archive, ArrowLeft, Undo2} from 'lucide-react';
import {Button} from '@/presentation/components/ui/Button';
import {Card} from '@/presentation/components/ui/Card';
import {Badge} from '@/presentation/components/ui/Badge';
import {toast} from 'sonner';
import {useInventoryStore} from "@/application/stores/useInventoryStore";

export function ArchivePage() {
    const navigate = useNavigate();

    const items = useInventoryStore((state) => state.items);
    const unarchiveItem = useInventoryStore((state) => state.unarchiveItem);
    const archivedItems = React.useMemo(
        () => items.filter((item) => item.isArchived),
        [items]
    );

    const handleUnarchive = (id: string, name: string) => {
        unarchiveItem(id);
        toast.success(`「${name}」のアーカイブを解除しました`);
    };

    return (
        <div className="pb-24">
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="p-1">
                        <ArrowLeft className="w-5 h-5"/>
                    </Button>
                    <div>
                        <h1 className="flex items-center gap-2">
                            <Archive className="w-5 h-5 text-primary"/>
                            アーカイブ
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            非表示にした商品 ({archivedItems.length}件)
                        </p>
                    </div>
                </div>
            </div>

            <div className="px-4 pt-3 space-y-2">
                {archivedItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                        <ArchiveRestore className="w-12 h-12 opacity-30 mb-3"/>
                        <p>アーカイブされた商品はありません</p>
                    </div>
                ) : (
                    archivedItems.map((item) => (
                        <Card key={item.id} className="p-3">
                            <div className="flex items-center justify-between gap-3">
                                <div
                                    className="flex-1 min-w-0 cursor-pointer"
                                    onClick={() => navigate(`/item/${item.id}`)}
                                >
                                    <p className="truncate text-muted-foreground">{item.name}</p>
                                    {item.brand && (
                                        <p className="text-xs text-muted-foreground/60 truncate">{item.brand}</p>
                                    )}
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 mt-1">
                                        {item.category}
                                    </Badge>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="shrink-0 gap-1"
                                    onClick={() => handleUnarchive(item.id, item.name)}
                                >
                                    <Undo2 className="w-3.5 h-3.5"/>
                                    復元
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
