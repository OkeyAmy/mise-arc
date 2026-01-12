import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Smile, Frown, Send } from "lucide-react";

interface FeedbackWidgetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FeedbackWidget = ({ open, onOpenChange }: FeedbackWidgetProps) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(
    null
  );

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const feedbackData = {
        message: feedback,
        sentiment: sentiment,
        user_id: user?.id || null,
      };

      const { error } = await supabase.from("feedback").insert([feedbackData]);

      if (error) {
        console.error("Error submitting feedback:", error);
        alert("❌ Failed to submit feedback. Please try again.");
      } else {
        setSuccess(true);
        setFeedback("");
        setSentiment(null);
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("❌ An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border border-slate-200 rounded-xl p-6 text-sm max-w-md shadow-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          <Textarea
            className="bg-slate-100 text-slate-600 h-28 placeholder:text-slate-500 border border-slate-200 resize-none rounded-lg p-3"
            placeholder="Your feedback..."
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              setSuccess(false);
            }}
          />

          <div className="flex justify-between items-center mt-2">
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSentiment("positive")}
                className={sentiment === "positive" ? "bg-blue-50 text-blue-600 border border-blue-300" : ""}
                aria-pressed={sentiment === "positive"}
              >
                <Smile className="h-5 w-5" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSentiment("negative")}
                className={sentiment === "negative" ? "bg-blue-50 text-blue-600 border border-blue-300" : ""}
                aria-pressed={sentiment === "negative"}
              >
                <Frown className="h-5 w-5" />
              </Button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || !feedback.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Sending..." : "Send"}
            </Button>
          </div>

          {success && (
            <div className="text-green-600 text-center mt-2">
              🎉 Feedback received! Thank you.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackWidget; 