import { useRef, useState, type FormEvent } from 'react';
import { ImagePlus, Loader2, QrCode, Upload, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/common/Modal';
import { fetchQRCodes, submitTransactionRequest, uploadPaymentProof } from '@/lib/api';
import { errorMessage, formatPeso } from '@/lib/format';
import type { PaymentMethod, QRCodeRow, TransactionType } from '@/lib/models';

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
  { value: 'bank', label: 'Bank' },
];

interface RequestModalProps {
  mode: TransactionType;
  playerId: string;
  balance: number;
  onClose: () => void;
}

export function RequestModal({ mode, playerId, balance, onClose }: RequestModalProps) {
  const [method, setMethod] = useState<PaymentMethod>('gcash');
  const [amount, setAmount] = useState('');
  const [details, setDetails] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [qrCodes, setQrCodes] = useState<QRCodeRow[]>([]);
  const [qrLoading, setQrLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCashIn = mode === 'cash_in';
  const amountValue = Number(amount);
  const amountError =
    amount === ''
      ? null
      : !(amountValue > 0)
        ? 'Enter an amount greater than zero.'
        : !isCashIn && amountValue > balance
          ? `You can withdraw up to ${formatPeso(balance)}.`
          : null;

  // Load QR codes when cash-in modal opens
  if (isCashIn && qrCodes.length === 0 && !qrLoading) {
    setQrLoading(true);
    void fetchQRCodes()
      .then((codes) => setQrCodes(codes))
      .catch(() => {})
      .finally(() => setQrLoading(false));
  }

  const activeQR = qrCodes.find((qr) => qr.method === method);

  function handleFileSelect(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPEG, etc.).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (amountError || !(amountValue > 0)) {
      setError(amountError ?? 'Enter an amount greater than zero.');
      return;
    }
    if (details.trim().length < 4) {
      setError(isCashIn ? 'Enter the reference number of your payment.' : 'Enter your account number or name.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let proofUrl: string | null = null;
      if (isCashIn && proofFile) {
        proofUrl = await uploadPaymentProof(playerId, proofFile);
      }
      await submitTransactionRequest({
        playerId,
        type: mode,
        amount: amountValue,
        method,
        accountDetails: details.trim(),
        proofUrl,
        qrCodeId: isCashIn ? activeQR?.id ?? null : null,
      });
      setDone(true);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isCashIn ? 'Cash in to your wallet' : 'Withdraw from your wallet'} onClose={onClose}>
      {done ? (
        <div className="space-y-4 text-center">
          <p className="text-base font-semibold text-emerald-300">Request sent</p>
          <p className="text-sm text-slate-300">
            The admin will review it shortly. Your balance updates automatically once it is approved.
          </p>
          <button type="button" onClick={onClose} className="w-full rounded-xl bg-white/10 py-2.5 text-sm font-semibold text-white hover:bg-white/15">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {isCashIn && (
            <p className="text-sm text-slate-400">
              Scan the QR code to pay quickly, then enter your reference number and upload a screenshot of your payment as proof.
            </p>
          )}
          {!isCashIn && (
            <p className="text-sm text-slate-400">
              Enter where you want to receive your money. The admin deducts your balance once the withdrawal is approved.
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">Method</legend>
            <div className="grid grid-cols-3 gap-2">
              {METHODS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  aria-pressed={method === option.value}
                  className={`rounded-lg border py-2 text-sm font-medium transition ${
                    method === option.value
                      ? 'border-gold-400 bg-gold-400/10 text-gold-300'
                      : 'border-white/10 text-slate-300 hover:border-white/30'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          {/* QR Code display for cash-in */}
          {isCashIn && activeQR && (
            <div className="rounded-xl border border-white/10 bg-slate-950 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold-300">
                <QrCode className="h-4 w-4" /> {activeQR.label}
              </div>
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG value={activeQR.qr_payload} size={160} level="M" />
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-400">{activeQR.account_name}</p>
                  <p className="text-sm font-semibold text-white">{activeQR.account_number}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="request-amount" className="text-xs font-medium uppercase tracking-wider text-slate-400">
              Amount (PHP)
            </label>
            <input
              id="request-amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-lg font-semibold tabular-nums text-white outline-none focus:border-gold-400/60"
            />
            {amountError && <p className="text-xs text-amber-300">{amountError}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="request-details" className="text-xs font-medium uppercase tracking-wider text-slate-400">
              {isCashIn ? 'Reference number' : 'Account number or name'}
            </label>
            <input
              id="request-details"
              type="text"
              maxLength={60}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              placeholder={isCashIn ? 'e.g. 1234567890' : 'e.g. 09XX XXX XXXX - Juan D.'}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-gold-400/60"
            />
          </div>

          {/* Proof of payment upload for cash-in */}
          {isCashIn && (
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Proof of payment <span className="text-slate-500">(optional but recommended)</span>
              </label>
              {proofPreview ? (
                <div className="relative inline-block">
                  <img src={proofPreview} alt="Payment proof" className="max-h-32 rounded-xl border border-white/10" />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setProofPreview(null); }}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-slate-950 py-6 text-sm text-slate-400 transition hover:border-gold-400/50 hover:text-gold-300"
                >
                  <ImagePlus className="h-5 w-5" />
                  Upload screenshot of payment
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !!amountError}
            className="w-full rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:brightness-110 disabled:opacity-40"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Sending...
              </span>
            ) : isCashIn ? 'Submit cash-in request' : 'Submit withdrawal request'}
          </button>
        </form>
      )}
    </Modal>
  );
}
