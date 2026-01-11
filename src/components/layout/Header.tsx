import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
  showMenu?: boolean;
  className?: string;
  transparent?: boolean;
}

export function Header({ 
  title = "ZOE CHURCH", 
  showSearch = false, 
  showNotifications = true,
  showMenu = false,
  className,
  transparent = false
}: HeaderProps) {
  return (
    <header className={cn(
      "sticky top-0 z-40 w-full safe-area-inset-top",
      transparent ? "bg-transparent" : "glass",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showMenu && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <h1 className="font-bold text-lg tracking-tight">{title}</h1>
        </div>
        
        <div className="flex items-center gap-1">
          {showSearch && (
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Search className="h-5 w-5" />
            </Button>
          )}
          {showNotifications && (
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
