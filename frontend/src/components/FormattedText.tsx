import React from 'react';
import { cn } from '../lib/utils';

export const FormattedText = ({ text, className }: { text: string, className?: string }) => {
  if (!text) return null;
  
  const formatted = text.split('\n').map((line, i) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return <div key={i} className="h-2" />; // Empty line spacer
    
    const isBullet = trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ');
    let content = isBullet ? trimmedLine.substring(2) : line;
    
    // Parse bold **text**
    const parts = content.split(/(\*\*.*?\*\*)/g);
    
    return (
      <div key={i} className={cn("mb-1.5", isBullet && "pl-5 relative before:content-['•'] before:absolute before:left-1.5 before:text-primary")}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={j} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
          }
          return part;
        })}
      </div>
    );
  });
  
  return <div className={cn("text-foreground/80 font-medium leading-relaxed", className)}>{formatted}</div>;
};
