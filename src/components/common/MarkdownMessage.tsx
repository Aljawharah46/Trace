import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownMessageProps {
  content: string;
  className?: string;
}

export const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, className = '' }) => {
  if (!content) return null;

  return (
    <div className={`prose-trace font-sans text-xs sm:text-sm text-slate-200 leading-relaxed ${className}`}>
      <ReactMarkdown
        components={{
          h1: ({ children, ...props }) => (
            <h1 className="text-base sm:text-lg font-bold text-white mt-3 mb-2 flex items-center gap-2 border-b border-slate-800 pb-1" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 className="text-sm sm:text-base font-bold text-white mt-3 mb-1.5 flex items-center gap-2" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 className="text-xs sm:text-sm font-bold text-[#80A6D7] mt-2.5 mb-1" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }) => (
            <h4 className="text-xs font-bold text-slate-300 mt-2 mb-1" {...props}>
              {children}
            </h4>
          ),
          p: ({ children, ...props }) => (
            <p className="text-xs sm:text-sm leading-relaxed text-slate-200 mb-2.5 last:mb-0" {...props}>
              {children}
            </p>
          ),
          strong: ({ children, ...props }) => (
            <strong className="font-bold text-white" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em className="italic text-slate-300" {...props}>
              {children}
            </em>
          ),
          ul: ({ children, ...props }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 mb-2.5 text-xs sm:text-sm text-slate-300" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 mb-2.5 text-xs sm:text-sm text-slate-300" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li className="leading-relaxed text-slate-300" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote className="border-l-2 border-[#80A6D7] pl-3 py-1.5 my-2.5 bg-slate-900/60 rounded-r-xl text-xs sm:text-sm text-slate-300 italic" {...props}>
              {children}
            </blockquote>
          ),
          hr: ({ ...props }) => (
            <hr className="border-slate-800 my-3" {...props} />
          ),
          code: ({ className: codeClassName, children, ...props }: any) => {
            const isBlock = String(children).includes('\n') || (codeClassName && codeClassName.includes('language-'));
            return isBlock ? (
              <pre className="p-3 rounded-xl bg-slate-900/90 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 my-2.5">
                <code {...props}>{children}</code>
              </pre>
            ) : (
              <code className="px-1.5 py-0.5 rounded bg-slate-800 text-[#80A6D7] font-mono text-[11px] sm:text-xs border border-slate-700/60" {...props}>
                {children}
              </code>
            );
          },
          a: ({ children, ...props }) => (
            <a className="text-[#80A6D7] hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
              {children}
            </a>
          )
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownMessage;
