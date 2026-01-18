import { useState } from 'react';
import { 
  History, 
  Search, 
  ExternalLink, 
  FileText, 
  Share2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Transaction, ProofRecord } from '@/types/transaction';
import { formatAddress, formatDate } from '@/lib/transactions';

interface TransactionHistoryProps {
  transactions: Transaction[];
  onGenerateProof: (tx: Transaction) => ProofRecord;
  onDownload: (proof: ProofRecord, format: 'json' | 'xml') => void;
  onShare: (tx: Transaction) => string;
}

export const TransactionHistory = ({
  transactions,
  onGenerateProof,
  onDownload,
  onShare,
}: TransactionHistoryProps) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredTransactions = transactions.filter(tx => 
    tx.hash.toLowerCase().includes(search.toLowerCase()) ||
    tx.recipient.toLowerCase().includes(search.toLowerCase()) ||
    tx.memo.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopyLink = async (tx: Transaction) => {
    const link = onShare(tx);
    await navigator.clipboard.writeText(link);
    setCopiedId(tx.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: Transaction['status']) => {
    const styles = {
      confirmed: 'bg-success/20 text-success border-success/30',
      pending: 'bg-warning/20 text-warning border-warning/30',
      failed: 'bg-destructive/20 text-destructive border-destructive/30',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Payment History
        </h2>
        <span className="text-sm text-muted-foreground">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by hash, address, or memo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {transactions.length === 0 
              ? 'No transactions yet' 
              : 'No matching transactions found'}
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="border border-border rounded-lg overflow-hidden transition-colors hover:border-primary/30"
            >
              <div
                onClick={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                className="p-4 cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm">
                      {formatAddress(tx.hash)}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    To: {formatAddress(tx.recipient)}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-primary">
                    {tx.amount} USDT0
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(tx.timestamp)}
                  </div>
                </div>
                {expandedId === tx.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </div>

              {expandedId === tx.id && (
                <div className="px-4 pb-4 pt-0 border-t border-border animate-fade-in">
                  <div className="pt-4 space-y-3">
                    {tx.memo && (
                      <div>
                        <span className="text-xs text-muted-foreground block mb-1">Memo</span>
                        <p className="text-sm">{tx.memo}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Transaction Hash</span>
                      <p className="text-sm font-mono break-all">{tx.hash}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const proof = onGenerateProof(tx);
                          onDownload(proof, 'json');
                        }}
                      >
                        <FileText className="h-3 w-3" />
                        Download JSON
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const proof = onGenerateProof(tx);
                          onDownload(proof, 'xml');
                        }}
                      >
                        <FileText className="h-3 w-3" />
                        Download XML
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyLink(tx);
                        }}
                      >
                        {copiedId === tx.id ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedId === tx.id ? 'Copied!' : 'Copy Link'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`https://flarescan.com/tx/${tx.hash}`, '_blank');
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
