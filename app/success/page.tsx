'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, CheckCircle2, Copy, Mail, Phone, Landmark, MapPin } from 'lucide-react';

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const paymentMethod = searchParams.get('method');
  const amount = searchParams.get('amount');
  const name = searchParams.get('name');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionId || paymentMethod) {
      // Simula un caricamento per dare tempo ai webhook di processare
      setTimeout(() => {
        setLoading(false);
      }, 2000);
    } else {
      setLoading(false);
    }
  }, [sessionId, paymentMethod]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Elaborazione in corso...
          </h2>
          <p className="text-gray-600">
            Stiamo verificando il tuo pagamento
          </p>
        </div>
      </div>
    );
  }

  if (!sessionId && !paymentMethod) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-red-100">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Sessione non valida
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Non è stata trovata una sessione di pagamento valida. Potrebbe essere scaduta o non esistere.
          </p>
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
              <Home className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-3">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                Pagamento Confermato!
              </h1>
              <p className="text-green-100 text-sm mt-1">La transazione è stata completata con successo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-green-100">
          {/* Success Icon */}
          <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-8 text-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce-slow">
              <CheckCircle2 className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Pagamento Completato!
            </h2>
            <p className="text-lg text-gray-600">
              La tua transazione è stata elaborata con successo
            </p>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-6">
            {/* Bonifico Istantaneo Success */}
            {paymentMethod === 'bonifico_istantaneo' && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-green-900 mb-4 flex items-center text-lg">
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Bonifico Istantaneo Confermato
                </h3>
                <p className="text-green-800 mb-4 text-sm">
                  Il suo bonifico istantaneo è stato ricevuto e la fattura è stata generata automaticamente.
                </p>
                <div className="bg-white border border-green-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Importo pagato</p>
                    <p className="font-bold text-xl text-gray-900">€{amount || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Servizio</p>
                    <p className="font-medium text-gray-900">{name}</p>
                  </div>
                  <div className="pt-2 border-t border-green-200">
                    <p className="text-sm text-green-700 font-medium">
                      ✅ Fattura inviata via email
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bonifico Instructions */}
            {paymentMethod === 'bonifico' && (
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-amber-900 mb-4 flex items-center text-lg">
                  <Landmark className="w-6 h-6 mr-2" />
                  Coordinate Bancarie per Bonifico
                </h3>
                <p className="text-amber-800 mb-4 text-sm">
                  Effettua il bonifico utilizzando i seguenti dati. La fattura sarà emessa al ricevimento del pagamento.
                </p>
                <div className="bg-white border border-amber-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Intestatario</p>
                    <p className="font-semibold text-gray-900">JUNIOR S.R.L.</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">IBAN</p>
                    <div className="flex items-center justify-between">
                      <code className="font-mono text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
                        IT60X0542404294000000123456
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('IT60X0542404294000000123456')}
                        className="ml-2"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Importo</p>
                    <p className="font-bold text-xl text-gray-900">€{amount || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Causale</p>
                    <p className="font-medium text-gray-900">Pagamento servizio - {name}</p>
                  </div>
                </div>
                <p className="text-xs text-amber-700 mt-4">
                  ⚠️ Ricordati di inserire la causale indicata per velocizzare l&apos;elaborazione del pagamento
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center text-lg">
                <Mail className="w-5 h-5 mr-2" />
                Prossimi Passaggi
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <p className="ml-3 text-blue-800">
                    Riceverai una <strong>email di conferma</strong> all&apos;indirizzo fornito entro pochi minuti
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <p className="ml-3 text-blue-800">
                    La <strong>fattura fiscale</strong> sarà generata automaticamente{
                      paymentMethod === 'bonifico' ? ' al ricevimento del bonifico' : 
                      paymentMethod === 'bonifico_istantaneo' ? ' e inviata via email' :
                      ' e inviata via email'
                    }
                  </p>
                </li>
                {paymentMethod !== 'bonifico' && paymentMethod !== 'bonifico_istantaneo' && (
                  <li className="flex items-start">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                      3
                    </div>
                    <p className="ml-3 text-blue-800">
                      Il <strong>modulo privacy</strong> (se generato) è stato inviato al Centro Biofertility
                    </p>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact Info */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-6">
              <h3 className="font-semibold text-amber-900 mb-4 flex items-center text-lg">
                <Phone className="w-5 h-5 mr-2" />
                Hai Bisogno di Aiuto?
              </h3>
              <p className="text-amber-800 mb-4 text-sm">
                Il nostro team è a tua disposizione per qualsiasi domanda o chiarimento
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start space-x-3">
                  <Phone className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Telefono</p>
                    <p className="text-amber-700">06 841 5269</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Mail className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-900">Email</p>
                    <p className="text-amber-700 break-all">centrimanna2@gmail.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center text-lg">
                <MapPin className="w-5 h-5 mr-2" />
                Centro Biofertility - JUNIOR S.R.L.
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-medium text-gray-900 mb-1">Sede Legale</p>
                  <p>Viale Eroi di Rodi 214</p>
                  <p>00128 Roma (RM)</p>
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Sede Operativa</p>
                  <p>Via Velletri 7</p>
                  <p>00198 Roma (RM)</p>
                </div>
                <div className="sm:col-span-2 pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    P.IVA: 05470161000 | PEC: juniorsrlroma@pec.it
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Link href="/">
                <Button className="w-full" variant="outline">
                  Torna alla Home
                </Button>
              </Link>

              <div className="text-center">
                <p className="text-xs text-gray-500">
                  ID Sessione: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{sessionId}</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Caricamento...
          </h2>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}