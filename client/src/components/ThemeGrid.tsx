import { useState } from "react";
import { Plus, ArrowLeftFromLine, Import } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import ThemeCard from "./ThemeCard";
import ThemeEditModal from "./ThemeEditModal";
import { Theme } from "@shared/schema";

interface ThemeGridProps {
  themes: Theme[];
  onThemeUpdate: () => void;
}

export default function ThemeGrid({ themes, onThemeUpdate }: ThemeGridProps) {
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this theme?")) {
      try {
        const response = await fetch(`/api/themes/${id}`, { method: 'DELETE' });
        if (response.ok) {
          onThemeUpdate();
        }
      } catch (error) {
        console.error("Failed to delete theme:", error);
      }
    }
  };

  const handleModalClose = () => {
    setEditingTheme(null);
    onThemeUpdate();
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-slate-600 hover:text-slate-900"
          >
            {isCollapsed ? (
              <ArrowLeftFromLine className="w-4 h-4 mr-2" />
            ) : (
              <Import className="w-4 h-4 mr-2" />
            )}
            {isCollapsed ? "Expand All" : "Collapse All"}
          </Button>
          <Button
            variant="ghost"
            className="text-slate-600 hover:text-slate-900"
          >
            <ArrowLeftFromLine className="w-4 h-4 mr-2" />
            Auto-arrange
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {themes.map((theme) => (
          <ThemeCard
            key={theme.id}
            theme={theme}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}

        {/* Add New Theme Button */}
        <Card className="border-2 border-dashed border-slate-300 p-5 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer min-h-[280px]">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-slate-500" />
          </div>
          <h3 className="font-medium text-slate-900 mb-1">Add Custom Theme</h3>
          <p className="text-sm text-slate-600">Create a theme manually or merge existing ones</p>
        </Card>
      </div>

      {editingTheme && (
        <ThemeEditModal
          theme={editingTheme}
          isOpen={!!editingTheme}
          onClose={handleModalClose}
        />
      )}
    </>
  );
}
