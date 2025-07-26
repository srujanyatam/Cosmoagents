import { useToast } from '@/hooks/use-toast';

export interface AIRewriteRequest {
  code: string;
  prompt?: string;
  originalCode?: string;
  issue?: string;
}

export interface AIRewriteResponse {
  rewrittenCode: string;
  success: boolean;
  error?: string;
}

export const requestAIRewrite = async (request: AIRewriteRequest): Promise<AIRewriteResponse> => {
  try {
    const response = await fetch('/.netlify/functions/ai-code-rewrite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        rewrittenCode: data.rewrittenCode,
        success: true,
      };
    } else {
      return {
        rewrittenCode: '',
        success: false,
        error: data.error || 'AI rewrite failed',
      };
    }
  } catch (error) {
    console.error('AI rewrite request failed:', error);
    return {
      rewrittenCode: '',
      success: false,
      error: 'Network error occurred during AI rewrite',
    };
  }
};

export const useAIRewrite = () => {
  const { toast } = useToast();

  const rewriteCode = async (
    code: string,
    issue?: string,
    originalCode?: string,
    customPrompt?: string
  ): Promise<string | null> => {
    try {
      const response = await requestAIRewrite({
        code,
        issue,
        originalCode,
        prompt: customPrompt,
      });

      if (response.success) {
        toast({
          title: 'AI Rewrite Successful',
          description: 'The code has been improved by AI.',
        });
        return response.rewrittenCode;
      } else {
        toast({
          title: 'AI Rewrite Failed',
          description: response.error || 'Failed to rewrite code with AI.',
          variant: 'destructive',
        });
        return null;
      }
    } catch (error) {
      console.error('AI rewrite error:', error);
      toast({
        title: 'AI Rewrite Error',
        description: 'An unexpected error occurred during AI rewrite.',
        variant: 'destructive',
      });
      return null;
    }
  };

  return { rewriteCode };
}; 