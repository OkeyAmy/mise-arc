import { MealPlan as MealPlanType } from "@/data/schema";
import { MealCard } from "./MealCard";
import { Button } from "./ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface MealPlanProps {
  plan: MealPlanType;
}

export const MealPlan = ({ plan }: MealPlanProps) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 flex-1 lg:hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Weekly Meal Plan</h1>
        <div className="flex gap-2">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="icon"><ArrowRight className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="space-y-8">
        {plan.days.map((day) => (
          <div key={day.date}>
            <h2 className="text-xl font-semibold mb-4">{day.day}, {new Date(day.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MealCard mealType="breakfast" meal={day.meals.breakfast} />
              <MealCard mealType="lunch" meal={day.meals.lunch} />
              <MealCard mealType="dinner" meal={day.meals.dinner} />
              <MealCard mealType="snacks" meal={day.meals.snacks} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
