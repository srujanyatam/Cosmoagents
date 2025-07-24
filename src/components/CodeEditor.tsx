
import React, { useState, useRef } from 'react';
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
  const [showRewritePrompt, setShowRewritePrompt] = useState(false);
  const [rewritePrompt, setRewritePrompt] = useState('');
  const [rewriteLoading, setRewriteLoading] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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

  // Selection logic
  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    setSelection({ start: target.selectionStart, end: target.selectionEnd });
  };

  // AI Rewrite logic
  const handleRewrite = () => {
    if (!selection || selection.start === selection.end) {
      toast({ title: 'No code selected', description: 'Please highlight code to rewrite.' });
      return;
    }
    setShowRewritePrompt(true);
  };

  const handleRewriteSubmit = async () => {
    if (!selection || selection.start === selection.end || !rewritePrompt.trim()) return;
    setRewriteLoading(true);
    try {
      const selectedCode = code.slice(selection.start, selection.end);
      // Call your backend AI API here
      const response = await fetch('/api/ai-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: selectedCode, prompt: rewritePrompt, language }),
      });
      const data = await response.json();
      if (data.rewrittenCode) {
        const newCode = code.slice(0, selection.start) + data.rewrittenCode + code.slice(selection.end);
        setCode(newCode);
        setShowRewritePrompt(false);
        setRewritePrompt('');
        setSelection(null);
        toast({ title: 'AI Rewrite Complete', description: 'The selected code was rewritten by AI.' });
      } else {
        toast({ title: 'Rewrite Failed', description: 'AI did not return a rewrite.' });
      }
    } catch (err) {
      toast({ title: 'Rewrite Failed', description: 'An error occurred during AI rewrite.' });
    } finally {
      setRewriteLoading(false);
    }
  };
  
  // Simple syntax highlighting function (a real implementation would use a library like Prism)
  const getHighlightedCode = () => {
    if (!showLineNumbers) return code;
    
    const lines = code.split('\n');
    const paddingLength = lines.length.toString().length;
    
    return lines
      .map((line, index) => {
        const lineNumber = (index + 1).toString().padStart(paddingLength, ' ');
        return `${lineNumber} | ${line}`;
      })
      .join('\n');
  };
  
  return (
    <div className="w-full">
      <div className="rounded-md border bg-card">
        {!readOnly && (
          <div className="flex justify-between p-2 bg-muted">
            <div>
              {isEditing && (
                <Button variant="outline" size="sm" onClick={handleRewrite} disabled={rewriteLoading}>
                  Rewrite with AI
                </Button>
              )}
            </div>
            <div>
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="default" size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
        
        <ScrollArea style={{ height }}>
          <Textarea
            ref={textareaRef}
            value={isEditing ? code : getHighlightedCode()}
            onChange={handleCodeChange}
            onSelect={isEditing ? handleSelect : undefined}
            className={`font-mono text-sm w-full h-full p-4 resize-none border-none focus-visible:ring-0 ${
              readOnly || !isEditing ? 'bg-slate-900 text-white' : ''
            }`}
            readOnly={readOnly || !isEditing}
            style={{ minHeight: height }}
          />
        </ScrollArea>
        {/* AI Rewrite Prompt Modal */}
        {showRewritePrompt && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-2">Rewrite Selected Code with AI</h3>
              <textarea
                className="w-full border rounded p-2 mb-4"
                rows={3}
                placeholder="Describe how you want the code rewritten..."
                value={rewritePrompt}
                onChange={e => setRewritePrompt(e.target.value)}
                disabled={rewriteLoading}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowRewritePrompt(false)} disabled={rewriteLoading}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleRewriteSubmit} disabled={rewriteLoading || !rewritePrompt.trim()}>
                  {rewriteLoading ? 'Rewriting...' : 'Rewrite'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;
