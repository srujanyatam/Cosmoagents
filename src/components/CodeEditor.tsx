
import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CodeEditorProps {
  initialCode: string;
  readOnly?: boolean;
  onSave?: (updatedCode: string) => void;
  height?: string;
  language?: 'sql' | 'plsql';
  showLineNumbers?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  initialCode,
  readOnly = false,
  onSave,
  height = '400px',
  language = 'sql',
  showLineNumbers = true,
}) => {
  const [code, setCode] = useState<string>(initialCode);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isRewriting, setIsRewriting] = useState<boolean>(false);
  const { toast } = useToast();
  
  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };
  
  const handleSave = () => {
    if (onSave) {
      onSave(code);
      setIsEditing(false);
      
      toast({
        title: 'Changes Saved',
        description: 'Your code changes have been saved.',
      });
    }
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setCode(initialCode);
    setIsEditing(false);
    
    toast({
      title: 'Changes Discarded',
      description: 'Your code changes have been discarded.',
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
        {!readOnly && (
          <div className="flex justify-end p-2 bg-muted gap-2">
            {!isEditing ? (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                Edit
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleRewriteWithAI} disabled={isRewriting}>
                  {isRewriting ? 'Rewriting...' : 'Rewrite with AI'}
                </Button>
              </>
            )}
          </div>
        )}
        <ScrollArea style={{ height }}>
          <div
            className={`flex font-mono text-sm w-full h-full p-0 bg-white ${readOnly || !isEditing ? 'bg-white' : ''}`}
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
              {readOnly || !isEditing ? (
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
