"use client"

import { TipTapEditor } from "./tiptap-editor"

interface ArticleContentProps {
  content: string
}

export function ArticleContent({ content }: ArticleContentProps) {
  return (
    <TipTapEditor
      content={content}
      onChange={() => {}}
      editable={false}
    />
  )
}

