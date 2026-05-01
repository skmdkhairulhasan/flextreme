import "./flexai.css"

export default function FlexAILayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flexai-layout">
      {children}
    </div>
  )
}
