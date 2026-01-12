import { ResetConversationButton } from "./ResetConversationButton";
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';

interface ChatHeaderProps {
  onResetConversation: () => void;
}

// Removed the subheading and Reset button here as per new placement
export const ChatHeader = (_props: ChatHeaderProps) => {
  return (
    <div className="flex items-center p-4">
    </div>
  );
};
