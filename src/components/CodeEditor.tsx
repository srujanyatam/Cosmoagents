
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  initialCode: string;
  value?: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql';
  showLineNumbers?: boolean;
  selection?: { start: number; end: number };
  onSelectionChange?: (sel: { start: number; end: number }) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  value,
  onChange,
  readOnly = false,
  onSave,
  height = '400px',
  language = 'sql',
  showLineNumbers = true,
  selection,
  onSelectionChange,
}) => {
  const [code, setCode] = useState<string>(value !== undefined ? value : initialCode);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    if (value !== undefined && value !== code) setCode(value);
  }, [value]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    if (onChange) onChange(e.target.value);
  };

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    if (onSelectionChange) {
      const target = e.target as HTMLTextAreaElement;
      onSelectionChange({ start: target.selectionStart, end: target.selectionEnd });
    }
  };

  const handleSave = () => {
    if (onSave) onSave(code);
    toast({
      title: 'Changes Saved',
      description: 'Your code changes have been saved.',
    });
  };

  const handleRewriteWithAI = async () => {
    setIsRewriting(true);
    try {
      const response = await fetch('/.netlify/functions/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, prompt: 'Rewrite and optimize this code', language }),
      });
      if (!response.ok) throw new Error('AI rewrite failed');
      const data = await response.json();
      setCode(data.rewrittenCode || code);
      if (onChange) onChange(data.rewrittenCode || code);
      toast({
        title: 'AI Rewrite Complete',
        description: 'Your code has been rewritten by AI.',
      });
    } catch (err) {
      toast({
        title: 'AI Rewrite Failed',
        description: 'Could not rewrite code with AI.',
        variant: 'destructive',
      });
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-md border bg-card">
        <ScrollArea style={{ height }}>
          <div
            className={`flex font-mono text-sm w-full h-full p-0 bg-white`}
            style={{ minHeight: height }}
          >
            {/* Line numbers column */}
            {showLineNumbers && (
              <div
                className="select-none text-right pr-4 py-4 bg-gray-50 border-r border-gray-200 text-gray-400"
                style={{ userSelect: 'none', minWidth: '3em' }}
                aria-hidden="true"
              >
                {code.split('\n').map((_, i) => (
                  <div key={i} style={{ height: '1.5em', lineHeight: '1.5em' }}>{i + 1}</div>
                ))}
              </div>
            )}
            {/* Code column */}
            <div className="flex-1 py-4">
              {readOnly ? (
                <pre
                  className="w-full h-full bg-white text-black whitespace-pre-wrap focus:outline-none"
                  style={{ minHeight: height, fontFamily: 'inherit', fontSize: 'inherit', margin: 0 }}
                  tabIndex={0}
                >
                  {code}
                </pre>
              ) : (
                <Textarea
                  value={code}
                  onChange={handleCodeChange}
                  onSelect={handleSelection}
                  className="w-full h-full p-0 border-none focus-visible:ring-0 bg-white text-black"
                  style={{ minHeight: height, fontFamily: 'inherit', fontSize: 'inherit' }}
                />
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CodeEditor;
