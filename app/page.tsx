/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateTotalWithStampDuty } from '@/lib/fattureincloud';
import { validateFiscalCode } from '@/lib/fiscal-code-validator';
import { FiscalCodeInput } from '@/components/FiscalCodeInput';
import { CreditCard, User, MapPin, Shield, CheckCircle2, Mail, Phone, Landmark, Banknote, Smartphone } from 'lucide-react';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep] = useState(1);
  const [showPrivacyPopup, setShowPrivacyPopup] = useState(false);
  const [generatePrivacy, setGeneratePrivacy] = useState(true);

  const [formData, setFormData] = useState({
    // Dati servizio
    amount: '',
    serviceName: '',
    serviceDescription: '',
    paymentMethod: 'stripe' as 'stripe' | 'bonifico' | 'bonifico_istantaneo' | 'contanti' | 'pos' | 'altro',

    // Dati anagrafici
    name: '',
    email: '',
    phone: '',
    fiscalCode: '',
    birthDate: '',
    luogoNascita: '',
    indirizzo: '',
    cap: '',
    citta: '',
    provincia: '',

    // Consensi GDPR
    gdprConsent: false,
    privacyConsent: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione consensi GDPR obbligatori
    if (!formData.gdprConsent || !formData.privacyConsent) {
      setError('Devi accettare entrambi i consensi per la privacy per procedere');
      return;
    }

    setShowPrivacyPopup(true);
  };

  const proceedWithSubmission = async () => {
    setError('');
    setIsLoading(true);
    setShowPrivacyPopup(false);

    try {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Inserisci un importo valido');
      }

      // Validazione intelligente del codice fiscale
      const fiscalValidation = validateFiscalCode({
        name: formData.name,
        birthDate: formData.birthDate,
        fiscalCode: formData.fiscalCode,
      });

      if (!fiscalValidation.valid) {
        throw new Error(`Codice Fiscale non valido: ${fiscalValidation.errors.join(', ')}`);
      }

      // Mostra warnings se presenti
      if (fiscalValidation.warnings.length > 0) {
        console.warn('Avvisi CF:', fiscalValidation.warnings);
      }

      // Gestione diversa in base al metodo di pagamento
      if (formData.paymentMethod === 'stripe') {
        // Pagamento con carta: redirect a Stripe Checkout
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount,
            generatePrivacy,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Errore nella creazione del pagamento');
        }

        // Redirect a Stripe Checkout
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        // Pagamento non-Stripe (bonifico, bonifico_istantaneo, contanti, pos, altro)
        const response = await fetch('/api/direct-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            amount,
            generatePrivacy,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Errore nella registrazione del pagamento');
        }

        // Redirect a pagina di conferma
        window.location.href = `/success?method=${formData.paymentMethod}&amount=${total.toFixed(2)}&name=${encodeURIComponent(formData.name)}`;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Si è verificato un errore');
      setIsLoading(false);
    }
  };

  const amount = parseFloat(formData.amount) || 0;
  const total = calculateTotalWithStampDuty(amount);
  const stampDuty = total - amount;

  const steps = [
    { number: 1, title: 'Pagamento', icon: CreditCard },
    { number: 2, title: 'Anagrafica', icon: User },
    { number: 3, title: 'Indirizzo', icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Centro Biofertility
              </h1>
              <p className="text-blue-100 text-sm mt-1">JUNIOR S.R.L. - P.IVA 05470161000</p>
            </div>
            <div className="hidden sm:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>06 841 5269</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>centrimanna2@gmail.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 transition-all duration-300 ${
                    currentStep >= step.number
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm mt-2 font-medium whitespace-nowrap ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`h-0.5 w-24 mx-4 transition-all duration-300 ${
                    currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 sm:px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Completa il tuo pagamento
            </h2>
            <p className="text-blue-100 mt-1">
              Inserisci i tuoi dati per procedere con il pagamento sicuro
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            {/* Sezione Pagamento */}
            <div className="space-y-6 pb-8 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 text-blue-600">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Dettagli Pagamento</h3>
                  <p className="text-sm text-gray-500">Inserisci importo e causale del servizio</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="amount">Importo (€) *</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Es: 150.00"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="serviceName">Nome Servizio / Causale *</Label>
                  <Input
                    id="serviceName"
                    name="serviceName"
                    placeholder="Es: Visita ginecologica"
                    value={formData.serviceName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="serviceDescription">Descrizione Dettagliata</Label>
                  <Textarea
                    id="serviceDescription"
                    name="serviceDescription"
                    placeholder="Eventuali dettagli aggiuntivi sul servizio..."
                    value={formData.serviceDescription}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Metodo di Pagamento *</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'stripe' }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === 'stripe'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 mb-2 ${formData.paymentMethod === 'stripe' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'stripe' ? 'text-blue-900' : 'text-gray-700'}`}>
                        Carta
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'bonifico' }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === 'bonifico'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <Landmark className={`w-6 h-6 mb-2 ${formData.paymentMethod === 'bonifico' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'bonifico' ? 'text-blue-900' : 'text-gray-700'}`}>
                        Bonifico
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'bonifico_istantaneo' }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === 'bonifico_istantaneo'
                          ? 'border-green-600 bg-green-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-green-400 hover:bg-green-50'
                      }`}
                    >
                      <CheckCircle2 className={`w-6 h-6 mb-2 ${formData.paymentMethod === 'bonifico_istantaneo' ? 'text-green-600' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'bonifico_istantaneo' ? 'text-green-900' : 'text-gray-700'}`}>
                        Bonifico Istantaneo
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'contanti' }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === 'contanti'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <Banknote className={`w-6 h-6 mb-2 ${formData.paymentMethod === 'contanti' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'contanti' ? 'text-blue-900' : 'text-gray-700'}`}>
                        Contanti
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'pos' }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === 'pos'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <Smartphone className={`w-6 h-6 mb-2 ${formData.paymentMethod === 'pos' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'pos' ? 'text-blue-900' : 'text-gray-700'}`}>
                        POS
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, paymentMethod: 'altro' }))}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                        formData.paymentMethod === 'altro'
                          ? 'border-blue-600 bg-blue-50 shadow-md'
                          : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50'
                      }`}
                    >
                      <CheckCircle2 className={`w-6 h-6 mb-2 ${formData.paymentMethod === 'altro' ? 'text-blue-600' : 'text-gray-600'}`} />
                      <span className={`text-sm font-medium ${formData.paymentMethod === 'altro' ? 'text-blue-900' : 'text-gray-700'}`}>
                        Altro
                      </span>
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {formData.paymentMethod === 'stripe' && 'Pagamento online immediato con carta di credito/debito'}
                    {formData.paymentMethod === 'bonifico' && 'Riceverai le coordinate bancarie per effettuare il bonifico'}
                    {formData.paymentMethod === 'bonifico_istantaneo' && 'Hai già effettuato il bonifico istantaneo - riceverai la fattura via email'}
                    {formData.paymentMethod === 'contanti' && 'Pagamento in contanti già effettuato in sede'}
                    {formData.paymentMethod === 'pos' && 'Pagamento con POS già effettuato in sede'}
                    {formData.paymentMethod === 'altro' && 'Altro metodo di pagamento'}
                  </p>
                </div>
              </div>

              {amount > 0 && (
                <div className="mt-4 p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Importo servizio</span>
                    <span className="text-lg font-semibold text-gray-900">€{amount.toFixed(2)}</span>
                  </div>
                  {stampDuty > 0 && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-blue-200">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Marca da bollo</span>
                        <span className="text-xs text-gray-500">(per importi &gt; €77,47)</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">€{stampDuty.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-base font-bold text-gray-900">Totale da pagare</span>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        €{total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sezione Dati Anagrafici */}
            <div className="space-y-6 pb-8 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Dati Anagrafici</h3>
                  <p className="text-sm text-gray-500">I tuoi dati personali per la fatturazione</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nome e Cognome *</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Es: Mario Rossi"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="mario.rossi@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefono *</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+39 333 1234567"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <FiscalCodeInput
                    value={formData.fiscalCode}
                    onChange={(value) => setFormData(prev => ({ ...prev, fiscalCode: value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birthDate">Data di Nascita *</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="luogoNascita">Luogo di Nascita *</Label>
                  <Input
                    id="luogoNascita"
                    name="luogoNascita"
                    placeholder="Es: Roma"
                    value={formData.luogoNascita}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sezione Indirizzo */}
            <div className="space-y-6 pb-8">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 text-purple-600">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Indirizzo</h3>
                  <p className="text-sm text-gray-500">Dove risiedi o hai la sede legale</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="indirizzo">Via e Numero Civico *</Label>
                  <Input
                    id="indirizzo"
                    name="indirizzo"
                    placeholder="Es: Via Roma, 10"
                    value={formData.indirizzo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="citta">Città *</Label>
                  <Input
                    id="citta"
                    name="citta"
                    placeholder="Es: Roma"
                    value={formData.citta}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="provincia">Provincia (sigla) *</Label>
                  <Input
                    id="provincia"
                    name="provincia"
                    placeholder="Es: RM"
                    maxLength={2}
                    value={formData.provincia}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="cap">CAP *</Label>
                  <Input
                    id="cap"
                    name="cap"
                    placeholder="00100"
                    value={formData.cap}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Privacy e Submit */}
            <div className="space-y-5 pt-2">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-amber-900 mb-2">Informativa Privacy & GDPR</h4>
                    <p className="text-sm text-amber-800 leading-relaxed mb-4">
                      I tuoi dati personali saranno trattati esclusivamente per le finalità mediche indicate nel modulo di consenso. 
                      Non verranno salvati sui nostri server ma solo inviati tramite email sicura al centro medico. 
                      Hai diritto di accesso, rettifica, cancellazione e portabilità dei tuoi dati secondo il Regolamento UE 2016/679.
                    </p>
                    
                    {/* Checkbox GDPR obbligatorie */}
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-300">
                        <input
                          type="checkbox"
                          id="gdprConsent"
                          name="gdprConsent"
                          checked={formData.gdprConsent}
                          onChange={handleChange}
                          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          required
                        />
                        <label htmlFor="gdprConsent" className="text-sm text-amber-900 cursor-pointer">
                          <strong>Accetto il trattamento dei dati personali secondo l'informativa GDPR *</strong>
                        </label>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-amber-300">
                        <input
                          type="checkbox"
                          id="privacyConsent"
                          name="privacyConsent"
                          checked={formData.privacyConsent}
                          onChange={handleChange}
                          className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          required
                        />
                        <label htmlFor="privacyConsent" className="text-sm text-amber-900 cursor-pointer">
                          <strong>Presto il consenso per il trattamento dei dati personali e sensibili come descritto nel modulo *</strong>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5 shadow-sm animate-shake">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-red-900">Errore nel pagamento</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                disabled={isLoading || amount <= 0}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Reindirizzamento in corso...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <CreditCard className="w-5 h-5" />
                    <span>Procedi al Pagamento Sicuro - €{total.toFixed(2)}</span>
                  </div>
                )}
              </Button>

              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <p>Pagamento sicuro tramite Stripe - I tuoi dati sono protetti</p>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Info */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="text-center">
            <h3 className="font-semibold text-gray-900 mb-4">Centro Biofertility - JUNIOR S.R.L.</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
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
              <div>
                <p className="font-medium text-gray-900 mb-1">Contatti</p>
                <p>Tel: 06 841 5269</p>
                <p>Email: centrimanna2@gmail.com</p>
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">Dati Fiscali</p>
                <p>P.IVA: 05470161000</p>
                <p>PEC: juniorsrlroma@pec.it</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPrivacyPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Modulo Privacy</h3>
              <p className="text-gray-600 text-sm">
                Hai già compilato e firmato il modulo privacy per il trattamento dei dati personali e sensibili con il Centro Biofertility?
              </p>
            </div>
            
            <div className="space-y-3 mb-6">
              <Button
                onClick={() => {
                  setGeneratePrivacy(false);
                  proceedWithSubmission();
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
              >
                ✅ Sì, ho già firmato il modulo privacy
              </Button>
              <Button
                onClick={() => {
                  setGeneratePrivacy(true);
                  proceedWithSubmission();
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
              >
                📝 No, è la prima volta - Genera modulo privacy
              </Button>
            </div>
            
            <Button
              onClick={() => setShowPrivacyPopup(false)}
              className="text-gray-500 hover:text-gray-700"
              variant="ghost"
            >
              Annulla
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}