interface ArticleContentServerProps {
  content: string
}

export function ArticleContentServer({ content }: ArticleContentServerProps) {
  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

