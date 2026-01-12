import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { cn } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = ({ content, className }: MarkdownRendererProps) => {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Customize heading styles
          h1: ({ children }) => <h1 className="text-lg font-bold mb-3 text-foreground border-b border-border pb-1">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-2 text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-medium mb-2 text-foreground">{children}</h3>,
          
          // Customize paragraph styles
          p: ({ children }) => <p className="mb-3 text-foreground leading-relaxed last:mb-0">{children}</p>,
          
          // Customize list styles
          ul: ({ children }) => <ul className="list-none mb-3 space-y-1 pl-0">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 pl-0">{children}</ol>,
          li: ({ children }) => (
            <li className="text-foreground flex items-start">
              <span className="text-foreground mr-2 font-medium select-none">•</span>
              <span className="flex-1">{children}</span>
            </li>
          ),
          
          // Customize emphasis
          strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
          em: ({ children }) => <em className="italic text-foreground">{children}</em>,
          
          // Enhanced link styling with better visibility
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-link inline-flex items-center gap-1 font-medium break-words hover:no-underline"
            >
              {children}
              <ExternalLink className="h-3 w-3 inline-block ml-0.5 opacity-70 flex-shrink-0" />
            </a>
          ),
          
          // Customize inline code with better styling
          code: ({ children, className }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code className="markdown-inline-code px-1.5 py-0.5 text-xs font-mono">
                  {children}
                </code>
              );
            }
            // For code blocks with syntax highlighting
            return (
              <code className={cn("block text-xs font-mono", className)}>
                {children}
              </code>
            );
          },
          
          // Code block wrapper with enhanced styling
          pre: ({ children }) => (
            <pre className="markdown-code-block p-4 mb-4 overflow-x-auto text-sm leading-relaxed">
              {children}
            </pre>
          ),
          
          // Customize blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary/50 pl-4 py-2 italic text-muted-foreground mb-3 bg-muted/30 rounded-r-md">
              {children}
            </blockquote>
          ),
          
          // Customize horizontal rules
          hr: () => <hr className="border-border my-4" />,
          
          // Enhanced table support with better styling
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="markdown-table min-w-full">
                {children}
              </table>
            </div>
          ),
          
          thead: ({ children }) => (
            <thead className="bg-muted/50">
              {children}
            </thead>
          ),
          
          tbody: ({ children }) => (
            <tbody>
              {children}
            </tbody>
          ),
          
          tr: ({ children }) => (
            <tr className="border-b border-border last:border-b-0">
              {children}
            </tr>
          ),
          
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-foreground border-r border-border last:border-r-0">
              {children}
            </th>
          ),
          
          td: ({ children }) => (
            <td className="px-3 py-2 text-foreground border-r border-border last:border-r-0">
              {children}
            </td>
          ),
          
          // Strikethrough support (from remark-gfm)
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">
              {children}
            </del>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
