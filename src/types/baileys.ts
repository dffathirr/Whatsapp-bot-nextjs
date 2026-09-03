export interface IncomingMessage {
  id?: string;
  jid?: string;
  fromNumber?: string;
  fromName: string;
  type: string;
  text: string;
}
