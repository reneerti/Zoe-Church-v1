import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  // Parse markdown: **bold**, *italic*, __underline__, ***bold italic***
  const parseMarkdown = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    // Regex patterns for markdown
    const patterns = [
      { regex: /\*\*\*(.*?)\*\*\*/g, Component: ({ children }: { children: string }) => <strong className="italic">{children}</strong> },
      { regex: /\*\*(.*?)\*\*/g, Component: ({ children }: { children: string }) => <strong className="font-bold">{children}</strong> },
      { regex: /__(.*?)__/g, Component: ({ children }: { children: string }) => <u className="underline">{children}</u> },
      { regex: /\*(.*?)\*/g, Component: ({ children }: { children: string }) => <em className="italic">{children}</em> },
      { regex: /_(.*?)_/g, Component: ({ children }: { children: string }) => <em className="italic">{children}</em> },
    ];

    // Simple recursive parsing
    const parseText = (text: string): React.ReactNode[] => {
      let result: React.ReactNode[] = [];
      let lastIndex = 0;
      
      // Find all markdown patterns
      const allMatches: { start: number; end: number; content: string; type: 'bold-italic' | 'bold' | 'underline' | 'italic' }[] = [];
      
      // Bold italic (***text***)
      let match;
      const boldItalicRegex = /\*\*\*(.*?)\*\*\*/g;
      while ((match = boldItalicRegex.exec(text)) !== null) {
        allMatches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'bold-italic' });
      }
      
      // Bold (**text**)
      const boldRegex = /\*\*(.*?)\*\*/g;
      while ((match = boldRegex.exec(text)) !== null) {
        // Check if not part of bold-italic
        const isPartOfBoldItalic = allMatches.some(m => m.type === 'bold-italic' && match!.index >= m.start && match!.index < m.end);
        if (!isPartOfBoldItalic) {
          allMatches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'bold' });
        }
      }
      
      // Underline (__text__)
      const underlineRegex = /__(.*?)__/g;
      while ((match = underlineRegex.exec(text)) !== null) {
        allMatches.push({ start: match.index, end: match.index + match[0].length, content: match[1], type: 'underline' });
      }
      
      // Italic (*text* or _text_)
      const italicRegex = /(?<!\*)\*(?!\*)([^*]+)\*(?!\*)|(?<!_)_(?!_)([^_]+)_(?!_)/g;
      while ((match = italicRegex.exec(text)) !== null) {
        const content = match[1] || match[2];
        const isPartOfOther = allMatches.some(m => match!.index >= m.start && match!.index < m.end);
        if (!isPartOfOther) {
          allMatches.push({ start: match.index, end: match.index + match[0].length, content, type: 'italic' });
        }
      }
      
      // Sort by position
      allMatches.sort((a, b) => a.start - b.start);
      
      // Filter overlapping matches (keep first)
      const filteredMatches: typeof allMatches = [];
      for (const m of allMatches) {
        const overlaps = filteredMatches.some(fm => 
          (m.start >= fm.start && m.start < fm.end) || 
          (m.end > fm.start && m.end <= fm.end)
        );
        if (!overlaps) {
          filteredMatches.push(m);
        }
      }
      
      // Build result
      for (const m of filteredMatches) {
        if (m.start > lastIndex) {
          result.push(text.substring(lastIndex, m.start));
        }
        
        const keyId = key++;
        switch (m.type) {
          case 'bold-italic':
            result.push(<strong key={keyId} className="font-bold italic">{m.content}</strong>);
            break;
          case 'bold':
            result.push(<strong key={keyId} className="font-bold">{m.content}</strong>);
            break;
          case 'underline':
            result.push(<u key={keyId} className="underline decoration-2">{m.content}</u>);
            break;
          case 'italic':
            result.push(<em key={keyId} className="italic">{m.content}</em>);
            break;
        }
        
        lastIndex = m.end;
      }
      
      if (lastIndex < text.length) {
        result.push(text.substring(lastIndex));
      }
      
      return result.length > 0 ? result : [text];
    };

    return parseText(content);
  };

  // Split by newlines and parse each line
  const lines = content.split('\n');


  return (
    <div className={cn("space-y-1", className)}>
      {lines.map((line, i) => (
        <p key={i} className="leading-relaxed">
          {parseMarkdown(line)}
        </p>
      ))}
    </div>
  );
}
