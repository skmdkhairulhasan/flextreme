"use client"
import ChatBot from "@/components/ui/ChatBot"

export default function FlexAIPage() {
  return (
    <div style={{ 
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
      backgroundColor: "black", zIndex: 1, 
      display: "flex", flexDirection: "column" 
    }}>
      <ChatBot fullPage />
    </div>
  )
}
