"use client"

import ReactMarkdown from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import { cn } from "@/lib/utils"

interface MarkdownTextProps {
  children: string;
  className?: string;
}

export function MarkdownText({ children, className }: MarkdownTextProps) {
  return (
    <div className={cn("prose prose-neutral dark:prose-invert max-w-none break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
