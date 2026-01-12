
import { Meal } from "@/data/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Flame, Info, BotMessageSquare, RotateCw } from "lucide-react";

interface MealCardProps {
  mealType: string;
  meal: Meal;
}

export const MealCard = ({ mealType, meal }: MealCardProps) => {
  return (
    <Dialog>
      <Card className="flex-1 min-w-[200px] hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium capitalize">{mealType}</CardTitle>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Info className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DialogTrigger>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{meal.name}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            <Flame className="h-3 w-3 mr-1 text-orange-500" />
            <span>{meal.calories} kcal</span>
          </div>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="mt-4 w-full">View Details</Button>
          </DialogTrigger>
        </CardContent>
      </Card>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{meal.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Calories</h3>
            <p>{meal.calories} kcal</p>
          </div>
          <div>
            <h3 className="font-semibold">Macros</h3>
            <p>Protein: {meal.macros.protein}g, Carbs: {meal.macros.carbs}g, Fat: {meal.macros.fat}g</p>
          </div>
          <div>
            <h3 className="font-semibold">Ingredients</h3>
            <ul className="list-disc list-inside">
              {meal.ingredients.map((ing) => (
                <li key={ing.item}>{ing.item} ({ing.quantity} {ing.unit})</li>
              ))}
            </ul>
          </div>
          <div className="flex gap-2 pt-4">
             <Button className="w-full"><RotateCw className="mr-2 h-4 w-4"/>Swap Meal</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
