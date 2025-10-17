declare module '@fattureincloud/fattureincloud-js-sdk' {
  export class ApiClient {
    static instance: ApiClient;
    authentications: {
      OAuth2Authentication: {
        accessToken: string;
      };
    };
  }

  interface ClientData {
    data: {
      name: string;
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      tax_code: string;
      address_street: string;
      address_postal_code: string;
      address_city: string;
      address_province: string;
      country?: string;
    };
  }

  interface ClientResponse {
    data: {
      id: number;
      name: string;
      email: string;
      phone: string;
      address_street: string;
      address_postal_code: string;
      address_city: string;
      address_province: string;
    }[];
  }

  interface PaymentAccount {
    id: number;
    name: string;
  }

  interface PaymentAccountsResponse {
    data: PaymentAccount[];
  }

  interface InvoiceData {
    data: {
      type: string;
      entity: Record<string, unknown>;
      date: string;
      language: { code: string };
      currency: { id: string; exchange_rate: string; symbol: string };
      show_totals: string;
      show_payments: boolean;
      show_notification_button: boolean;
      e_invoice: boolean;
      stamp_duty: number;
      items_list: IssuedDocumentItemsListItem[];
      payments_list: IssuedDocumentPaymentsListItem[];
      ei_data: {
        payment_method: string;
      };
      show_payment_method: boolean;
      payment_method: {
        name: string;
      };
    };
  }

  interface InvoiceResponse {
    data: {
      id: number;
    };
  }

  export class ClientsApi {
    listClients(companyId: number, perPage?: number, page?: number, query?: string): Promise<ClientResponse>;
    createClient(companyId: number, data: ClientData): Promise<{ data: { id: number } }>;
    modifyClient(companyId: number, clientId: number, data: { data: Partial<ClientData['data']> }): Promise<unknown>;
  }

  export class IssuedDocumentsApi {
    createIssuedDocument(companyId: number, data: InvoiceData): Promise<InvoiceResponse>;
  }

  export class SettingsApi {
    listPaymentAccounts(companyId: number): Promise<PaymentAccountsResponse>;
  }

  export namespace FattureInCloudSDK {
    export interface IssuedDocumentItemsListItem {
      name: string;
      description: string;
      qty: number;
      net_price: number;
      vat: {
        id: number;
        value: number;
        description: string;
      };
    }

    export interface IssuedDocumentPaymentsListItem {
      amount: number;
      due_date: string;
      paid_date: string | null;
      status: string;
      payment_terms: {
        type: string;
      };
      payment_account: { id: number } | null;
    }

    export interface IssuedDocument {
      type: string;
      entity: Record<string, unknown>;
      date: string;
      language: { code: string };
      currency: { id: string; exchange_rate: string; symbol: string };
      show_totals: string;
      show_payments: boolean;
      show_notification_button: boolean;
      e_invoice: boolean;
      stamp_duty: number;
      items_list: IssuedDocumentItemsListItem[];
      payments_list: IssuedDocumentPaymentsListItem[];
      ei_data: {
        payment_method: string;
      };
      show_payment_method: boolean;
      payment_method: {
        name: string;
      };
    }
  }
}