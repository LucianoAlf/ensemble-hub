import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus } from "lucide-react";

interface DynamicFormListProps<T> {
  title: string;
  items: T[];
  renderForm: (item: T, index: number, updateItem: (index: number, data: Partial<T>) => void) => React.ReactNode;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  createEmptyItem: () => T;
  minItems?: number;
  addButtonText?: string;
}

export function DynamicFormList<T>({
  title,
  items,
  renderForm,
  onAddItem,
  onRemoveItem,
  createEmptyItem,
  minItems = 0,
  addButtonText = "Adicionar"
}: DynamicFormListProps<T>) {
  const updateItem = (index: number, data: Partial<T>) => {
    // This will be handled by the parent component
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">{title}</h4>
        <Button type="button" variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          {addButtonText}
        </Button>
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <p>Nenhum item adicionado ainda.</p>
          <Button type="button" variant="outline" onClick={onAddItem} className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            {addButtonText}
          </Button>
        </div>
      )}
      
      {items.map((item, index) => (
        <Card key={index} className="relative">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{title} {index + 1}</CardTitle>
              {items.length > minItems && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {renderForm(item, index, updateItem)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}