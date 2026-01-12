import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, LogOut, Utensils } from "lucide-react";
import { Logo } from '@/components/Logo';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface HeaderProps {
  onShoppingListOpen: () => void;
  onLeftoversOpen: () => void;
  onVideoTrigger: () => void;
  isMobile?: boolean;
}

export const Header = ({ onShoppingListOpen, onLeftoversOpen, onVideoTrigger, isMobile = false }: HeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleHeaderClick = () => {
    if (!isMobile) {
      onVideoTrigger();
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-nav border-b border-glass-border/30 p-2 sm:p-4">
        <div className="flex flex-col items-start w-full font-inter">
          <div className="flex justify-between items-center w-full">
          <button 
            onClick={handleHeaderClick}
            className="text-left hover:opacity-80 transition-opacity duration-200"
            aria-label={!isMobile ? "Start video recording" : "Mise Home"}
            disabled={isMobile}
          >
            <Logo className="text-lg" />
          </button>
            <div className="flex gap-1 sm:gap-2">
              <Button 
                variant="ghost" 
                onClick={onShoppingListOpen}
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm glass-pill"
              >
                <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">Shopping</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/inventory')}
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm glass-pill"
              >
                <Package className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">Inventory</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={onLeftoversOpen}
                size="sm"
                className="px-2 sm:px-4 text-xs sm:text-sm glass-pill"
              >
                <Utensils className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="hidden xs:inline sm:inline">Leftovers</span>
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleLogout}
                size="sm"
                className="px-2 sm:px-3 glass-pill"
                aria-label="Logout"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground/80 font-normal pt-1 pl-0 sm:pl-0 tracking-tight">
            Know your kitchen. Own your meals.
          </div>
        </div>
      </header>
    </>
  );
};
