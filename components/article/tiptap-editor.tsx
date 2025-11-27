"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import CodeBlock from "@tiptap/extension-code-block"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import Strike from "@tiptap/extension-strike"
import * as React from "react"

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  editable?: boolean
}

export function TipTapEditor({
  content,
  onChange,
  placeholder,
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-md",
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: "bg-muted p-4 rounded-md",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Strike,
    ],
    content,
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4",
      },
    },
  })

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border rounded-md">
      {editable && (
        <div className="border-b p-2 flex gap-1 flex-wrap bg-muted/30">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("bold") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("italic") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("underline") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Underline"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("strike") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Strike"
          >
            <s>S</s>
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 1 }) ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Heading 1"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 2 }) ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Heading 2"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("heading", { level: 3 }) ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Heading 3"
          >
            H3
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("bulletList") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Bullet List"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("orderedList") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Ordered List"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("blockquote") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Blockquote"
          >
            &quot;
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("codeBlock") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Code Block"
          >
            &lt;/&gt;
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Enter URL:")
              if (url) {
                editor.chain().focus().setLink({ href: url }).run()
              }
            }}
            className={`px-2 py-1 rounded text-sm ${editor.isActive("link") ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Link"
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => {
              const url = window.prompt("Enter image URL:")
              if (url) {
                editor.chain().focus().setImage({ src: url }).run()
              }
            }}
            className={`px-2 py-1 rounded text-sm hover:bg-muted/50`}
            title="Image"
          >
            🖼️
          </button>
          <div className="w-px h-6 bg-border mx-1" />
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: "left" }) ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Align Left"
          >
            ⬅
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: "center" }) ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Align Center"
          >
            ⬌
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`px-2 py-1 rounded text-sm ${editor.isActive({ textAlign: "right" }) ? "bg-muted" : "hover:bg-muted/50"}`}
            title="Align Right"
          >
            ➡
          </button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
