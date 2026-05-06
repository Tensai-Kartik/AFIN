'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, Sparkles, FileText, HelpCircle, LayoutGrid, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface AIAssistantProps {
  content: string;
  title: string;
}

export function AIAssistant({ content, title }: AIAssistantProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const handleAction = async (action: 'summarize' | 'quiz' | 'pyq' | 'qa') => {
    if (!content) return;
    setLoading(action);
    setResult(null);
    try {
      const { data: sess } = await (window as any).supabase.auth.getSession();
      const token = sess.session?.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const res = await fetch(`${backendUrl}/api/ai/generate`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action, content, query: action === 'qa' ? query : undefined })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setResult(data.result);
    } catch (err: any) {
      toast.error(err.message || 'AI request failed');
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
      <CardHeader className="pb-3 border-b border-blue-100/50 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ rotate: -10, scale: 0.9 }}
            animate={{ rotate: 0, scale: 1 }}
            className="p-2 bg-blue-600 rounded-xl"
          >
            <Bot className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <CardTitle className="text-lg">AI Study Assistant</CardTitle>
            <p className="text-xs text-slate-500">Intelligent summaries and quizzes for {title}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div 
              key="options"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="grid grid-cols-2 gap-3"
            >
              <Button 
                variant="outline" 
                className="rounded-xl h-14 flex flex-col gap-1 bg-white hover:bg-blue-50 hover:text-blue-700 transition-all border-blue-100"
                onClick={() => handleAction('summarize')}
                disabled={!!loading}
              >
                {loading === 'summarize' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span className="text-[10px] uppercase font-bold tracking-wider">Summarize</span>
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl h-14 flex flex-col gap-1 bg-white hover:bg-blue-50 hover:text-blue-700 transition-all border-blue-100"
                onClick={() => handleAction('quiz')}
                disabled={!!loading}
              >
                {loading === 'quiz' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutGrid className="h-4 w-4" />}
                <span className="text-[10px] uppercase font-bold tracking-wider">Generate Quiz</span>
              </Button>
              <Button 
                variant="outline" 
                className="rounded-xl h-14 flex flex-col gap-1 bg-white hover:bg-blue-50 hover:text-blue-700 transition-all border-blue-100"
                onClick={() => handleAction('pyq')}
                disabled={!!loading}
              >
                {loading === 'pyq' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                <span className="text-[10px] uppercase font-bold tracking-wider">Exam Questions</span>
              </Button>
              <div className="relative group">
                <Button 
                  variant="outline" 
                  className="w-full rounded-xl h-14 flex flex-col gap-1 bg-white hover:bg-blue-50 hover:text-blue-700 transition-all border-blue-100"
                  onClick={() => query && handleAction('qa')}
                  disabled={!!loading || !query}
                >
                  {loading === 'qa' ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4" />}
                  <span className="text-[10px] uppercase font-bold tracking-wider">Ask Anything</span>
                </Button>
                <input 
                  type="text" 
                  placeholder="Ask about this..." 
                  className="absolute inset-x-0 -bottom-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity bg-white border border-blue-200 rounded-lg px-2 py-1 text-xs outline-none shadow-sm"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && query && handleAction('qa')}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-[400px] overflow-y-auto leading-relaxed shadow-inner">
                {result}
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setResult(null)}
                >
                  Back to Options
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="rounded-xl bg-white border-blue-100 text-blue-600 hover:bg-blue-50"
                  onClick={copyToClipboard}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
