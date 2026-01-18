import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

export const Header = ({ children }: { children?: React.ReactNode }) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-orange-500">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm leading-none">PayProof</span>
            <span className="text-xs text-muted-foreground">on Flare</span>
          </div>
        </Link>
        {children}
      </div>
    </header>
  );
};
