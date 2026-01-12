import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { ScrollArea } from "./ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible";
import { ThoughtStep } from "@/data/schema";
import { CheckCircle, Circle, Loader2, Wrench, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface ThoughtProcessProps {
  steps: ThoughtStep[];
}

const formatFunctionCallDetails = (details: string) => {
  try {
    // Try to parse as JSON to format function call arguments
    const parsed = JSON.parse(details);
    return JSON.stringify(parsed, null, 2);
  } catch {
    // If not JSON, return as is
    return details;
  }
};

const getFunctionCallIcon = (step: string) => {
  if (step.includes("🔨 Preparing to call function")) {
    return <Wrench className="h-5 w-5 text-blue-500" />;
  }
  return null;
};

export const ThoughtProcess = ({ steps }: ThoughtProcessProps) => {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary animate-pulse"></div>
          Thought Process
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0 overflow-hidden">
        <ScrollArea className="h-full overscroll-contain">
          <div className="p-4 space-y-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0">
                    {step.status === 'completed' && (
                      getFunctionCallIcon(step.step) || <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {step.status === 'active' && (
                      getFunctionCallIcon(step.step) || <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    )}
                    {step.status === 'pending' && (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className="w-px flex-grow bg-border my-1"></div>
                  )}
                </div>
                <div className="pb-4 flex-1 min-w-0">
                  <p className={cn(
                      "text-sm font-medium",
                      step.status === 'completed' && "text-green-700",
                      step.status === 'active' && "text-primary",
                      step.status === 'pending' && "text-muted-foreground"
                    )}>
                      {step.step}
                  </p>
                  {step.details && (
                    <div className="mt-1">
                      <Collapsible 
                        open={expandedSteps.has(step.id)} 
                        onOpenChange={() => toggleStepExpansion(step.id)}
                      >
                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                          {expandedSteps.has(step.id) ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          {step.step.includes("🔨 Preparing to call function") ? "Function Data" : "Details"}
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <pre className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap font-sans bg-background/50 p-2 rounded-sm overflow-x-auto border">
                            {step.step.includes("🔨 Preparing to call function") 
                              ? formatFunctionCallDetails(step.details)
                              : step.details
                            }
                          </pre>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
