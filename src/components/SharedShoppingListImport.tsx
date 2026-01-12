
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Loader2, ShoppingCart, Clock } from "lucide-react";
import { useSharedShoppingList } from "@/hooks/useSharedShoppingList";
import { ShoppingListItem } from "@/data/schema";
import { Session } from "@supabase/supabase-js";

interface SharedShoppingListImportProps {
  session: Session | null;
  onAddItems: (items: ShoppingListItem[]) => Promise<void>;
  onTriggerAIResponse: (message: string) => void;
}

export const SharedShoppingListImport = ({ 
  session, 
  onAddItems, 
  onTriggerAIResponse 
}: SharedShoppingListImportProps) => {
  const { shareToken } = useParams<{ shareToken: string }>();
  const navigate = useNavigate();
  const { getSharedList, importSharedItems, isImporting } = useSharedShoppingList(session);
  
  const [sharedList, setSharedList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    const loadSharedList = async () => {
      if (!shareToken) {
        setError("Invalid share link");
        setLoading(false);
        return;
      }

      try {
        const data = await getSharedList(shareToken);
        setSharedList(data);
      } catch (err) {
        console.error("Error loading shared list:", err);
        setError("This shared list has expired or doesn't exist");
      } finally {
        setLoading(false);
      }
    };

    loadSharedList();
  }, [shareToken, getSharedList]);

  const handleImport = async () => {
    if (!shareToken || !session) return;

    try {
      const { items, title } = await importSharedItems(shareToken, onAddItems);
      setImported(true);
      
      // Trigger AI response about the imported items
      const itemNames = items.map(item => `${item.quantity} ${item.unit} of ${item.item}`).join(', ');
      const aiMessage = `I've imported a shared shopping list "${title}" with these items: ${itemNames}. What would you like to do with these items? I can help you plan meals, suggest recipes, or organize your shopping.`;
      
      setTimeout(() => {
        onTriggerAIResponse(aiMessage);
        navigate('/');
      }, 2000);
    } catch (err) {
      console.error("Error importing shared list:", err);
      setError("Failed to import the shopping list");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Oops!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (imported) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-green-600">Success!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <p className="text-muted-foreground mb-4">
              Shopping list imported successfully! Redirecting...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = sharedList?.items as ShoppingListItem[] || [];
  const expiresAt = new Date(sharedList?.expires_at);
  const isExpired = expiresAt < new Date();

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            {sharedList?.title || "Shared Shopping List"}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {isExpired ? "Expired" : `Expires on ${expiresAt.toLocaleDateString()}`}
          </div>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <>
              <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                    <span className="font-medium">{item.item}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
              
              {session ? (
                <Button 
                  onClick={handleImport} 
                  disabled={isImporting || isExpired}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : isExpired ? (
                    "Link Expired"
                  ) : (
                    `Import ${items.length} item${items.length > 1 ? 's' : ''} to My List`
                  )}
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    Please sign in to import this shopping list
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    Sign In
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-muted-foreground">
              This shared list is empty.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
