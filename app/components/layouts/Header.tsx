import { Link } from 'react-router';
import { Menu, Package } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface HeaderProps {
  onMenuClick: () => void;
  organizationName?: string;
}

export function Header({ onMenuClick, organizationName = 'Inventory System' }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        <Button variant="ghost" size="icon" className="md:hidden mr-2" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>

        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Package className="h-6 w-6" />
          <span className="hidden sm:inline-block">{organizationName}</span>
        </Link>

        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Development Mode</span>
        </div>
      </div>
    </header>
  );
}
