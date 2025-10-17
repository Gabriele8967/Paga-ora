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
            {/* Bonifico Istantaneo Instructions */}
            {paymentMethod === 'bonifico_istantaneo' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
                  <CheckCircle2 className="w-6 h-6 mr-2" />
                  Istruzioni per Bonifico Istantaneo
                </h3>
                <p className="text-blue-800 mb-4 text-sm">
                  Per completare il pagamento, effettua un bonifico istantaneo e invia la ricevuta di pagamento.
                </p>
                <div className="bg-white border border-blue-200 rounded-lg p-4 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Importo da pagare</p>
                    <p className="font-bold text-xl text-gray-900">€{amount || '0.00'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Servizio</p>
                    <p className="font-medium text-gray-900">{name}</p>
                  </div>
                  
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-semibold text-amber-900 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Passi da seguire:
                    </h4>
                    <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
                      <li>Effettua il bonifico istantaneo per l'importo indicato</li>
                      <li>Salva la ricevuta di pagamento</li>
                      <li>Invia la ricevuta via email a: <strong>centrimanna2@gmail.com</strong></li>
                      <li>Riceverai la fattura via email dopo la conferma</li>
                    </ol>
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>📧 Email:</strong> centrimanna2@gmail.com<br/>
                      <strong>📋 Oggetto:</strong> Ricevuta bonifico istantaneo - {name}
                    </p>
                  </div>
                </div>
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
                      paymentMethod === 'bonifico_istantaneo' ? ' dopo l\'invio della ricevuta di pagamento' :
                      ' e inviata via email'
                    }
                  </p>
                </li>
                {paymentMethod !== 'bonifico_istantaneo' && (
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