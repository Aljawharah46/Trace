import React, { useState } from 'react';
import { useIncident } from '../../context/IncidentContext';
import { 
  X, 
  Sparkles, 
  Send,
  Loader2,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface SubmitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  onSubmitted?: (requestId: string) => void;
}

export const SubmitRequestModal: React.FC<SubmitRequestModalProps> = ({
  isOpen,
  onClose,
  initialCategory,
  onSubmitted
}) => {
  const { submitRequest } = useIncident();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryHint, setCategoryHint] = useState<string>(initialCategory || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide both an incident title and problem description.');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const created = await submitRequest({
        title: title.trim(),
        description: description.trim(),
        category_hint: categoryHint || undefined
      });
      setIsSubmitting(false);
      onClose();
      if (created && onSubmitted) {
        onSubmitted(created.id);
      }
    } catch {
      setIsSubmitting(false);
      setErrorMsg('Failed to process incident with AI triage. Please retry.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-[#101828] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0F1319]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1E293B] border border-slate-700 text-[#80A6D7]">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#F8F7F8]">Submit New IT Incident or Request</h2>
              <p className="text-xs text-slate-400 font-mono">
                AI Triage Engine automatically determines priority & suggests instant self-fix steps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Issue Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Incident Summary / Problem Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Cannot connect to corporate VPN from Dubai branch, getting Error 800"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#80A6D7] transition-colors"
            />
          </div>

          {/* Quick Category Tag Pre-selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5">
              Service Domain (Optional Hint for AI)
            </label>
            <div className="flex flex-wrap gap-2">
              {['Network', 'Software', 'Hardware'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setCategoryHint(categoryHint === cat ? '' : cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                    categoryHint === cat
                      ? 'bg-[#80A6D7] text-[#0F1319] font-bold shadow-sm'
                      : 'bg-[#0F1319] text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <span className="text-[11px] text-slate-500 self-center font-mono ml-2">
                (AI will auto-classify if left blank)
              </span>
            </div>
          </div>

          {/* Free Text Description (NO PRIORITY SELECTOR - AI DETERMINES PRIORITY) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-200">
                Detailed Problem Description (Free Text) <span className="text-red-400">*</span>
              </label>
              <span className="text-[11px] font-mono text-[#80A6D7] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                PII & Credential Redaction Active
              </span>
            </div>
            <textarea
              required
              rows={5}
              disabled={isSubmitting}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, any error codes received, how many team members are affected, and what you were attempting to do..."
              className="w-full px-4 py-3 rounded-xl bg-[#0F1319] border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#80A6D7] transition-colors leading-relaxed"
            />
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              Note: Passwords, tokens, and credit card numbers are automatically masked before AI processing.
            </p>
          </div>

          {/* AI Autonomous Priority Explanation Box */}
          <div className="p-4 rounded-xl bg-[#0F1319] border border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-[#1E293B] border border-slate-700 text-[#80A6D7] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <span className="font-semibold text-white">How TRACE AI Assigns Priority</span>
              <p className="text-slate-400 mt-1 leading-relaxed text-[11px]">
                Priority is computed objectively based strictly on <strong>users affected</strong>, <strong>business & revenue impact</strong>, and <strong>security risk</strong>.
                If confidence &ge; 70%, TRACE AI will guide you through step-by-step interactive self-resolution!
              </p>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !description.trim()}
              className="px-5 py-2.5 rounded-xl bg-[#80A6D7] hover:bg-[#97bbed] disabled:opacity-50 disabled:cursor-not-allowed text-[#0F1319] text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#0F1319]" />
                  <span>AI Analyzing Incident...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit & Trigger AI Triage</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
