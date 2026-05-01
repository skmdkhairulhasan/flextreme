"use client"
import { useState, useRef, useEffect } from "react"

type RichTextEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export default function RichTextEditor({ value, onChange, placeholder, minHeight = "200px" }: RichTextEditorProps) {
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set())
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || ""
    }
  }, [])

  function handleFormat(command: string, value?: string) {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
    updateActiveFormats()
  }

  function updateActiveFormats() {
    const formats = new Set<string>()
    if (document.queryCommandState("bold")) formats.add("bold")
    if (document.queryCommandState("italic")) formats.add("italic")
    if (document.queryCommandState("underline")) formats.add("underline")
    if (document.queryCommandState("insertUnorderedList")) formats.add("ul")
    if (document.queryCommandState("insertOrderedList")) formats.add("ol")
    setActiveFormats(formats)
  }

  function handleInput() {
    const html = editorRef.current?.innerHTML || ""
    onChange(html)
  }

  const buttonStyle = (active: boolean) => ({
    padding: "0.5rem 0.75rem",
    backgroundColor: active ? "black" : "white",
    color: active ? "white" : "black",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    fontSize: "0.875rem",
    fontWeight: active ? 700 : 400,
  })

  return (
    <div style={{ border: "1px solid #e0e0e0", backgroundColor: "white" }}>
      {/* Toolbar */}
      <div style={{ borderBottom: "1px solid #e0e0e0", padding: "0.5rem", display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => handleFormat("bold")}
          style={buttonStyle(activeFormats.has("bold"))}
          title="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("italic")}
          style={buttonStyle(activeFormats.has("italic"))}
          title="Italic"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => handleFormat("underline")}
          style={buttonStyle(activeFormats.has("underline"))}
          title="Underline"
        >
          <u>U</u>
        </button>
        
        <div style={{ width: "1px", backgroundColor: "#e0e0e0", margin: "0 0.25rem" }} />
        
        <button
          type="button"
          onClick={() => handleFormat("formatBlock", "<h2>")}
          style={buttonStyle(false)}
          title="Heading"
        >
          H
        </button>
        <button
          type="button"
          onClick={() => handleFormat("formatBlock", "<p>")}
          style={buttonStyle(false)}
          title="Paragraph"
        >
          P
        </button>
        
        <div style={{ width: "1px", backgroundColor: "#e0e0e0", margin: "0 0.25rem" }} />
        
        <button
          type="button"
          onClick={() => handleFormat("insertUnorderedList")}
          style={buttonStyle(activeFormats.has("ul"))}
          title="Bullet List"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => handleFormat("insertOrderedList")}
          style={buttonStyle(activeFormats.has("ol"))}
          title="Numbered List"
        >
          1. List
        </button>
        
        <div style={{ width: "1px", backgroundColor: "#e0e0e0", margin: "0 0.25rem" }} />
        
        <button
          type="button"
          onClick={() => handleFormat("removeFormat")}
          style={buttonStyle(false)}
          title="Clear Formatting"
        >
          Clear
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyUp={updateActiveFormats}
        onClick={updateActiveFormats}
        style={{
          padding: "1rem",
          minHeight,
          outline: "none",
          fontSize: "0.95rem",
          lineHeight: 1.7,
          color: "#333",
        }}
        data-placeholder={placeholder}
      />
      
      <style jsx>{`
        div[contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
