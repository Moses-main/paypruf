import jsPDF from 'jspdf';

export interface ProofData {
  id: string;
  senderAddress: string;
  recipientAddress: string;
  amount: string;
  currency?: string;
  memo?: string;
  status: string;
  transactionHash?: string;
  proofHash?: string;
  flareAnchorTxHash?: string;
  createdAt: string;
}

export interface ISOProofRecord {
  // ISO 20022 pain.001 inspired structure
  groupHeader: {
    messageId: string;
    creationDateTime: string;
    numberOfTransactions: number;
    controlSum: string;
  };
  paymentInformation: {
    paymentInformationId: string;
    paymentMethod: string;
    requestedExecutionDate: string;
    debtor: {
      name: string;
      identification: string;
    };
    creditor: {
      name: string;
      identification: string;
    };
    amount: {
      currency: string;
      value: string;
    };
    remittanceInformation?: string;
  };
  supplementaryData: {
    blockchainProof: {
      networkId: string;
      networkName: string;
      transactionHash: string;
      anchorHash?: string;
      proofHash?: string;
      blockExplorerUrl: string;
    };
    verificationUrl: string;
  };
}

const BLOCK_EXPLORER_URL = 'https://coston2-explorer.flare.network';

export const generateISOProofRecord = (payment: ProofData): ISOProofRecord => {
  const now = new Date().toISOString();
  
  return {
    groupHeader: {
      messageId: payment.id,
      creationDateTime: now,
      numberOfTransactions: 1,
      controlSum: payment.amount,
    },
    paymentInformation: {
      paymentInformationId: `PMT-${payment.id.slice(0, 8)}`,
      paymentMethod: 'BLOCKCHAIN',
      requestedExecutionDate: payment.createdAt,
      debtor: {
        name: 'Sender',
        identification: payment.senderAddress,
      },
      creditor: {
        name: 'Recipient', 
        identification: payment.recipientAddress,
      },
      amount: {
        currency: payment.currency || 'FLR',
        value: payment.amount,
      },
      remittanceInformation: payment.memo,
    },
    supplementaryData: {
      blockchainProof: {
        networkId: '114',
        networkName: 'Flare Coston2 Testnet',
        transactionHash: payment.transactionHash || '',
        anchorHash: payment.flareAnchorTxHash,
        proofHash: payment.proofHash || generateProofHash(payment),
        blockExplorerUrl: payment.transactionHash 
          ? `${BLOCK_EXPLORER_URL}/tx/${payment.transactionHash}`
          : '',
      },
      verificationUrl: `${window.location.origin}/proof/${payment.id}`,
    },
  };
};

export const generateProofHash = (payment: ProofData): string => {
  // Simple hash simulation - in production this would be a proper SHA-256
  const data = `${payment.id}-${payment.senderAddress}-${payment.recipientAddress}-${payment.amount}-${payment.createdAt}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0')}`;
};

export const generateJSONProof = (payment: ProofData): string => {
  const isoRecord = generateISOProofRecord(payment);
  return JSON.stringify(isoRecord, null, 2);
};

export const generatePDFProof = async (payment: ProofData): Promise<Blob> => {
  const doc = new jsPDF();
  const isoRecord = generateISOProofRecord(payment);
  
  // Header
  doc.setFontSize(24);
  doc.setTextColor(79, 70, 229); // Primary color
  doc.text('PayProof', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text('ISO-Compliant Payment Proof', 105, 28, { align: 'center' });
  
  // Horizontal line
  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(20, 35, 190, 35);
  
  let yPos = 45;
  
  // Payment ID
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Payment ID:', 20, yPos);
  doc.setTextColor(0);
  doc.setFont('courier', 'normal');
  doc.text(payment.id, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 10;
  
  // Status
  doc.setTextColor(100);
  doc.text('Status:', 20, yPos);
  doc.setTextColor(34, 197, 94); // Green for completed
  doc.text(payment.status, 60, yPos);
  
  yPos += 10;
  
  // Date
  doc.setTextColor(100);
  doc.text('Date:', 20, yPos);
  doc.setTextColor(0);
  doc.text(new Date(payment.createdAt).toLocaleString(), 60, yPos);
  
  yPos += 15;
  
  // Transaction Details Section
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text('Transaction Details', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('From:', 20, yPos);
  doc.setTextColor(0);
  doc.setFont('courier', 'normal');
  doc.text(payment.senderAddress, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 8;
  
  doc.setTextColor(100);
  doc.text('To:', 20, yPos);
  doc.setTextColor(0);
  doc.setFont('courier', 'normal');
  doc.text(payment.recipientAddress, 60, yPos);
  doc.setFont('helvetica', 'normal');
  
  yPos += 8;
  
  doc.setTextColor(100);
  doc.text('Amount:', 20, yPos);
  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.text(`${payment.amount} ${payment.currency || 'FLR'}`, 60, yPos);
  doc.setFontSize(10);
  
  if (payment.memo) {
    yPos += 8;
    doc.setTextColor(100);
    doc.text('Memo:', 20, yPos);
    doc.setTextColor(0);
    doc.text(payment.memo, 60, yPos);
  }
  
  yPos += 15;
  
  // Blockchain Verification Section
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text('Blockchain Verification', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Network:', 20, yPos);
  doc.setTextColor(0);
  doc.text('Flare Coston2 Testnet', 60, yPos);
  
  if (payment.transactionHash) {
    yPos += 8;
    doc.setTextColor(100);
    doc.text('Tx Hash:', 20, yPos);
    doc.setTextColor(0);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(payment.transactionHash, 60, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  }
  
  yPos += 8;
  doc.setTextColor(100);
  doc.text('Proof Hash:', 20, yPos);
  doc.setTextColor(0);
  doc.setFont('courier', 'normal');
  doc.setFontSize(8);
  doc.text(isoRecord.supplementaryData.blockchainProof.proofHash || 'N/A', 60, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  if (payment.flareAnchorTxHash) {
    yPos += 8;
    doc.setTextColor(100);
    doc.text('Anchor Hash:', 20, yPos);
    doc.setTextColor(0);
    doc.setFont('courier', 'normal');
    doc.setFontSize(8);
    doc.text(payment.flareAnchorTxHash, 60, yPos);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
  }
  
  yPos += 15;
  
  // Verification URL
  doc.setFontSize(14);
  doc.setTextColor(79, 70, 229);
  doc.text('Verification', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Verify this proof at:', 20, yPos);
  yPos += 6;
  doc.setTextColor(79, 70, 229);
  doc.text(isoRecord.supplementaryData.verificationUrl, 20, yPos);
  
  if (payment.transactionHash) {
    yPos += 10;
    doc.setTextColor(100);
    doc.text('View on block explorer:', 20, yPos);
    yPos += 6;
    doc.setTextColor(79, 70, 229);
    doc.text(isoRecord.supplementaryData.blockchainProof.blockExplorerUrl, 20, yPos);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('Generated by PayProof • Powered by Flare Network', 105, 280, { align: 'center' });
  doc.text(`Generated on ${new Date().toISOString()}`, 105, 285, { align: 'center' });
  
  return doc.output('blob');
};

export const downloadProof = async (
  payment: ProofData, 
  format: 'json' | 'pdf'
): Promise<void> => {
  let blob: Blob;
  let filename: string;
  
  if (format === 'json') {
    const jsonContent = generateJSONProof(payment);
    blob = new Blob([jsonContent], { type: 'application/json' });
    filename = `payment-proof-${payment.id}.json`;
  } else {
    blob = await generatePDFProof(payment);
    filename = `payment-proof-${payment.id}.pdf`;
  }
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
