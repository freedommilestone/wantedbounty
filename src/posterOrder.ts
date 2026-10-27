import type { SolQuote } from './payment';

export interface SavedOrder {id:string;token:string;signature?:string;quote?:SolQuote;treasury:string;}
export interface OrderResult {
  status:'pending'|'generating'|'ready'|'review'; image?:string; signature?:string; message?:string;
  details?:{name:string;condition:string;bounty:string};
}
const KEY='wanted-poster-order-v1';
export function readOrder():SavedOrder|null {
  try {return JSON.parse(localStorage.getItem(KEY)||'null');} catch {return null;}
}
export function saveOrder(order:SavedOrder) {
  // Refuse to request a payment if this browser cannot retain its recovery token.
  localStorage.setItem(KEY,JSON.stringify(order));
}
export async function orderRequest<T>(body:object):Promise<T> {
  const response=await fetch('/api/poster-order',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const data=await response.json();
  if(!response.ok) throw new Error(data.error||'Poster service is unavailable. Please retry.');
  return data;
}
