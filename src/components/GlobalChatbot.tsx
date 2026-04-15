import { useAuth } from "@/lib/auth";
import EnterpriseChatbot from "@/components/EnterpriseChatbot";
import StudentChatbot from "@/components/StudentChatbot";
import PublicChatbot from "@/components/PublicChatbot";

export default function GlobalChatbot() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <PublicChatbot />;
  }

  if (user.role === "enterprise") {
    return <EnterpriseChatbot />;
  }

  if (user.role === "student") {
    return <StudentChatbot />;
  }

  return null;
}
