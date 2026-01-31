import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Trash2 } from "lucide-react";
import { Event, NewEvent, useAddEvent, useUpdateEvent, useDeleteEvent } from "@/hooks/useEvents";
import { format } from "date-fns";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventModalProps {
    event: Event | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const categoryOptions = [
    { value: "culto", label: "Culto", color: "bg-primary" },
    { value: "reunião", label: "Reunião", color: "bg-agenda" },
    { value: "evento", label: "Evento Especial", color: "bg-harpa" },
    { value: "jovens", label: "Jovens", color: "bg-convertidos" },
    { value: "teens", label: "Teens", color: "bg-convertidos" },
    { value: "mulheres", label: "Mulheres", color: "bg-pink-500" },
    { value: "homens", label: "Homens", color: "bg-blue-500" },
];

export function EventModal({ event, open, onOpenChange }: EventModalProps) {
    const addEvent = useAddEvent();
    const updateEvent = useUpdateEvent();
    const deleteEvent = useDeleteEvent();

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [formData, setFormData] = useState<NewEvent>({
        title: "",
        description: "",
        date: new Date(),
        time: "19:00",
        location: "",
        category: "culto",
        color: "bg-primary",
        is_recurring: false,
        recurrence_rule: "",
    });

    // Reset form when event changes or modal opens
    useEffect(() => {
        if (open) {
            if (event) {
                setFormData({
                    title: event.title,
                    description: event.description || "",
                    date: new Date(event.date),
                    time: event.time,
                    location: event.location || "",
                    category: event.category,
                    color: event.color,
                    is_recurring: event.is_recurring,
                    recurrence_rule: event.recurrence_rule || "",
                });
            } else {
                // Reset for new event
                setFormData({
                    title: "",
                    description: "",
                    date: new Date(),
                    time: "19:00",
                    location: "",
                    category: "culto",
                    color: "bg-primary",
                    is_recurring: false,
                    recurrence_rule: "",
                });
            }
        }
    }, [event, open]);

    const handleSave = async () => {
        if (!formData.title.trim()) {
            return;
        }

        if (event) {
            // Update existing event
            await updateEvent.mutateAsync({
                id: event.id,
                updates: formData,
            });
        } else {
            // Create new event
            await addEvent.mutateAsync(formData);
        }

        onOpenChange(false);
    };

    const handleDelete = async () => {
        if (event) {
            await deleteEvent.mutateAsync(event.id);
            setDeleteDialogOpen(false);
            onOpenChange(false);
        }
    };

    const handleCategoryChange = (value: string) => {
        const category = categoryOptions.find((c) => c.value === value);
        setFormData((prev) => ({
            ...prev,
            category: value,
            color: category?.color || "bg-primary",
        }));
    };

    const isLoading = addEvent.isPending || updateEvent.isPending || deleteEvent.isPending;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{event ? "Editar Evento" : "Novo Evento"}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Title */}
                        <div>
                            <Label htmlFor="title">Título *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Culto de Celebração"
                                maxLength={100}
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Detalhes do evento..."
                                rows={3}
                                maxLength={500}
                            />
                        </div>

                        {/* Date and Time */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="date">Data *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={format(formData.date, "yyyy-MM-dd")}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, date: new Date(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="time">Horário *</Label>
                                <Input
                                    id="time"
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <Label htmlFor="location">Local</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                                placeholder="Ex: Templo Principal"
                                maxLength={100}
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <Label htmlFor="category">Categoria *</Label>
                            <Select value={formData.category} onValueChange={handleCategoryChange}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {categoryOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                                {option.label}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Recurring Event */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Evento Recorrente</Label>
                                <p className="text-xs text-muted-foreground">Repetir este evento</p>
                            </div>
                            <Switch
                                checked={formData.is_recurring}
                                onCheckedChange={(checked) =>
                                    setFormData((prev) => ({ ...prev, is_recurring: checked, recurrence_rule: checked ? "weekly" : "" }))
                                }
                            />
                        </div>

                        {/* Recurrence Rule */}
                        {formData.is_recurring && (
                            <div>
                                <Label htmlFor="recurrence">Frequência</Label>
                                <Select
                                    value={formData.recurrence_rule}
                                    onValueChange={(value) => setFormData((prev) => ({ ...prev, recurrence_rule: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekly">Semanal</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="yearly">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        {event && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => setDeleteDialogOpen(true)}
                                disabled={isLoading}
                                className="mr-auto"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading || !formData.title.trim()}>
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            {event ? "Salvar" : "Criar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Evento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir "{event?.title}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
